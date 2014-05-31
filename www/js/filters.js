angular.module('menuweb.filters', [])

.filter('distance', function() {
  return function(input) {
    if (input < 1) {
      return input * 1000 + " meters";
    }
    return input + " kms.";
  };
});
