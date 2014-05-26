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
		getNormalizedName: function() {
			return this.get('normalizedName');
		},
		setLocation: function(location) {
			this.set('location', location);
		},
		getLocation: function() {
			return this.get('location');
		},
		setAddress: function(address) {
			this.set('address', address);
		},
		getAddress: function() {
			return this.get('address');
		},
		setPostalCode: function(postalCode) {
			this.set('postalCode', postalCode);
		},
		getPostalCode: function() {
			return this.get('postalCode');
		},
		setCity: function(city) {
			this.set('city', city);
		},
		getCity: function() {
			return this.get('city');
		},
		setState: function(state) {
			this.set('state', state);
		},
		getState: function() {
			return this.get('state');
		},
		setInitialLanguage: function(initialLanguage) {
			this.set('initialLanguage', initialLanguage);
			return this;
		},
		getInitialLanguage: function() {
			return this.get('initialLanguage');
		},
		getTranslationNumber: function() {
			return this.get('translationNumber');
		},
		getTranslated: function() {
			return this.get('translated');
		},
		getLogoUrl: function() {
			return "img/icon.png"; // TODO change
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
		}
	});

	// Return a simple API : model or collection.
	return {
		model: Restaurant,
		collection: Restaurants
	};

}]);
