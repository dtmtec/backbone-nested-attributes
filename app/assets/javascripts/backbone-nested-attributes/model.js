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
        deletedValue  = attributes['deleted_' + key],
        currentValue  = model.get(key),
        nested        = currentValue || createNestedAttributeCollection(relation)

    value = valueOrSliceCollection(value)

    configureEventBubbling(model, nested, relation)

    if (value) {
      nested.set(value)
    }

    if (deletedValue) {
      delete attributes['deleted_' + key]

      deletedValue = valueOrSliceCollection(deletedValue)
      nested.deletedModels.set(deletedValue)
    }

    attributes[key] = nested

    return attributes
  }

  function valueOrSliceCollection(value) {
    return value instanceof Backbone.Collection ? value.slice() : value
  }

  function clearDeletedModelsFor(model) {
    _(model.relations).each(function (relation) {
      var collectionOrModel = model.get(relation.key)

      if (collectionOrModel.each) {
        collectionOrModel.each(function (nestedModel) {
          clearDeletedModelsFor(nestedModel)
        })

        if (collectionOrModel.deletedModels) {
          collectionOrModel.deletedModels.reset()
        }
      }
    })
  }

  function configureNestedAttributesEvents(model) {
    if (!model._hasNestedAttributesEventsConfigured) {
      model.on('sync', clearDeletedModelsFor)
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
        if (options) {
          if (options.withDeleted) {
            if (value.deletedModels) {
              json['deleted_' + key] = value.deletedModels.toJSON(options)
            }
          }

          if (options.nested) {
            if (value.deletedModels) {
              deleted = value.deletedModels.toJSON(options)
            }

            delete json[key]
            key = key + '_attributes'
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
    collection.deletedModels.model = collection.model
    collection.on('remove', nestedModelRemoved)

    return collection
  }

  function nestedModelRemoved(model, collection) {
    if (!model.isNew()) {
      model.set({ _destroy: true })
      collection.deletedModels.add(model)
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
