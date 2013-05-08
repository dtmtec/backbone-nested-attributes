describe("Backbone.NestedAttributesModel", function() {
  var model

  beforeEach(function() {
    model = new Backbone.NestedAttributesModel({})
  })

  it("should be a Backbone.Model", function() {
    expect(model).toBeAnInstanceOf(Backbone.Model)
  });
})