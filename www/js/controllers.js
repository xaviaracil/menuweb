angular.module('menuweb.controllers', [])

.controller('RestaurantMapCtrl', ['$scope', '$rootScope', '$state', '$ionicLoading', 'RestaurantService',
function($scope, $rootScope, $state, $ionicLoading, RestaurantService) {
  /*
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
  $ionicLoading.show(loadingOptions);
*/
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
      imageExtension: 'svg',
      imagePath: 'img/svg/localGroup',
      imageSizes: [48]
    }
  };

  // HTML5 geolocation
  if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      $rootScope.currentPosition = position;
      $scope.map.center = position.coords;
      $scope.map.zoom = 15;

      // reload restaurants from location
      //$ionicLoading.show(loadingOptions);
      restaurants.loadRestaurantsWithinGeoBox(position.coords).then($scope.updateMarkers);
      $scope.$apply();
    });
  }

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
          logoUrl: rest.getLogoFile()
        },
        icon: "img/svg/pin.svg"
      };
    });
    //$scope.loading.hide();
    /*
    _.each($scope.map.markers, function (marker) {
      marker.closeClick = function () {
      };
      marker.onClicked = function () {
        // marker.showWindow = true;
        // load translations
      };
    });*/
  };

  $scope.goToRestaurant = function(restaurantId) {
    console.log('goToRestaurant!!!');
    $state.go('restaurant', {restaurantId: parameter.id });
  };
}
])

.controller('RestaurantListCtrl', ['$scope', '$rootScope', '$stateParams', '$ionicNavBarDelegate', 'RestaurantService', 'CategoriesService',
  function($scope, $rootScope, $stateParams, $ionicNavBarDelegate, RestaurantService, CategoriesService) {
    var restaurants = new RestaurantService.collection();

    Parse.Cloud.run('priceranges', null, {
      success: function(priceranges) {
        $scope.priceranges = priceranges;
      }
    });

    $scope.updateList = function(foundRestaurants) {
      var currentGeoPoint = new Parse.GeoPoint($rootScope.currentPosition.coords);
      $scope.restaurants = _.map(foundRestaurants.models, function(restaurant) {
        return {
          id: restaurant.id,
          name: restaurant.getName(),
          logoUrl: restaurant.getLogoFile(),
          priceRange: restaurant.getPriceRange(),
          distance: currentGeoPoint.kilometersTo(restaurant.getLocation())
        };
      });
    };

    $scope.refreshRestaurants = function(position) {
      $rootScope.currentPosition = position;
      var point = position.coords;

      if ($stateParams.categories) {
        var categories = _.map($stateParams.categories.split(','), function(id) {
          var category = new CategoriesService.model();
          category.id = id;
          return category;
        });
        restaurants.loadRestaurantsWithinGeoBoxAndCategories(point, categories).then($scope.updateList);
      } else if ($stateParams.priceranges) {
        var priceRanges = $stateParams.priceranges.split(',');
        restaurants.loadRestaurantsWithinGeoBoxAndPriceRanges(point, priceRanges).then($scope.updateList);
      } else if ($stateParams.languages) {
        var languages = $stateParams.languages.split(',');
        restaurants.loadRestaurantsWithinGeoBoxAndLanguages(point, languages).then($scope.updateList);
      } else {
        restaurants.loadRestaurantsWithinGeoBox(point).then($scope.updateList);
      }
    };

    if ($rootScope.currentPosition) {
      $scope.refreshRestaurants($rootScope.currentPosition);
    } else if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition($scope.refreshRestaurants);
    } else {
      // TODO: error message? Alphabetical list?
    }

}])

.controller('RestaurantCtrl', ['$scope', '$rootScope', '$state', '$stateParams', '$ionicLoading', 'RestaurantService',
  function($scope, $rootScope, $state, $stateParams, $ionicLoading, RestaurantService) {
    Parse.Cloud.run('priceranges', null, {
      success: function(foundPriceRanges) {
        $scope.priceranges = _.map(foundPriceRanges, function(priceRange) {
          return {
            id: priceRange.id,
            name: priceRange.name,
            checked: false
          };
        });
        $scope.$apply();
      }
    });

    var restaurant = new RestaurantService.model();
    restaurant.id = $stateParams.restaurantId;
    restaurant.load().then(function(foundRestaurant) {
      $scope.rest = foundRestaurant;
    });

    // TODO: complete
    $scope.goToMenu = function(rest) {
      $rootScope.currentRestaurant = rest;
      $state.go('restaurant.menu', {currentRestaurantId: rest.id});
    };
}])

.controller('RestaurantMenuCtrl', ['$scope', '$state', '$stateParams', '$rootScope', 'RestaurantService', 'TranslationService', 'TranslatedCategoriesService',
  function($scope, $state, $stateParams, $rootScope, RestaurantService, TranslationService, TranslatedCategoriesService) {
    if (!$rootScope.currentRestaurant) {
      var restaurant = new RestaurantService.model();
      restaurant.id = $stateParams.restaurantId;
      restaurant.load().then(function(foundRestaurant) {
        $rootScope.currentRestaurant = foundRestaurant;
      });
    }

    $scope.loadCategories = function(language) {
      var translations = new TranslationService.collection();
      translations.loadTranslationsOfRestaurantAndLanguage($rootScope.currentRestaurant, language).then(function(foundTranslations) {
        var translation = _.first(foundTranslations.models);
        if (translation) {
          var categories = new TranslatedCategoriesService.collection();

          categories.loadCategoriesOfTranslation(translation).then(function(foundCategories) {
            $scope.categories = _.map(foundCategories.models, function(category) {
              return {
                id: category.id,
                name: category.getName()
              };
            });
          });
        } else {
          // TODO: maybe redirect to a language selector??
        }
      });
    };

    $scope.goToLanguage = function() {
      $state.go('restaurant.language');
    };

    // get current language
    if (navigator.globalization) {
      navigator.globalization.getPreferredLanguage($scope.loadCategories);
    } else {
      var language = navigator.language.split('-')[0];
      $scope.loadCategories(language);
    }

}])

.controller('SearchCtrl', ['$scope',
  function($scope) {
}])

.controller('SearchCategoryCtrl', ['$scope', '$state', 'TranslatedCategoriesService',
  function($scope, $state, TranslatedCategoriesService) {
    var categories = new TranslatedCategoriesService.collection();

    $scope.loadCategories = function(language) {
      categories.loadGeneralCategoriesOfLanguage(language).then(function(foundCategories) {
        $scope.categories = _.map(foundCategories.models, function(category) {
          return {
            id: category.get('category').id,
            name: category.getName(),
            checked: false
          };
        });
      });
    };

    // get current language
    if (navigator.globalization) {
      navigator.globalization.getPreferredLanguage($scope.loadCategories);
    } else {
      var language = navigator.language.split('-')[0];
      $scope.loadCategories(language);
    }

    $scope.search = function() {
      // get selected categories
      var selectedCategories = _.pluck(_.filter($scope.categories, function(category) {
        return category.checked;
      }), 'id');
      console.log(selectedCategories);
      //  search
      $state.go('restaurants', {categories: selectedCategories});
    };
}])

.controller('SearchPriceCtrl', ['$scope', '$state',
  function($scope, $state) {
    Parse.Cloud.run('priceranges', null, {
      success: function(foundPriceRanges) {
        $scope.priceranges = _.map(foundPriceRanges, function(priceRange) {
          return {
            id: priceRange.id,
            name: priceRange.name,
            checked: false
          };
        });
        $scope.$apply();
      }
    });

    $scope.search = function() {
      // get selected price ranges
      var selectedPriceRanges = _.pluck(_.filter($scope.priceranges, function(pricerange) {
        return pricerange.checked;
      }), 'id');
      // search
      $state.go('restaurants', {priceranges: selectedPriceRanges});
    };
}])

.controller('SearchLanguageCtrl', ['$scope', '$state',
  function($scope, $state) {
    Parse.Cloud.run('languages', null, {
      success: function(foundLanguages) {
        $scope.languages = _.map(foundLanguages, function(language) {
          return {
            id: language.id,
            name: language.name,
            checked: false
          };
        });
        $scope.$apply();
      }
    });

    $scope.search = function() {
      // get selected languages
      var selectedLanguages = _.pluck(_.filter($scope.languages, function(language) {
        return language.checked;
      }), 'id');
      // search
      $state.go('restaurants', {languages: selectedLanguages});
    };
}]);
