// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'menuweb' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'menuweb.services' is found in services.js
// 'menuweb.controllers' is found in controllers.js
angular.module('menuweb', ['ionic',
  'menuweb.controllers',
  'ParseServices',
  'ExternalDataServices',
  'google-maps'
])


.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

    .state('restaurants', {
        url: "/restaurants",
        templateUrl: 'templates/restaurant-list.html',
        controller: 'RestaurantListCtrl'
      });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/restaurants');
})

.run(['ParseSDK', 'ExtendParseSDK', '$rootScope', function(ParseService, ExtendParseSDK, $rootScope) {
}]);
