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

    describe("#toJSON()", function() {
      beforeEach(function() {
        model = new Post({ title: 'Some Title', comments: [{ body: 'some comment' }] })
      })

      it("serializes the own attributes, as well as the relation", function() {
        expect(model.toJSON()).toEqual({ title: 'Some Title', comments: [{ body: 'some comment' }] })
      })
    })
  })
})