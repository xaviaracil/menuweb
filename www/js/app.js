// 'menuweb' is the name of this angular module (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'menuweb.controllers' is found in controllers.js
// 'menuweb.filters' is found in filters.js
angular.module('menuweb', ['ionic',
  'uiGmapgoogle-maps',
  'ngCordova',
  'parse-angular',
  'parse-angular.enhance',
  'menuweb.controllers',
  'menuweb.filters',
  'menuweb.models.Categories',
  'menuweb.models.Dishes',
  'menuweb.models.Restaurants',
  'menuweb.models.TranslatedCategory',
  'menuweb.models.TranslatedDish',
  'menuweb.models.Translations'
])

.config(function($stateProvider, $urlRouterProvider, uiGmapGoogleMapApiProvider, $ionicConfigProvider) {

  // Parse init
  // pro-tip: swap these keys out for PROD keys automatically on deploy using grunt-replace
  Parse.initialize("0l9HVP7fBLbbV1Qlp1SHHAoOVYC93Boo51SbI1tf", "dOD99fLcB07AwOTmrFgZZRQvi4HfPLpJyQV6sbr9");

  // Load Google Maps
  uiGmapGoogleMapApiProvider.configure({
    key: 'AIzaSyAKIhcVJSlb5vEiXYQxhDnPbS6rnRmPJVY'
  });

  // Disable caching
  $ionicConfigProvider.views.maxCache(0);

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('map', {
      url: "/",
      views: {
        'home': {
          templateUrl: 'templates/restaurant-map.html',
          controller: 'RestaurantMapCtrl'
        }
      }
    })
    .state('restaurants', {
      url: "/restaurants?categories&priceranges&languages",
      views: {
        'home': {
          templateUrl: 'templates/restaurant-list.html',
          controller: 'RestaurantListCtrl'
        }
      }
    })
    .state('restaurant', {
      url: "/restaurants/:restaurantId",
      views: {
        'home': {
          templateUrl: 'templates/restaurant.html',
          controller: 'RestaurantCtrl'
        }
      }
    })
    .state('restaurant.menu', {
      url: "/menu?translation",
      views: {
        'home@': {
          templateUrl: 'templates/restaurant-menu.html',
          controller: 'RestaurantMenuCtrl'
        }
      }
    })
    .state('restaurant.menu.dishes', {
      url: "/menu/translation/:translationId?category",
      views: {
        'home@': {
          templateUrl: 'templates/restaurant-dishes.html',
          controller: 'RestaurantMenuDishesCtrl'
        }
      }
    })
    .state('restaurant.language', {
      url: "/language",
      views: {
        'home@': {
          templateUrl: 'templates/restaurant-language.html',
          controller: 'RestaurantLanguageCtrl'
        }
      }
    })
    .state('search', {
      url: "/search",
      views: {
        'home': {
          templateUrl: 'templates/advanced-search.html',
          controller: 'SearchCtrl'
        }
      }
    })
    .state('searchcategory', {
      url: "/categories",
      views: {
        'home': {
          templateUrl: 'templates/advanced-search-category.html',
          controller: 'SearchCategoryCtrl'
        }
      }
    })
    .state('searchprice', {
      url: "/price",
      views: {
        'home': {
          templateUrl: 'templates/advanced-search-price.html',
          controller: 'SearchPriceCtrl'
        }
      }
    })
    .state('searchlanguage', {
      url: "/language",
      views: {
        'home': {
          templateUrl: 'templates/advanced-search-language.html',
          controller: 'SearchLanguageCtrl'
        }
      }
    });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/');
})

.run(['$rootScope', '$state', '$stateParams',
 function($rootScope, $state, $stateParams) {
   $rootScope.$state = $state;
   $rootScope.$stateParams = $stateParams;

   $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams, error){
     $rootScope.lastState = { state: fromState, params: fromParams }
   });   
}]);
