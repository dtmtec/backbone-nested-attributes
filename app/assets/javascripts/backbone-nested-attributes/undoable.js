(function(Backbone, _) {
  var NestedAttributesModel      = Backbone.NestedAttributesModel,
      NestedAttributesModelProto = NestedAttributesModel.prototype

  function UndoableState(model) {
    this.model = model

    model.on('nested:change', this.change, this)
    model.on('change',        this.change, this)
    model.on('sync',          this.save,   this)
  }

  _.extend(UndoableState.prototype, Backbone.Events, {
    change: function () {
      this.changed = true
    },

    save: function () {
      this.updateAttributes()

      this.model.trigger('state:store')
    },

    undo: function () {
      this.attributesToUnset().each(function (attribute) {
        this.model.unset(attribute)
      }, this)

      this.model.set(this.attributes)

      this.updateAttributes()

      this.model.trigger('state:restore')
    },

    attributesToUnset: function () {
      var previousAttributes = _(this.attributes || {}).keys()

      return _(this.model.attributes).chain().keys().select(function (attribute) {
        return !_(previousAttributes).include(attribute)
      })
    },

    updateAttributes: function () {
      this.attributes = this.model.toJSON({ withDeleted: true })
      this.changed = false
    }
  })

  Backbone.UndoableModel = NestedAttributesModel.extend({
    initialize: function () {
      NestedAttributesModelProto.initialize.apply(this, arguments)

      this.undoable()
    },

    undoable: function () {
      this.saveState()
    },

    undo: function () {
      this.undoableState().undo()
    },

    hasChangedSinceSync: function () {
      return this.undoableState().changed === true
    },

    saveState: function () {
      this.undoableState().save()
    },

    undoableState: function () {
      return this._undoableState = this._undoableState || new UndoableState(this)
    }
  })
})(Backbone, _)