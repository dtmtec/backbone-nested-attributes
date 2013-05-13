(function(Backbone, _) {
  var BackboneModelPrototype = Backbone.Model.prototype

  function setNestedAttributes(model, key, value, options) {
    var attributes = attributesFor(key, value, options)

    if (attributes) {
      _(model.relations).each(function (relation) {
        if (relation.type == 'one') {
          setHasOneNestedAttributeFor(model, relation, attributes)
        } else {
          setNestedAttributeFor(model, relation, attributes)
        }
      })
    }

    configureNestedAttributesEvents(model)

    return attributes
  }

  function setHasOneNestedAttributeFor(model, relation, attributes) {
    var key           = relation.key,
        value         = attributes[key],
        ModelClass    = _(relation).result('relatedModel')

    if (value) {
      value = value instanceof Backbone.Model ? value : new ModelClass(value)

      configureEventBubbling(model, value, relation)
      attributes[key] = value
    }
  }

  function setNestedAttributeFor(model, relation, attributes) {
    var key           = relation.key,
        value         = attributes[key],
        currentValue  = model.get(key),
        nested        = currentValue || createNestedAttributeCollection(relation)

    value = value instanceof Backbone.Collection ? value.slice() : value

    configureEventBubbling(model, nested, relation)
    nested.set(value)
    attributes[key] = nested

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

  function configureEventBubbling(model, nested, relation) {
    if (!nested._hasEventBubblingConfigured) {
      model.listenTo(nested, 'add change nested:change remove', function (nestedModel, options) {
        model.trigger('nested:change change:' + relation.key, nestedModel, options)
      })

      nested._hasEventBubblingConfigured = true
    }
  }

  function clearNestedEvents(model) {
    _(model.relations).each(function (relation) {
      var nested = model.get(relation.key)

      model.stopListening(nested)
      nested.off('remove', nestedModelRemoved, nested)

      if (nested.deletedModels) {
        nested.deletedModels.reset()
      }
    }, model)
  }

  function nestedToJson(json, relations, options) {
    _(relations).each(function (relation) {
      var key     = relation.key,
          value   = json[key],
          deleted = [],
          jsonValue

      if (value) {
        if (options && options.nested) {
          delete json[key]
          key = key + '_attributes'

          if (value.deletedModels) {
            deleted = value.deletedModels.toJSON(options)
          }
        }

        jsonValue = value.toJSON(options)

        if (_(jsonValue).isArray()) {
          json[key] = jsonValue.concat(deleted)
        } else {
          json[key] = jsonValue
        }
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
      clearNestedEvents(this)
      return BackboneModelPrototype.clear.apply(this, arguments)
    }
  })
})(Backbone, _)