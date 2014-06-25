// 'menuweb' is the name of this angular module (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'menuweb.controllers' is found in controllers.js
// 'menuweb.filters' is found in filters.js
angular.module('menuweb', ['ionic',
  'menuweb.controllers',
  'menuweb.filters',
  'ParseServices',
  'ExternalDataServices',
  'google-maps',
  'ngCordova'
])

.config(function($stateProvider, $urlRouterProvider) {

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

.run(['ParseSDK', 'ExtendParseSDK', '$rootScope', '$state', '$stateParams',
 function(ParseService, ExtendParseSDK, $rootScope, $state, $stateParams) {
   $rootScope.$state = $state;
   $rootScope.$stateParams = $stateParams;
}]);
