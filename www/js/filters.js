angular.module('menuweb.filters', [])

.filter('distance', function() {
  return function(input) {
    if (input < 1) {
      return input * 1000 + " meters";
    }
    return input + " kms.";
  };
})

.filter('name', function() {
  return function(input, availableValues) {
    var element = _.first(_.filter(availableValues, function(item) {
      return item.id === input;
    }));
    return element ? element.name : 'Not available';
  };
})

.filter('address', function() {
  return function(input) {
    return input.getAddress() + ". " + input.getPostalCode() + " " + input.getCity();
  };
});
