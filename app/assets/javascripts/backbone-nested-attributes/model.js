(function() {
  var BackboneModelPrototype = Backbone.Model.prototype

  function setNestedAttributes(model, key, value, options) {
    var attributes = attributesFor(key, value, options)

    if (attributes) {
      _(model.relations).each(function (relation) {
        setNestedAttributeFor(model, relation, attributes)
      })
    }

    return attributes
  }

  function setNestedAttributeFor(model, relation, attributes) {
    var key          = relation.key,
        value        = attributes[key],
        currentValue = model.get(key),
        collection   = currentValue || createNestedAttributeCollection(relation)

    value = value instanceof Backbone.Collection ? value.slice() : value

    collection.set(value)
    attributes[key] = collection

    return attributes
  }

  function nestedToJson(json, relations, options) {
    _(relations).each(function (relation) {
      relationJson = json[relation.key]

      if (relationJson) {
        json[relation.key] = relationJson.toJSON(options)
      }
    })

    return json
  }

  function createNestedAttributeCollection(relation) {
    var CollectionType = _(relation).result('collectionType') || Backbone.Collection,
        collection     = new CollectionType

    collection.model = _(relation).result('relatedModel') || collection.model

    return collection
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
    }
  })
})()