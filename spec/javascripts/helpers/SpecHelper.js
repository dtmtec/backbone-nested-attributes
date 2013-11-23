getJasmineRequireObj().toBeAnInstanceOf = function() {
  function toBeAnInstanceOf() {
    return {
      compare: function(actual, expected) {
        return {
          pass: actual instanceof expected
        }
      }
    }
  }

  return toBe
}

