(function(Backbone, _) {
  var BackboneModelPrototype = Backbone.Model.prototype

  function setNestedAttributes(model, key, value, options) {
    var attributes = attributesFor(key, value, options)

    if (attributes) {
      _(model.relations).each(function (relation) {
        setNestedAttributeFor(model, relation, attributes)
      })
    }

    configureNestedAttributesEvents(model)

    return attributes
  }

  function setNestedAttributeFor(model, relation, attributes) {
    var key           = relation.key,
        value         = attributes[key],
        currentValue  = model.get(key),
        collection    = currentValue || createNestedAttributeCollection(relation)

    value = value instanceof Backbone.Collection ? value.slice() : value

    configureEventBubbling(model, collection, relation)
    collection.set(value)
    attributes[key] = collection

    return attributes
  }

  function configureNestedAttributesEvents(model) {
    if (!model._hasNestedAttributesEventsConfigured) {
      model.on('sync', function () {
        _(model.relations).each(function (relation) {
          var collection = model.get(relation.key)

          collection.deletedModels.reset()
        })
      })

      model._hasNestedAttributesEventsConfigured = true
    }
  }

  function configureEventBubbling(model, collection, relation) {
    if (!collection._hasEventBubblingConfigured) {
      model.listenTo(collection, 'add change nested:change remove', function (nestedModel, options) {
        model.trigger('nested:change change:' + relation.key, nestedModel, options)
      })

      collection._hasEventBubblingConfigured = true
    }
  }

  function clearNestedCollectionEvents(model) {
    _(model.relations).each(function (relation) {
      var collection = model.get(relation.key)

      model.stopListening(collection)
      collection.off('remove', nestedModelRemoved, collection)
      collection.deletedModels.reset()
    }, model)
  }

  function nestedToJson(json, relations, options) {
    _(relations).each(function (relation) {
      var key     = relation.key,
          value   = json[key],
          deleted = []

      if (value) {
        if (options && options.nested) {
          delete json[key]
          key = key + '_attributes'

          deleted = value.deletedModels.toJSON(options)
        }

        json[key] = value.toJSON(options).concat(deleted)
      }
    })

    return json
  }

  function createNestedAttributeCollection(relation) {
    var CollectionType = _(relation).result('collectionType') || Backbone.Collection,
        collection     = new CollectionType

    collection.model = _(relation).result('relatedModel') || collection.model

    collection.deletedModels = new Backbone.Collection
    collection.on('remove', nestedModelRemoved, collection)

    return collection
  }

  function nestedModelRemoved(model) {
    if (!model.isNew()) {
      model.set({ _destroy: true })
      this.deletedModels.add(model) // this refers to the collection
    }
  }

  function attributesFor(key, value, options) {
    var attributes

    // Duplicate backbone's behavior to allow separate key/value parameters,
    // instead of a single 'attributes' object.
    if (_.isObject(key) || key == null) {
      attributes = key
      options = value
    } else {
      attributes = {}
      attributes[key] = value
    }

    return attributes
  }

  Backbone.NestedAttributesModel = Backbone.Model.extend({
    set: function (key, value, options) {
      var attributes = setNestedAttributes(this, key, value, options)
      return BackboneModelPrototype.set.call(this, attributes, options)
    },

    toJSON: function (options) {
      return nestedToJson(BackboneModelPrototype.toJSON.apply(this, arguments), this.relations, options)
    },

    clone: function() {
      return new this.constructor(this.toJSON());
    },

    clear: function (options) {
      clearNestedCollectionEvents(this)
      return BackboneModelPrototype.clear.apply(this, arguments)
    }
  })
})(Backbone, _)