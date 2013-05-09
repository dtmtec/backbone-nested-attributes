(function(){
  var BackboneModelPrototype = Backbone.Model.prototype

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

      if (!attributes) {
        return this
      }

      _(this.relations).each(function (relation) {
        var key   = relation.key,
            value = attributes[key],
            currentValue,
            collection

        if (value) {
          currentValue = this.get(key)
          value        = value instanceof Backbone.Collection ? value.slice() : value

          if (currentValue) {
            collection = currentValue
            collection.set(value)
          } else {
            collection = this._createNestedAttributeCollection(relation)
            collection.add(value)
          }

          attributes[key] = collection
        } else {
          attributes[key] = this._createNestedAttributeCollection(relation)
        }

      }, this)

      return BackboneModelPrototype.set.call(this, attributes, options)
    },

    toJSON: function (options) {
      var json = BackboneModelPrototype.toJSON.apply(this, arguments),
          relationJson

      _(this.relations).each(function (relation) {
        relationJson = json[relation.key]

        if (relationJson) {
          json[relation.key] = json[relation.key].toJSON(options)
        }
      }, this)

      return json
    },

    _createNestedAttributeCollection: function (relation) {
      var CollectionType = _(relation).result('collectionType') || Backbone.Collection,
          collection     = new CollectionType

      collection.model = _(relation).result('relatedModel') || collection.model

      return collection
    }
  })
})()