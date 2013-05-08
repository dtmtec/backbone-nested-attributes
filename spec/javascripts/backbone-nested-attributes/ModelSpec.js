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
            type: 'many',
            key:  'comments',
            relatedModel: function () { return Comment }
          }
        ]
      })

      Comment = Backbone.NestedAttributesModel.extend({})

      model = new Post
    })

    describe("when creating", function() {
      it("initializes the comments attribute with an empty collection", function() {
        expect(model.get('comments')).toBeDefined()
        expect(model.get('comments')).toBeAnInstanceOf(Backbone.Collection)
      });

      describe("while setting attributes", function() {
        beforeEach(function() {
          model = new Post({ foo: 'bar', comments: [{ body: 'some comment'} ] })
        })

        it("sets the normal attributes", function() {
          expect(model.get('foo')).toEqual('bar')
        })

        it("creates the comment inside comments collection", function() {
          comment = model.get('comments').at(0)

          expect(comment).toBeAnInstanceOf(Comment)
          expect(comment.get('body')).toEqual('some comment')
        })
      })
    })

    describe("when updating", function() {
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
    })
  })
})