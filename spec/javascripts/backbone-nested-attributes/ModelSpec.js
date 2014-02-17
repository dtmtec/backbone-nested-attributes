describe("Backbone.NestedAttributesModel", function() {
  var model,
      Post,
      post,
      Comment,
      comment,
      Person,
      author

  beforeEach(function() {
    model = new Backbone.NestedAttributesModel({})
  })

  it("should be a Backbone.Model", function() {
    expect(model).toBeAnInstanceOf(Backbone.Model)
  })

  describe("with a has one relationship", function() {
    beforeEach(function() {
      Post = Backbone.NestedAttributesModel.extend({
        relations: [
          {
            type: 'one',
            key: 'author',
            relatedModel: function () { return Person }
          }
        ]
      })

      Person = Backbone.NestedAttributesModel.extend({})
    })

    describe("when creating", function() {
      it("does not initializes the author attribute", function() {
        model = new Post
        expect(model.get('author')).not.toBeDefined()
      });

      describe("while setting attributes", function() {
        beforeEach(function() {
          model = new Post({ title: 'Some Title', author: { name: 'Jon Snow'} })
        })

        it("sets the normal attributes", function() {
          expect(model.get('title')).toEqual('Some Title')
        })

        it("creates the author model", function() {
          author = model.get('author')

          expect(author).toBeAnInstanceOf(Person)
          expect(author.get('name')).toEqual('Jon Snow')
        })

        describe("passing a model to the relation attribute", function() {
          beforeEach(function() {
            author = new Person({ name: 'Jon Snow' })
            model = new Post({ title: 'Some Title', author: author })
          })

          it("store the given model in the relation attribute", function() {
            expect(model.get('author')).toBe(author)
          })
        })
      })
    })

    describe("when updating", function() {
      beforeEach(function() {
        model = new Post
      })

      it("store the given model in the relation attribute", function() {
        model.set({ author: { name: 'Jon Snow' } })

        author = model.get('author')

        expect(author).toBeAnInstanceOf(Person)
        expect(author.get('name')).toEqual('Jon Snow')
      })

      it("allows passing key, value when setting a relation attribute", function() {
        model.set('author', { name: 'Jon Snow' })

        author = model.get('author')

        expect(author).toBeAnInstanceOf(Person)
        expect(author.get('name')).toEqual('Jon Snow')
      })

      it('pass options to original set', function (done) {
        var called = false
        model.on('change:title', function () { called = true })
        model.set('title', 'My Title', { silent: true })
        expect(called).toBeFalsy()

        model.set({title: 'My New Title'}, { silent: true })
        expect(called).toBeFalsy()
      });

      describe("passing a model to the relation attribute", function() {
        beforeEach(function() {
          author = new Person({ name: 'Jon Snow' })
          model = new Post
        })

        it("store the given model in the relation attribute", function() {
          model.set({ title: 'Some title', author: author })
          expect(model.get('author')).toBe(author)
        })
      })
    })

    describe("cloning", function() {
      beforeEach(function() {
        post = new Post({ title: 'Some Title', author: { name: 'Jon Snow' } })
      })

      it("creates a new post object, with the same attributes, including nested has one relations, that are not shared", function() {
        var newPost = post.clone()

        expect(newPost).not.toBe(post)
        expect(newPost.get('author')).not.toBe(post.get('author'))

        expect(newPost.get('title')).toEqual(post.get('title'))
        expect(newPost.get('author').get('name')).toEqual(post.get('author').get('name'))
      })
    })

    describe("event bubbling", function() {
      var changedModel, changedCount

      beforeEach(function() {
        changedCount = 0
        changedModel = undefined

        model = new Post({ title: 'Some Title', author: { name: 'Jon Snow' } })
        author = model.get('author')
      })

      describe("when a nested model is changed", function() {
        it("triggers a nested:change event on the parent, with the changed model as an argument", function() {
          model.on('nested:change', function (model) {
            changedModel = model
          })

          author.set({ name: 'Robb Stark' })
          expect(changedModel).toBe(author)
        })

        it("triggers a nested:change only once, after setting nested attributes again", function() {
          model.set({ title: 'Some Title', author: { name: 'Jon Snow' } })
          author = model.get('author')

          model.on('nested:change', function (model) {
            changedModel = model
            changedCount += 1
          })

          author.set({ name: 'Robb Stark' })
          expect(changedModel).toBe(author)
          expect(changedCount).toEqual(1)
        })

        it("triggers a change:<relationKey> event on the parent, with the changed model as an argument", function() {
          model.on('change:author', function (model) {
            changedModel = model
          })

          author.set({ name: 'Robb Stark' })
          expect(changedModel).toBe(author)
        })

        it("triggers a change:<relationKey> only once, after setting nested attributes again", function() {
          model.set({ title: 'Some Title', author: { body: 'Jon Snow' } })
          author = model.get('author')

          model.on('change:author', function (model) {
            changedModel = model
            changedCount += 1
          })

          author.set({ name: 'Robb Stark' })
          expect(changedModel).toBe(author)
          expect(changedCount).toEqual(1)
        })

        describe("and the nested model triggers a nested:change", function() {
          it("triggers a nested:change on the parent", function() {
            model.on('nested:change', function (model) {
              changedModel = model
            })

            author.trigger('nested:change', author)
            expect(changedModel).toBe(author)
          })
        })
      })

      describe("when clearing", function() {
        it("stops listening to relation nested:change events", function() {
          model.on('nested:change', function (model) {
            changedModel = model
          })

          model.clear()
          author.set({ name: 'Robb Stark' })
          expect(changedModel).toBeUndefined()
        })

        it("stops listening to relation change:<relationKey> events", function() {
          model.clear()

          model.on('change:author', function (model) {
            changedModel = model
          })

          author.set({ name: 'Robb Stark' })
          expect(changedModel).toBeUndefined()
        })
      })
    })

    describe("when synchronizing", function() {
      beforeEach(function() {
        jasmine.Ajax.useMock()

        model = new Post({ title: 'Some Title', author: { name: 'Jon Snow' } })
        model.url = 'http://someapi.com'
      })

      it("does not raise errors", function() {
        model.save()

        var request = mostRecentAjaxRequest();
        request.response({status: 200, responseText: { title: 'Some Title', comments: [] }}) // would raise error
      })
    })

    describe("toJSON", function() {
      beforeEach(function() {
        model = new Post({ title: 'Some Title', author: { name: 'Jon Snow' } })
      })

      it("serializes its own attributes, as well as the relation ones", function() {
        expect(model.toJSON()).toEqual({ title: 'Some Title', author: { name: 'Jon Snow' } })
      })

      describe("with nested attributes support", function() {
        it("serializes the relation attributes with a _attributes suffix", function() {
          expect(model.toJSON({ nested: true })).toEqual({
            title: 'Some Title',
            author_attributes: { name: 'Jon Snow' }
          })
        })
      })
    })
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

        describe('passing a model in a collection with { _destroy: true }', function () {
          beforeEach(function() {
            model = new Post({ title: 'Some Title', comments: [{ body: 'some content' }, { id: '123', body: 'other content', _destroy: true }] })
          })

          it('do not add the model with { _destroy: true } to the relation collection', function () {
            expect(model.get('comments').length).toBe(1)
            expect(model.get('comments').at(0).get('body')).toBe('some content')
          })

          it('adds them to the deletedModels collection inside the relation collection', function () {
            expect(model.get('comments').deletedModels.length).toBe(1)
            expect(model.get('comments').deletedModels.at(0).get('body')).toBe('other content')
          })
        })

        describe("passing a deleted_<collection> attribute", function() {
          var comments

          beforeEach(function() {
            model = new Post({ title: 'Some Title', deleted_comments: [{ id: 123, body: "some deleted comment", _destroy: true }] })
          })

          it("does not save this key as an attribute", function() {
            expect(model.get('deleted_comments')).toBeUndefined()
          })

          it("adds the models in the deleted_comments attribute to the deletedModels collection inside the relation collection", function() {
            comments = model.get('comments')
            expect(comments.deletedModels.at(0)).toBeAnInstanceOf(Comment)
            expect(comments.deletedModels.at(0).get('id')).toEqual(123)
            expect(comments.deletedModels.at(0).get('body')).toEqual('some deleted comment')
            expect(comments.deletedModels.at(0).get('_destroy')).toBeTruthy()
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

      it("allows one to update non-nested attributes without modifying nested ones", function() {
        model = new Post({ title: 'new title', comments: [{ body: 'some comment' }] })
        model.set('title', 'other title')
        expect(model.get('title')).toEqual('other title')
        expect(model.get('comments').length).toEqual(1)
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

      describe("passing a deleted_<collection> attribute", function() {
        var comments

        beforeEach(function() {
          model = new Post({ title: 'Some Title' })
        })

        it("does not save this key as an attribute", function() {
          model.set({ deleted_comments: [{ id: 123, body: "some deleted comment", _destroy: true }] })
          expect(model.get('deleted_comments')).toBeUndefined()
        })

        it("adds the models in the deleted_comments attribute to the deletedModels collection inside the relation collection", function() {
          model.set({ deleted_comments: [{ id: 123, body: "some deleted comment", _destroy: true }] })
          comments = model.get('comments')

          expect(comments.deletedModels.at(0)).toBeAnInstanceOf(Comment)
          expect(comments.deletedModels.at(0).get('id')).toEqual(123)
          expect(comments.deletedModels.at(0).get('body')).toEqual('some deleted comment')
          expect(comments.deletedModels.at(0).get('_destroy')).toBeTruthy()
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
        changedModel = undefined

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

      describe("when clearing", function() {
        it("stops listening to collection nested:change events", function() {
          model.on('nested:change', function (model) {
            changedModel = model
          })

          model.clear()
          comment.set({ body: 'some new body' })
          expect(changedModel).toBeUndefined()
        })

        it("stops listening to collection change:<relationKey> events", function() {
          model.on('change:comments', function (model) {
            changedModel = model
          })

          model.clear()
          comment.set({ body: 'some new body' })
          expect(changedModel).toBeUndefined()
        })
      })
    })

    describe("toJSON", function() {
      beforeEach(function() {
        model = new Post({ title: 'Some Title', comments: [{ body: 'some comment' }] })
      })

      it("serializes its own attributes, as well as the relation one", function() {
        expect(model.toJSON()).toEqual({ title: 'Some Title', comments: [{ body: 'some comment' }] })
      })

      describe("with nested attributes support", function() {
        it("serializes the relation attributes with a _attributes suffix", function() {
          expect(model.toJSON({ nested: true })).toEqual({
            title: 'Some Title',
            comments_attributes: [{ body: 'some comment' }]
          })
        })

        describe("when a nested model is removed", function() {
          describe("and it is a new model", function() {
            beforeEach(function() {
              comment = model.get('comments').at(0)
            })

            it("is not serialized on the relation", function() {
              model.get('comments').remove(comment)

              expect(model.toJSON({ nested: true })).toEqual({
                title: 'Some Title',
                comments_attributes: []
              })
            })
          })

          describe("and it is not a new model", function() {
            beforeEach(function() {
              comment = model.get('comments').at(0)
              comment.set({ id: '123' })
            })

            it("is serialized on the relation, with { _destroy: true } attribute, besides its own attributes", function() {
              model.get('comments').remove(comment)

              expect(model.toJSON({ nested: true })).toEqual({
                title: 'Some Title',
                comments_attributes: [{
                  id: comment.get('id'),
                  body: comment.get('body'),
                  _destroy: true
                }]
              })
            })

            describe("after synchronizing the parent model", function() {
              beforeEach(function() {
                jasmine.Ajax.useMock()
                model.url = 'http://someapi.com'
              })

              it("is not serialized on the relation", function() {
                model.get('comments').remove(comment)
                model.save()

                var request = mostRecentAjaxRequest();
                request.response({status: 200, responseText: { title: 'Some Title', comments: [] }})

                expect(model.toJSON({ nested: true })).toEqual({
                  title: 'Some Title',
                  comments_attributes: []
                })
              })
            })

            describe("after clearing the parent model", function() {
              it("is not serialized on the relation", function() {
                model.get('comments').remove(comment)
                model.clear()

                expect(model.toJSON({ nested: true })).toEqual({})
              })
            })
          })
        })
      })

      describe("with deleted models", function() {
        beforeEach(function() {
          model = new Post({ id: 321, title: 'Some Title', comments: [{ id: 123, body: 'some comment' }] })
          comment = model.get('comments').at(0)
        })

        it("serializes the deleted models in a relation in a delete_<relation> key", function() {
          model.get('comments').remove(comment)

          expect(model.toJSON({ withDeleted: true })).toEqual({
            id: 321,
            title: 'Some Title',
            comments: [],
            deleted_comments: [ {id: 123, body: 'some comment', _destroy: true} ]
          })
        })

        describe("and nested attributes support", function() {
          it("serializes the deleted models in a relation in a delete_<relation> key", function() {
            model.get('comments').remove(comment)

            expect(model.toJSON({ withDeleted: true, nested: true })).toEqual({
              id: 321,
              title: 'Some Title',
              comments_attributes: [{ id: 123, body: 'some comment', _destroy: true }],
              deleted_comments: [ { id: 123, body: 'some comment', _destroy: true } ]
            })
          })
        })
      })
    })
  })
})
