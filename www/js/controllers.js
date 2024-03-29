angular.module('menuweb.controllers', [])

.controller('RestaurantMapCtrl',
function($scope, $rootScope, $state, $ionicLoading, $ionicPlatform, $cordovaBarcodeScanner, $cordovaGeolocation, uiGmapGoogleMapApi, $cordovaToast) {
  // Show the loading overlay and text
  var loadingOptions = {
    // The text to display in the loading indicator
    template: 'Loading',
    hideOnStateChange: true,
  };

  // get the collection from our data definitions
  var restaurants = new (Parse.Collection.getClass("Restaurant"));
  var initialMarkers = [];

  $scope.goToRestaurant = function(restaurantId) {
    $state.go('restaurant', {restaurantId: parameter.id });
  };

  // setup barcode scanner
  $ionicPlatform.ready(function() {
    $scope.scan = function() {
      $cordovaBarcodeScanner.scan().then(function(barcodeData) {
        if (!barcodeData.cancelled) {
          // Success! Barcode data is here
          // Go to barcodeData
          var matchData = barcodeData.text.match(/http:\/\/menu-web\.laibeth\.com\/#\/restaurants\/(\w+)$/);
          if (matchData && matchData[1]) {
            $state.go('restaurant', {restaurantId: matchData[1]});
          } else {
              // display an error
            $cordovaToast.showLongCenter("I can't recognize the code. Please try again.").then(function(success) {
              // success
              $scope.scan();
            }, function (error) {
              // error
            });
          }
        }
      }, function(error) {
        // An error occurred
        $cordovaToast.showShortCenter("Error scaning code. Please try again." + error);
      });
    };
  });

  var createPoint = function(location) {
    var coordinates = (location ? [location.longitude, location.latitude] : [0,0]);
    return {
      "type": "Point",
      coordinates: coordinates
    }
  };

  // initial map
  $scope.map = {
    center: createPoint({longitude: 2, latitude: 41}),
    zoom: 8,
    markers: initialMarkers,
    doCluster: true,
    doRebuildAll: true,
    bounds: {},
    clusterOptions: {
      title: 'More restaurants here',
      gridSize: 60,
      ignoreHidden: true,
      minimumClusterSize: 2,
      imageExtension: 'png',
      imagePath: 'img/localGroup',
      imageSizes: [32]
    },
    options: {
      streetViewControl:false,
      zoomControl:false,
      panControl: false,
      mapTypeControl: false,
      styles: [
        {
          "featureType": "poi",
          "stylers": [
            { "visibility": "off" }
          ]
        }
      ]
    },
    events: {
      'click': function() {
        _($scope.map.markers).forEach(function(m) {
          m.show = false;
          $scope.$apply();
        });
      }
    }
  };
    // load restaurants with geolocation
  uiGmapGoogleMapApi.then(function(maps) {
    var loadAllRestaurants = function() {
      // load the whole collection
      restaurants.fetch().then(function(foundRestaurants) {
        updateMarkers(foundRestaurants);
      });
    };

    var updateMarkers = function(someRestaurants) {
      $scope.restaurants = someRestaurants;
      var newMarkers = _.map(someRestaurants.models, function(rest) {
        var marker = {
          location: createPoint(rest.getLocation()),
          id: rest.id,
          templateUrl: 'templates/info-window.html',
          templateParameter: {
            id: rest.id,
            title: rest.getName(),
            address: rest.getAddress(),
            logoUrl: rest.getLogoFile()
          },
          //icon: {url: "img/svg/pin.svg", size: new google.maps.Size(32, 51)},
          icon: "img/svg/pin.svg",
          show: false,
          options: {
            boxClass:'infowindow',
            pixelOffset: {
              height: -80,
              width: -32
            },
            closeBoxURL:'',
            disableAutoPan: true
          }
        };
        marker.onClick = function() {
          marker.show = !marker.show;
        };
        return marker;
      });
      $scope.map.markers = newMarkers;
      $ionicLoading.hide();
    };

    var displayRestaurantsOnMap = function() {
      // console.log('displaying restaurants', $scope.map.bounds);
      $ionicLoading.show(loadingOptions);
      restaurants.loadRestaurantsWithinGeoBox($scope.map.bounds.southwest, $scope.map.bounds.northeast).then(updateMarkers);
    }
    // watch the bounds of the map
    $scope.$watch(function() {
      return $scope.map.bounds;
    }, function(nv, ov) {
      if (nv && nv.southwest) {
        displayRestaurantsOnMap();
      }
    }, true);

    $ionicPlatform.ready(function() {
      if ($cordovaGeolocation) {
        $cordovaGeolocation.getCurrentPosition({timeout: 10000, enableHighAccuracy: true}).then(function(position) {
          $rootScope.currentPosition = position;
          $scope.map.zoom = 12;
          $scope.map.center = createPoint(position.coords);

          // reload restaurants from location
          displayRestaurantsOnMap();
        }, function(err) {
          console.log(err);
          $cordovaToast.showShortCenter("Error getting location. Please try again.");
            //loadAllRestaurants();
        });
      } else {
        // navigator
        // HTML5 geolocation.
        if(navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            $rootScope.currentPosition = position;
            $scope.map.zoom = 12;
            $scope.map.center = createPoint(position.coords);

            // reload restaurants from location
            displayRestaurantsOnMap();
          });
          //}, loadAllRestaurants);
        } else {
          //loadAllRestaurants();
        }
      }
    });
  });
})

.controller('RestaurantListCtrl',
  function($scope, $rootScope, $stateParams, $ionicNavBarDelegate, $cordovaToast) {
    var restaurants = new (Parse.Collection.getClass("Restaurant"));

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
      $scope.$broadcast('scroll.refreshComplete');
    };

    $scope.refreshRestaurants = function(position) {
      if (position) {
        $rootScope.currentPosition = position;
      } else {
        position = $rootScope.currentPosition;
      }
      var point = position.coords;

      if ($stateParams.categories) {
        var categories = _.map($stateParams.categories.split(','), function(id) {
          var category = new (Parse.Object.getClass("Category"));
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
      // error message TODO: Alphabetical list?
      $cordovaToast.showShortCenter("Error finding your position");
    }
})

.controller('RestaurantCtrl',
  function($scope, $rootScope, $state, $stateParams, $cordovaSocialSharing) {
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

    var restaurant = new (Parse.Object.getClass("Restaurant"));
    restaurant.id = $stateParams.restaurantId;
    restaurant.fetch().then(function(foundRestaurant) {
      $scope.rest = foundRestaurant;
    });

    // TODO: complete
    $scope.goToMenu = function(rest) {
      $rootScope.currentRestaurant = rest;
      $state.go('restaurant.menu', {currentRestaurantId: rest.id});
    };

    // Share via native share sheet
    $scope.share = function() {
      $cordovaSocialSharing
          .share('Check out this restaurant', null, null, 'http://menu-web.laibeth.com/#/restaurants/' + $scope.rest.id)
          .then(function(result) {
            // Success!
          }, function(err) {
            // An error occured. Show a message to the user
          });
    };
})

.controller('RestaurantMenuCtrl',
  function($scope, $state, $stateParams, $rootScope, $ionicHistory) {
    if (!$rootScope.currentRestaurant) {
      var restaurant = new (Parse.Object.getClass("Restaurant"));
      restaurant.id = $stateParams.restaurantId;
      restaurant.load().then(function(foundRestaurant) {
        $rootScope.currentRestaurant = foundRestaurant;
      });
    }

    $scope.loadCategoriesOfTranslation = function(translation) {
      $scope.translation = translation;
      var categories = new (Parse.Collection.getClass("TranslatedCategory"));

      categories.loadCategoriesOfTranslation(translation).then(function(foundCategories) {
        if (!foundCategories.length) {
          // redirect to dishes listing, only if not going back
          console.log("No categories found", $ionicHistory.viewHistory(), $rootScope.lastState);
          $ionicHistory.nextViewOptions({
            disableAnimate: true
          });
          if ($rootScope.lastState.state.name === 'restaurant.menu.dishes') {
            $ionicHistory.goBack();
            return;
          }

          $state.go('restaurant.menu.dishes', {restaurantId: $rootScope.currentRestaurant.id, translationId: translation.id});
        } else {
          $scope.categories = _.map(foundCategories.models, function(category) {
            return {
              id: category.id,
              name: category.getName(),
              categId: category.getCategory().id
            };
          });
        }
      });

    };
    $scope.loadCategories = function(language) {
      var translations = new (Parse.Collection.getClass("Translation"));
      translations.loadTranslationsOfRestaurantAndLanguage($rootScope.currentRestaurant, language).then(function(foundTranslations) {
        var translation = _.first(foundTranslations.models);
        if (translation) {
          $scope.loadCategoriesOfTranslation(translation);
        } else {
          // redirect to a language selector??
          console.log("Language not found", $rootScope.lastState, $ionicHistory.viewHistory());
          $ionicHistory.nextViewOptions({
            disableAnimate: true
          });
          if ($rootScope.lastState.state.name === 'restaurant.language') {
            $ionicHistory.goBack();
            return;
          }
          $scope.goToLanguage();
        }
      });
    };

    $scope.goToLanguage = function() {
      $state.go('restaurant.language');
    };

    if ($stateParams.translation) {
      // already a translation defined
      var translation = new (Parse.Object.getClass("Translation"));
      translation.id = $stateParams.translation;
      $scope.loadCategoriesOfTranslation(translation);
    } else {
      // get current language
      if (navigator.globalization) {
        navigator.globalization.getPreferredLanguage($scope.loadCategories);
      } else {
        var language = navigator.language.split('-')[0];
        $scope.loadCategories(language);
      }
    }

})

.controller('RestaurantMenuDishesCtrl',
  function($scope, $state, $stateParams, $rootScope) {
    if (!$rootScope.currentRestaurant) {
      var restaurant = new (Parse.Object.getClass("Restaurant"));
      restaurant.id = $stateParams.restaurantId;
      restaurant.fetch().then(function(foundRestaurant) {
        $rootScope.currentRestaurant = foundRestaurant;
      });
    }

    $scope.updateList = function(foundDishes) {
      $scope.dishes = _.map(foundDishes.models, function(dish) {
        return {
          id: dish.id,
          name: dish.getName(),
          description: dish.getDescription() !== null ? dish.getDescription() : dish.getDish().get('description'),
          price: dish.getDish().get('price')
        };
      });
    };

    $scope.loadDishesOfTranslationAndCategory = function(translation, category) {
      var dishes = new (Parse.Collection.getClass("TranslatedDish"));
      dishes.loadDishesOfTranslationAndCategory(translation, category).then($scope.updateList);
    };

    $scope.loadDishesOfTranslation = function(translation) {
      var dishes = new (Parse.Collection.getClass("TranslatedDish"));
      dishes.loadDishesOfTranslation(translation).then($scope.updateList);
    };

    var translation = new (Parse.Object.getClass("Translation"));
    translation.id = $stateParams.translationId;
    if ($stateParams.category) {
      // filter dishes by category
      var category = new (Parse.Object.getClass("Category"));
      category.id = $stateParams.category;
      $scope.loadDishesOfTranslationAndCategory(translation, category);
    } else {
      // load all dishes
      $scope.loadDishesOfTranslation(translation);
    }

    $scope.goToLanguage = function() {
      $state.go('restaurant.language');
    };
})

.controller('SearchCtrl', function() {
})

.controller('SearchCategoryCtrl',
  function($scope, $state) {
    var categories = new (Parse.Collection.getClass("TranslatedCategory"));

    $scope.loadCategories = function(language) {
      categories.loadGeneralCategoriesOfLanguage(language).then(function(foundCategories) {
        $scope.categories = _.map(foundCategories, function(category) {
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
})

.controller('RestaurantLanguageCtrl',
  function($scope, $rootScope, $state, $stateParams) {
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
    $scope.loadTranslations = function() {
      // load translations of restaurant
      var translations = new (Parse.Collection.getClass("Translation"));
      translations.loadTranslationsOfRestaurant($rootScope.currentRestaurant).then(function(foundTranslations) {
        $scope.translations = _.map(foundTranslations.models, function(translation) {
          return  {
            id: translation.id,
            language: translation.getLanguage()
          };
        });
      });
    };

    if (!$rootScope.currentRestaurant) {
      var restaurant = new (Parse.Object.getClass("Restaurant"));
      restaurant.id = $stateParams.restaurantId;
      restaurant.fetch().then(function(foundRestaurant) {
        $rootScope.currentRestaurant = foundRestaurant;
        $scope.loadTranslations();
      });
    } else {
      $scope.loadTranslations();
    }
})

.controller('SearchPriceCtrl',
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
})

.controller('SearchLanguageCtrl',
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
});
