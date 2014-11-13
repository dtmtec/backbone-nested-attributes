(function(Backbone, _) {
  var BackboneModelPrototype = Backbone.Model.prototype

  function setNestedAttributes(model, attributes) {
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

    nested.parentModel = model

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

      if (collectionOrModel && collectionOrModel.each) {
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
          jsonValue = jsonValue.concat(deleted)
        }

        if (relation.serialize_keys) {
          if (_(jsonValue).isArray()) {
            jsonValue = _.map(jsonValue, function(j) { return _.pick(j, relation.serialize_keys) })
          } else {
            jsonValue = _.pick(jsonValue, relation.serialize_keys)
          }
        }

        json[key] = jsonValue
      }
    })

    return json
  }

  function createNestedAttributeCollection(relation) {
    var CollectionType = _(relation).result('collectionType') || Backbone.Collection,
        collection     = new CollectionType

    collection.model = _(relation).result('relatedModel') || collection.model
    collection.destroy_action = relation.destroy_action || '_destroy'

    if (relation.serialize_keys) {
      relation.serialize_keys.push(collection.destroy_action)
    }

    collection.deletedModels = new Backbone.Collection
    collection.deletedModels.model = collection.model
    collection.on('add', nestedModelAdded)
    collection.on('remove', nestedModelRemoved)

    return collection
  }

  function nestedModelAdded(model, collection) {
    if (model.get(collection.destroy_action)) {
      collection.remove(model)
    }
  }

  function nestedModelRemoved(model, collection) {
    if (!model.isNew()) {
      param = {}
      param[collection.destroy_action] = true
      model.set(param)
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

      return BackboneModelPrototype.set.call(this, setNestedAttributes(this, attributes), options)
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
    },

    parentModel: function() {
       return this.collection.parentModel
    },
  })
})(Backbone, _);
