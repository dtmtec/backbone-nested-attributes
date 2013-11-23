describe("Backbone.UndoableModel", function() {
  var model,
      originalAttributes,
      afterSyncAttributes,
      called,
      post,
      Post,
      comments,
      comment,
      Comment,
      author,
      Person

  beforeEach(function() {
    jasmine.Ajax.install()
    called = false

    originalAttributes = { title: 'some title', body: 'some body' }
    model = new Backbone.UndoableModel(originalAttributes)
    model.url = 'http://someapi.com'
  })

  function stubSyncFor(model) {
    jasmine.Ajax.stubRequest('http://someapi.com').andReturn({ status: 200, responseText: model.toJSON() })
  }

  it("should be a Backbone.NestedAttributesModel", function() {
    expect(model instanceof Backbone.NestedAttributesModel).toBeTruthy()
  })

  describe("when the initialize method is overriden", function() {
    var Model

    describe("and the undoable method is not called", function() {
      beforeEach(function() {
        Model = Backbone.UndoableModel.extend({
          initialize: function () {}
        })

        model = new Model(originalAttributes)
      })

      it("does not reverts the model own attributes to its original attributes", function() {
        model.set({ title: 'new title', body: 'new body' })
        model.undo()

        expect(model.toJSON()).not.toEqual(originalAttributes)
      })
    })

    describe("and the undoable method is called", function() {
      describe("in the initialize method", function() {
        beforeEach(function() {
          Model = Backbone.UndoableModel.extend({
            initialize: function () {
              this.undoable()
            }
          })

          model = new Model(originalAttributes)
        })

        it("reverts the model own attributes to its original attributes", function() {
          model.set({ title: 'new title', body: 'new body' })
          model.undo()

          expect(model.toJSON()).toEqual(originalAttributes)
        })
      })

      describe("by calling the super method", function() {
        beforeEach(function() {
          Model = Backbone.UndoableModel.extend({
            initialize: function () {
              Backbone.UndoableModel.prototype.initialize.apply(this, arguments)
            }
          })

          model = new Model(originalAttributes)
        })

        it("reverts the model own attributes to its original attributes", function() {
          model.set({ title: 'new title', body: 'new body' })
          model.undo()

          expect(model.toJSON()).toEqual(originalAttributes)
        })
      })

      describe("after it is initialized", function() {
        beforeEach(function() {
          Model = Backbone.UndoableModel.extend({})

          model = new Model(originalAttributes)
        })

        it("reverts the model own attributes to the attributes that the model had before calling undoable", function() {
          var beforeUndoableAttributes = { title: 'before undoable title', body: 'before undoable body' }

          model.set(beforeUndoableAttributes)
          model.undoable()
          model.set({ title: 'new title', body: 'new body' })
          model.undo()

          expect(model.toJSON()).toEqual(beforeUndoableAttributes)
        })
      })
    })
  })

  describe("when it is a new model", function() {
    it("should not have changes since sync", function() {
      expect(model.hasChangedSinceSync()).toBeFalsy()
    })

    describe("and it is changed", function() {
      it("should have changes since sync", function() {
        model.set({ title: 'new title', body: 'new body' })
        expect(model.hasChangedSinceSync()).toBeTruthy()
      })

      describe("and then undo", function() {
        it("should not have changes since sync", function() {
          model.set({ title: 'new title', body: 'new body' })
          model.undo()
          expect(model.hasChangedSinceSync()).toBeFalsy()
        })

        it("reverts the model own attributes to its original attributes", function() {
          model.set({ title: 'new title', body: 'new body' })
          model.undo()

          expect(model.toJSON()).toEqual(originalAttributes)
        })
      })

      describe("and then sync", function() {
        it("should not have changes since sync", function() {
          model.set({ title: 'new title', body: 'new body' })

          stubSyncFor(model)
          model.save()

          expect(model.hasChangedSinceSync()).toBeFalsy()
        })

        describe("then undo", function() {
          it("reverts the model own attributes to their value right after sync", function() {
            model.set({ title: 'sync title', body: 'sync body' })

            stubSyncFor(model)
            model.save()

            afterSyncAttributes = model.toJSON()

            model.set({ title: 'new title', body: 'new body' })
            model.undo()

            expect(model.toJSON()).toEqual(afterSyncAttributes)
          })
        })
      })
    })
  })

  describe("when it is an existing model", function() {
    beforeEach(function() {

      originalAttributes = { id: 123, title: 'some title', body: 'some body' }
      model = new Backbone.UndoableModel(originalAttributes)
      model.url = 'http://someapi.com'
    })

    describe("and it is changed", function() {
      it("should have changes since sync", function() {
        model.set({ title: 'new title', body: 'new body' })
        expect(model.hasChangedSinceSync()).toBeTruthy()
      })

      describe("and then undo", function() {
        it("should not have changes since sync", function() {
          model.set({ title: 'new title', body: 'new body' })
          model.undo()
          expect(model.hasChangedSinceSync()).toBeFalsy()
        })

        it("reverts the model own attributes to its original attributes", function() {
          model.set({ title: 'new title', body: 'new body' })
          model.undo()

          expect(model.toJSON()).toEqual(originalAttributes)
        })
      })

      describe("and then sync", function() {
        it("should not have changes since sync", function() {
          model.set({ title: 'new title', body: 'new body' })

          stubSyncFor(model)
          model.save()

          expect(model.hasChangedSinceSync()).toBeFalsy()
        })

        describe("then undo", function() {
          it("reverts the model own attributes to their value right after sync", function() {
            model.set({ title: 'sync title', body: 'sync body' })

            stubSyncFor(model)
            model.save()

            afterSyncAttributes = model.toJSON()

            model.set({ title: 'new title', body: 'new body' })
            model.undo()

            expect(model.toJSON()).toEqual(afterSyncAttributes)
          })
        })
      })
    })
  })

  describe("state:restore event", function() {
    var called

    beforeEach(function() {
      called = false
    })

    it("is triggered when the model is undo", function() {
      model.on('state:restore', function () {
        called = true
      })

      model.undo()
      expect(called).toBeTruthy()
    })
  })

  describe("state:store event", function() {
    it("is triggered when the model is saved", function() {
      model.on('state:store', function () {
        called = true
      })

      stubSyncFor(model)
      model.save()

      expect(called).toBeTruthy()
    })

    describe("when it is a new model", function() {
      it("is triggered when the model is saved", function() {
        model.on('state:store', function () {
          called = true
        })

        stubSyncFor(model)
        model.save()

        expect(called).toBeTruthy()
      })

      it("is not triggered when the model is destroyed", function() {
        model.on('state:store', function () {
          called = true
        })

        stubSyncFor(model)
        model.destroy()

        expect(called).toBeFalsy()
      })
    })

    describe("when it is not a new model", function() {
      beforeEach(function() {
        model.set({ id: 123 })
      });

      it("is triggered when the model is saved", function() {
        model.on('state:store', function () {
          called = true
        })

        stubSyncFor(model)
        model.save()

        expect(called).toBeTruthy()
      })

      it("is triggered when the model is destroyed", function() {
        model.on('state:store', function () {
          called = true
        })

        stubSyncFor(model)
        model.destroy()

        expect(called).toBeTruthy()
      })
    })
  })

  describe("when an attribute is added", function() {
    it("unsets this attribute on undo", function() {
      model.set({ newAttr: 'foo' })
      model.undo()
      expect(model.has('newAttr')).toBeFalsy()
    })
  })

  describe("when it has a has one relationship", function() {
    beforeEach(function() {
      Post = Backbone.UndoableModel.extend({
        relations: [
          {
            type: 'one',
            key:  'author',
            relatedModel: function () { return Person }
          }
        ]
      })

      Person = Backbone.UndoableModel.extend({})

      originalAttributes = { title: 'some title', author: { name: 'Jon Snow' } }
      post = new Post(_(originalAttributes).clone())
      author = post.get('author')
    })

    describe("and a nested model changes", function() {
      it("should have changes since sync", function() {
        author.set({ name: 'Robb Stark' })
        expect(author.hasChangedSinceSync()).toBeTruthy()
      })

      it("its parent should have changes since sync", function() {
        author.set({ name: 'Robb Stark' })
        expect(post.hasChangedSinceSync()).toBeTruthy()
      })

      describe("and the nested model state is saved", function() {
        it("should not have changes since sync", function() {
          author.set({ name: 'Robb Stark' })
          author.saveState()
          expect(author.hasChangedSinceSync()).toBeFalsy()
        })

        it("its parent should have changes since sync", function() {
          author.set({ name: 'Robb Stark' })
          author.saveState()
          expect(post.hasChangedSinceSync()).toBeTruthy()
        })

        describe("when undoing changes", function() {
          it("revert to the last saved state", function() {
            author.set({ name: 'Robb Stark' })
            author.saveState()
            author.set({ name: 'Tyrion Lanninster' })
            author.undo()
            expect(author.get('name')).toEqual('Robb Stark')
          })
        })
      })
    })

    describe("undoing a change", function() {
      describe("in its own attributes", function() {
        it("reverts the model own attributes to its original attributes", function() {
          post.set({ title: 'new title' })
          post.undo()

          expect(post.toJSON()).toEqual(originalAttributes)
        })
      })

      describe("in a nested model", function() {
        it("reverts the model own attributes as well as the nested ones to its original attributes, creating a new model reference", function() {
          author.set({ name: 'Robb Stark' })
          post.undo()

          expect(post.toJSON()).toEqual(originalAttributes)
          expect(post.get('author')).not.toEqual(author)
        })
      })
    })

    describe("undoing a nested model", function() {
      it("does not trigger a state:restore event on the parent model", function() {
        post.on('state:restore', function () {
          called = true
        })

        author.undo()
        expect(called).toBeFalsy()
      })

      it("trigger a state:restore event on the nested model", function() {
        author.on('state:restore', function () {
          called = true
        })

        author.undo()
        expect(called).toBeTruthy()
      })
    })
  })

  describe("when it has a has many relationship", function() {
    beforeEach(function() {
      Post = Backbone.UndoableModel.extend({
        relations: [
          {
            key:  'comments',
            relatedModel: function () { return Comment }
          }
        ]
      })

      Comment = Backbone.UndoableModel.extend({})

      originalAttributes = { title: 'some title', comments: [ { body: 'some body' } ] }
      post = new Post(_(originalAttributes).clone())
      comments = post.get('comments')
      comment = comments.at(0)
    })

    describe("and a nested model changes", function() {
      it("should have changes since sync", function() {
        comment.set({ body: 'new body' })
        expect(comment.hasChangedSinceSync()).toBeTruthy()
      })

      it("its parent should have changes since sync", function() {
        comment.set({ body: 'new body' })
        expect(post.hasChangedSinceSync()).toBeTruthy()
      })

      describe("and the nested model state is saved", function() {
        it("should not have changes since sync", function() {
          comment.set({ body: 'new body' })
          comment.saveState()
          expect(comment.hasChangedSinceSync()).toBeFalsy()
        })

        it("its parent should have changes since sync", function() {
          comment.set({ body: 'new body' })
          comment.saveState()
          expect(post.hasChangedSinceSync()).toBeTruthy()
        })

        describe("when undoing changes", function() {
          it("revert to the last saved state", function() {
            comment.set({ body: 'new body' })
            comment.saveState()
            comment.set({ body: 'other body' })
            comment.undo()
            expect(comment.get('body')).toEqual('new body')
          })
        })
      })
    })

    describe("undoing a change", function() {
      describe("in its own attributes", function() {
        it("reverts the model own attributes to its original attributes", function() {
          post.set({ title: 'new title' })
          post.undo()

          expect(post.toJSON()).toEqual(originalAttributes)
        })
      })

      describe("in a nested model", function() {
        it("reverts the model own attributes as well as the nested ones to its original attributes, keeping the existing collection untouched", function() {
          comment.set({ body: 'new body' })
          post.undo()

          expect(post.toJSON()).toEqual(originalAttributes)
          expect(post.get('comments')).toEqual(comments)
        })
      })
    })

    describe("undoing a nested model", function() {
      it("does not trigger a state:restore event on the parent model", function() {
        post.on('state:restore', function () {
          called = true
        })

        comment.undo()
        expect(called).toBeFalsy()
      })

      it("trigger a state:restore event on the nested model", function() {
        comment.on('state:restore', function () {
          called = true
        })

        comment.undo()
        expect(called).toBeTruthy()
      })
    })


    describe("when undoing changes after a nested model had been removed", function() {
      beforeEach(function() {
        originalAttributes = { id: 321, title: 'some title', comments: [ { id: 123, body: 'some body' } ] }
        post = new Post(_(originalAttributes).clone())
        comments = post.get('comments')
        comment = comments.at(0)

        comments.remove(comment)
      })

      it("undoes the deletedModels in the relation collection as well", function() {
        post.undo()
        expect(comments.deletedModels.length).toEqual(0)
      })

      describe("and the state saved", function() {
        beforeEach(function() {
          post.saveState()
        })

        it("keeps the deletedModels in the relation collection", function() {
          post.undo()
          expect(comments.deletedModels.at(0)).toBe(comment)
        })
      })
    })

    describe("when undoing changes after a undo", function() {
      it("reverts the changes properly", function() {
        post.set({ comments: [{ id: 123, body: 'first body' }] })
        post.undo()
        post.set({ comments: [{ id: 123, body: 'last body' }] })
        post.undo()
        expect(post.get('comments').at(0).get('body')).toEqual('some body')
      })

      describe("on a deep nested model", function() {
        var Tag, tag

        beforeEach(function() {
          Comment = Backbone.UndoableModel.extend({
            relations: [
              {
                key: 'tags',
                relatedModel: function () { return Tag }
              }
            ]
          })

          Tag = Backbone.UndoableModel.extend({})

          originalAttributes = { id: 321, title: 'some title', comments: [ { id: 123, body: 'some body', tags: [ { id: 456, name: 'javascript' } ] } ] }
          post = new Post(originalAttributes)
        })

        it("reverts the changes properly", function() {
          post.set({ comments: [ { id: 123, body: 'some body', tags: [ { id: 456, name: 'ruby' } ] } ] })
          post.undo()
          post.set({ comments: [ { id: 123, body: 'some body', tags: [ { id: 456, name: 'python' } ] } ] })
          post.undo()

          expect(post.get('comments').at(0).get('tags').at(0).get('name')).toEqual('javascript')
        })
      })
    })
  })
})
