angular.module('menuweb.controllers', [])

.controller('RestaurantMapCtrl', ['$scope', '$rootScope', '$state', '$ionicLoading', 'RestaurantService',
function($scope, $rootScope, $state, $ionicLoading, RestaurantService) {
  var loadingOptions = {
    // The text to display in the loading indicator
    content: 'Loading',

    // The animation to use
    animation: 'fade-in',

    // Will a dark overlay or backdrop cover the entire view
    showBackdrop: true,

    // The maximum width of the loading indicator
    // Text will be wrapped if longer than maxWidth
    maxWidth: 200,

    // The delay in showing the indicator
    showDelay: 500
  };

  // Show the loading overlay and text
  $scope.loading = $ionicLoading.show(loadingOptions);

  // get the collection from our data definitions
  var restaurants = new RestaurantService.collection();
  var initialMarkers = [];

  // use the extended Parse SDK to load the whole collection
  restaurants.load().then(function(foundRestaurants) {
    $scope.updateMarkers(foundRestaurants);
    initialMarkers = $scope.map.markers;
  });

  // initial map
  $scope.map = {
    center: {
      latitude: 41,
      longitude: 2
    },
    zoom: 8,
    markers: initialMarkers,
    doCluster: true,
    clusterOptions: {
      title: 'More restaurants here',
      gridSize: 60,
      ignoreHidden: true,
      minimumClusterSize: 2,
      imageExtension: 'png',
      imagePath: 'img/icon',
      imageSizes: [72]
    }
  };

  // HTML5 geolocation
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      $rootScope.currentPosition = position;
      $scope.map.center = position.coords;
      $scope.map.zoom = 15;

      // reload restaurants from location
      $scope.loading.show(loadingOptions);
      restaurants.loadRestaurantsWithinGeoBox(position.coords).then($scope.updateMarkers);
      $scope.$apply();
    });
  }

  _.each($scope.map.markers, function (marker) {
    marker.closeClick = function () {
      marker.showWindow = false;
      $scope.$apply();
    };
    marker.onClicked = function () {
      // marker.showWindow = true;
      // load translations
    };
  });

  $scope.updateMarkers = function(someRestaurants) {
    $scope.restaurants = someRestaurants;
    $scope.map.markers = _.map(someRestaurants.models, function(rest) {
      return {
        latitude: rest.getLocation() ? rest.getLocation().latitude : 0.0,
        longitude: rest.getLocation() ? rest.getLocation().longitude: 0.0,
        id: rest.id,
        templateUrl: 'templates/info-window.html',
        templateParameter: {
          id: rest.id,
          title: rest.getName(),
          address: rest.getAddress(),
          logoUrl: rest.getLogoUrl()
        },
        icon: "img/icon.png"
      };
    });
    $scope.loading.hide();
  };
}
])

.controller('RestaurantListCtrl', ['$scope', '$rootScope', '$ionicNavBarDelegate', 'RestaurantService',
  function($scope, $rootScope, $ionicNavBarDelegate, RestaurantService) {
    var restaurants = new RestaurantService.collection();

    $scope.refreshRestaurants = function(position) {
      $rootScope.currentPosition = position.coords;
      var currentGeoPoint = new Parse.GeoPoint(position.coords);
      restaurants.loadRestaurantsWithinGeoBox($rootScope.currentPosition).then(function(foundRestaurants) {
        $scope.restaurants = _.map(foundRestaurants.models, function(restaurant) {
          return {
            id: restaurant.id,
            name: restaurant.getName(),
            logoUrl: restaurant.getLogoUrl(),
            distance: currentGeoPoint.kilometersTo(restaurant.getLocation())
          };
        });
      });
    };

    if ($rootScope.currentPosition) {
      $scope.refreshRestaurants($rootScope.currentPosition);
    } else if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition($scope.refreshRestaurants);
    } else {
      // TODO: error message? Alphabetical list?
    }

}])

.controller('SearchCtrl', ['$scope',
  function($scope) {
}]);
