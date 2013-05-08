beforeEach(function() {
  this.addMatchers({
    toBeAnInstanceOf: function (expected) {
      return this.actual instanceof expected
    }
  });
});
