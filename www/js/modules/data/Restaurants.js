// reference the module we declared earlier
angular.module('ExternalDataServices')

// add a factory
.factory('RestaurantService', ['ParseQueryAngular', function(ParseQueryAngular) {

	var Restaurant = Parse.Object.extendAngular({
		className:"Restaurant",
		setName: function(name) {
			this.set('name',name);
			return this;
		},
		getName: function(name) {
			return this.get('name');
		},
		setLocation: function(location) {
    		this.set('location', location);
		},
		getLocation: function() {
    		return this.get('location');
		},
		getTranslationNumber: function() {
    		return this.get('translationNumber');
		},
		getTranslated: function() {
    		return this.get('translated');
		},
		destroyParse:function(){
			return ParseQueryAngular(this,{functionToCall:"destroy"});
		}
	});

	var Restaurants = Parse.Collection.extendAngular({
		model: Restaurant,
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		loadRestaurantsWithName: function(name) {
			this.query = (new Parse.Query(Restaurant));
			this.query.contains('normalizedName', name.toLowerCase());
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadPendingRestaurants: function(name) {
			this.query = (new Parse.Query(Restaurant));
			this.query.equalTo('translated', false);
			this.query.descending('name');
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadRestaurantsOrderedByName: function(name) {
			this.query = (new Parse.Query(Restaurant));
			this.query.descending('name');
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadRestaurantsWithinGeoBox: function(point) {
			this.query = (new Parse.Query(Restaurant));
		    // TODO: geopoint query
			this.query.withinKilometers('location', point, 10);
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		addRestaurant: function(name) {
	 		// save request_id to Parse
	 		var _this = this;

			var restaurant = new Restaurant;
			restaurant.setName(name);

			// use the extended Parse SDK to perform a save and return the promised object back into the Angular world
			return restaurant.saveParse().then(function(data){
				_this.add(data);
			})
	 	},
	 	removeRestaurant:function(restaurant) {
	 		if (!this.get(restaurant)) return false;
	 		var _this = this;
	 		return restaurant.destroyParse().then(function(){
	 			_this.remove(restaurant);
	 		});
	 	}
	});

	// Return a simple API : model or collection.
	return {
		model: Restaurant,
		collection: Restaurants
	};

}]);