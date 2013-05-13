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
      this.attributes = this.model.toJSON()
      this.changed = false

      this.model.trigger('state:store')
    },

    undo: function () {
      this.model.set(this.attributes)
      this.changed = false

      this.model.trigger('state:restore')
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