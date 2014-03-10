angular.module('menuweb', ['ionic', 
  'menuweb.controllers',   
  'ParseServices',
  'ExternalDataServices',
  'google-maps'
])


.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

    .state('restaurants', {
        url: "/restaurants",
        templateUrl: 'templates/restaurant-list.html',
        controller: 'RestaurantListCtrl'
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/restaurants');

})

.run(['ParseSDK', 'ExtendParseSDK', '$rootScope', function(ParseService, ExtendParseSDK, $rootScope) {
}]);

