# Backbone.NestedAttributesModel

Add Rails-like nested attributes support for Backbone.Model.

## Installation

Add this line to your application's Gemfile:

    gem 'backbone-nested-attributes'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install backbone-nested-attributes

Then, add this line in your `application.js`:

    //= require backbone-nested-attributes/all

## Usage

Make your model extend from `Backbone.NestedAttributesModel`, instead of `Backbone.Model` and declare your relationships:

```javascript
var Post = Backbone.NestedAttributesModel.extend({
  relations: [
    {
      type: 'one',
      key: 'author',
      relatedModel: function () { return Person }
    },
    {
      key:  'comments',
      relatedModel: function () { return Comment }
    }
  ]
})

var Comment = Backbone.NestedAttributesModel.extend({})
var Person = Backbone.NestedAttributesModel.extend({})
```

Now you can create your posts like this:

```javascript
var post = new Post({
  id: 123,
  title: 'My Title',
  author: { id: 987, name: "Vicente Mundim" },
  comments: [
    {
      id: 765,
      body: "Nice writeup!"
    },
    {
      id: 766,
      body: "Keep it going!"
    }
  ]
})

post.get('author')   // returns a Person model
post.get('comments') // returns a Backbone.Collection of Comment models
```

When saving data, you can choose whether to send attributes as usual, or with nested attributes support by giving `{ nested: true }` to `save`:

```javascript
post.save({}, { nested: true }) 
```

This will send data to the server like this:

```javascript
{
  id: 123,
  title: 'My Title',
  author_attributes: { id: 987, name: "Vicente Mundim" },
  comments_attributes: [
    {
      id: 765,
      body: "Nice writeup!"
    },
    {
      id: 766,
      body: "Keep it going!"
    }
  ]
}
```

It keeps track of deleted models in `1-N` relations:

```javascript
var comment = post.get('comments').at(0)
post.get('comments').remove(comment)

post.save({}, { nested: true })
```

Send this data to the server:

```javascript
{
  id: 123,
  title: 'My Title',
  author_attributes: { id: 987, name: "Vicente Mundim" },
  comments_attributes: [
    {
      id: 765,
      body: "Nice writeup!",
      _destroy: true
    },
    {
      id: 766,
      body: "Keep it going!"
    }
  ]
}
```

## Backbone.UndoableModel

If you're using some [bind](https://github.com/NYTimes/backbone.stickit) plugin and you want to cancel changes that were made without reloading the page or hitting the backend you'll definitively want to take a look at Backbone.UndoableModel:

```javascript
var Post = Backbone.UndoableModel.extend({
  relations: [ // UndoableModel is a NestedAttributesModel, so it can have relations
    {
      type: 'one',
      key: 'author',
      relatedModel: function () { return Person }
    },
    {
      key:  'comments',
      relatedModel: function () { return Comment }
    }
  ]
})

var Comment = Backbone.UndoableModel.extend({})
var Person = Backbone.UndoableModel.extend({})

var post = new Post({
  id: 123,
  title: 'My Title',
  author: { id: 987, name: "Vicente Mundim" },
  comments: [
    {
      id: 765,
      body: "Nice writeup!"
    },
    {
      id: 766,
      body: "Keep it going!"
    }
  ]
})

post.set({ title: 'My new title' })
post.get('author').set({ name: 'Jon Snow' })
post.get('comments').at(0).set({ body: 'Great post!' })

post.undo() // that's it, post is now reverted to its initial attributes, as well as its relations

post.get('title')                      // 'My Title'
post.get('author').get('name')         // 'Vicente Mundim'
post.get('comments').at(0).get('body') // "Nice writeup!"
```

## More info

Check out the specs:

* [Backbone.NestedAttributesModel](https://github.com/dtmconsultoria/backbone-nested-attributes/blob/master/spec/javascripts/backbone-nested-attributes/ModelSpec.js)
* [Backbone.UndoableModel](https://github.com/dtmconsultoria/backbone-nested-attributes/blob/master/spec/javascripts/backbone-nested-attributes/UndoableSpec.js)

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
