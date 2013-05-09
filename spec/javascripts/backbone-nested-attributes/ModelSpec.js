describe("Backbone.NestedAttributesModel", function() {
  var model, Post, post, Comment, comment

  beforeEach(function() {
    model = new Backbone.NestedAttributesModel({})
  })

  it("should be a Backbone.Model", function() {
    expect(model).toBeAnInstanceOf(Backbone.Model)
  })

  describe("with a has many relationship", function() {
    beforeEach(function() {
      Post = Backbone.NestedAttributesModel.extend({
        relations: [
          {
            key:  'comments',
            relatedModel: function () { return Comment }
          }
        ]
      })

      Comment = Backbone.NestedAttributesModel.extend({})
    })

    describe("when creating", function() {
      it("initializes the comments attribute with an empty collection", function() {
        model = new Post
        expect(model.get('comments')).toBeDefined()
        expect(model.get('comments')).toBeAnInstanceOf(Backbone.Collection)
      });

      describe("while setting attributes", function() {
        beforeEach(function() {
          model = new Post({ title: 'Some Title', comments: [{ body: 'some comment'} ] })
        })

        it("sets the normal attributes", function() {
          expect(model.get('title')).toEqual('Some Title')
        })

        it("creates the comment inside comments collection", function() {
          comment = model.get('comments').at(0)

          expect(comment).toBeAnInstanceOf(Comment)
          expect(comment.get('body')).toEqual('some comment')
        })

        describe("passing a collection to a relation attribute", function() {
          var comments, Comments

          beforeEach(function() {
            Comments = Backbone.Collection.extend({ model: Comment })
            comments = new Comments({ body: 'some comment' }, { body: 'some other comment' })
            model = new Post({ title: 'Some Title', comments: comments })
          })

          it("does not store the given collection, but instead creates a new one with models from the given collection", function() {
            expect(model.get('comments')).not.toBe(comments)
            expect(model.get('comments')).not.toBeAnInstanceOf(Comments)
            expect(model.get('comments')).toBeAnInstanceOf(Backbone.Collection)
            expect(model.get('comments').at(0)).toBe(comments.at(0))
            expect(model.get('comments').at(1)).toBe(comments.at(1))
          })
        })
      })
    })

    describe("when updating", function() {
      beforeEach(function() {
        model = new Post
      })

      it("creates the comment inside comments collection", function() {
        model.set({ comments: [{ body: 'some comment' }] })

        comment = model.get('comments').at(0)

        expect(comment).toBeAnInstanceOf(Comment)
        expect(comment.get('body')).toEqual('some comment')
      })

      it("does not creates a new collection, but updates it instead", function() {
        var originalCollection = model.get('comments')

        model.set({ comments: [{ body: 'some comment' }] })
        expect(model.get('comments')).toBe(originalCollection)
      })

      it("updates existing models in the collection", function() {
        var existingComment

        model.set({ comments: [{ id: '123', body: 'some comment' }] })
        existingComment = model.get('comments').at(0)

        model.set({ comments: [{ id: existingComment.id, body: 'some other comment' }] })

        expect(model.get('comments').at(0).get('body')).toEqual('some other comment')
      })

      it("allows passing key, value when setting a relation attribute", function() {
        model.set('comments', [{ body: 'some comment' }])

        comment = model.get('comments').at(0)

        expect(comment).toBeAnInstanceOf(Comment)
        expect(comment.get('body')).toEqual('some comment')
      })

      describe("passing a collection to a relation attribute", function() {
        var comments, Comments

        beforeEach(function() {
          Comments = Backbone.Collection.extend({ model: Comment })
          comments = new Comments({ body: 'some comment' }, { body: 'some other comment' })
          model = new Post
        })

        it("does not store the given collection, but instead updates the existing one with models from the given collection", function() {
          var originalCollection = model.get('comments')

          model.set({ title: 'Some Title', comments: comments })

          expect(model.get('comments')).toBe(originalCollection)
          expect(model.get('comments').at(0)).toBe(comments.at(0))
          expect(model.get('comments').at(1)).toBe(comments.at(1))
        })
      })
    })

    describe("cloning", function() {
      beforeEach(function() {
        post = new Post({ title: 'Some Title', comments: [{ body: 'some comment' }] })
      })

      it("creates a new post object, with the same attributes, including nested, but do not share the nested collections", function() {
        var newPost = post.clone()

        expect(newPost).not.toBe(post)
        expect(newPost.get('comments')).not.toBe(post.get('comments'))
        expect(newPost.get('comments').at(0)).not.toBe(post.get('comments').at(0))

        expect(newPost.get('title')).toEqual(post.get('title'))
        expect(newPost.get('comments').at(0).get('body')).toEqual(post.get('comments').at(0).get('body'))
      })
    })

    describe("specifying the collection type", function() {
      var Comments

      beforeEach(function() {
        Comments = Backbone.Collection.extend({ model: Comment })

        Post = Backbone.NestedAttributesModel.extend({
          relations: [
            {
              key:  'comments',
              collectionType: function () { return Comments }
            }
          ]
        })

        model = new Post({ title: 'Some Title', comments: [{ body: 'some comment' }] })
      })

      it("uses the given collection as the relation attribute", function() {
        expect(model.get('comments')).toBeAnInstanceOf(Comments)
        expect(model.get('comments').at(0)).toBeAnInstanceOf(Comment)
      })
    })

    describe("event bubbling", function() {
      var changedModel, changedCount

      beforeEach(function() {
        changedCount = 0
        changedModel = null

        model = new Post({ title: 'Some Title', comments: [{ body: 'some comment' }] })
        comment = model.get('comments').at(0)
      })

      describe("when a nested model is changed", function() {
        it("triggers a nested:change event on the parent, with the changed model as an argument", function() {
          model.on('nested:change', function (model) {
            changedModel = model
          })

          comment.set({ body: 'some new body' })
          expect(changedModel).toBe(comment)
        })

        it("triggers a nested:change only once, after setting nested attributes again", function() {
          model.set({ title: 'Some Title', comments: [{ body: 'some other comment' }] })
          comment = model.get('comments').at(0)

          model.on('nested:change', function (model) {
            changedModel = model
            changedCount += 1
          })

          comment.set({ body: 'some new body' })
          expect(changedModel).toBe(comment)
          expect(changedCount).toEqual(1)
        })

        it("triggers a change:<relationKey> event on the parent, with the changed model as an argument", function() {
          model.on('change:comments', function (model) {
            changedModel = model
          })

          comment.set({ body: 'some new body' })
          expect(changedModel).toBe(comment)
        })

        it("triggers a change:<relationKey> only once, after setting nested attributes again", function() {
          model.set({ title: 'Some Title', comments: [{ body: 'some other comment' }] })
          comment = model.get('comments').at(0)

          model.on('change:comments', function (model) {
            changedModel = model
            changedCount += 1
          })

          comment.set({ body: 'some new body' })
          expect(changedModel).toBe(comment)
          expect(changedCount).toEqual(1)
        })

        describe("and the nested model triggers a nested:change", function() {
          it("triggers a nested:change on the parent", function() {
            model.on('nested:change', function (model) {
              changedModel = model
            })

            comment.trigger('nested:change', comment)
            expect(changedModel).toBe(comment)
          })
        })
      })

      describe("when adding a new model to a nested relation", function() {
        it("triggers a nested:change event on the parent, with the added model as an argument", function() {
          model.on('nested:change', function (model) {
            changedModel = model
          })

          model.get('comments').add({ body: 'other comment' })
          comment = model.get('comments').at(1)
          expect(changedModel).toBe(comment)
        })

        it("triggers a change:<relationKey> event on the parent, with the added model as an argument", function() {
          model.on('change:comments', function (model) {
            changedModel = model
          })

          model.get('comments').add({ body: 'other comment' })
          comment = model.get('comments').at(1)
          expect(changedModel).toBe(comment)
        })
      })

      describe("when removing a new model to a nested relation", function() {
        it("triggers a nested:change event on the parent, with the removed model as an argument", function() {
          model.on('nested:change', function (model) {
            changedModel = model
          })

          comment = model.get('comments').at(0)
          model.get('comments').remove(comment)
          expect(changedModel).toBe(comment)
        })

        it("triggers a change:<relationKey> event on the parent, with the removed model as an argument", function() {
          model.on('change:comments', function (model) {
            changedModel = model
          })

          comment = model.get('comments').at(0)
          model.get('comments').remove(comment)
          expect(changedModel).toBe(comment)
        })
      })
    })

    describe("toJSON", function() {
      beforeEach(function() {
        model = new Post({ title: 'Some Title', comments: [{ body: 'some comment' }] })
      })

      it("serializes the own attributes, as well as the relation", function() {
        expect(model.toJSON()).toEqual({ title: 'Some Title', comments: [{ body: 'some comment' }] })
      })
    })
  })
})