angular.module('menuweb.controllers', [])


.controller('RestaurantListCtrl', ['$scope', '$ionicLoading', 'RestaurantService',
    function($scope, $ionicLoading, RestaurantService) {

        $scope.leftButtons = [
            {
                type: 'button-clear',
                content: '<i class="icon ion-ios7-search-strong"></i>',
                tap: function(e) {
                    // TODO: search button event
                }
            }
        ];
        $scope.rightButtons = [
            {
                type: 'button-icon',
                content: '<i class="icon ion-navicon"></i>',
                tap: function(e) {
                    $scope.sideMenuController.toggleRight();
                }
            }
        ];

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

        // event handlers
        $scope.find = function(text) {
            $scope.loading.show(loadingOptions);
            $scope.query = text;
            var foundRestaurantsPromise = restaurants.loadRestaurantsWithName(text);
            // update markers && hide loading
            foundRestaurantsPromise.then($scope.updateMarkers);
        };

        $scope.resetQuery = function() {
            $scope.query = null;
            $scope.map.markers = initialMarkers;
        };

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
]);
