/* global Parse */
// reference the module we declared earlier
angular.module('ExternalDataServices')

// add a factory
.factory('RestaurantService', ['ParseQueryAngular', function(ParseQueryAngular) {
	'use strict';
	var Restaurant = Parse.Object.extendAngular({
		className:'Restaurant',
		setName: function(name) {
			this.set('name',name);
			return this;
		},
		getName: function() {
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
		setPriceRange: function(pricerange) {
			this.set('priceRange', pricerange);
			return this;
		},
		getPriceRange: function() {
			return this.get('priceRange');
		},
		setLogoFile: function(logoFile) {
			this.set("logoFile", logoFile);
			return this;
		},
		getLogoFile: function() {
			var logoFile = this.get("logoFile");
			return logoFile ? logoFile.url() : "img/defaultIcon.png";
		},
		getDescription: function() {
			return this.get("description");
		},
		setDescription: function(description) {
			this.set("description", description);
			return this;
		},
		destroyParse:function(){
			return ParseQueryAngular(this,{functionToCall:'destroy'}); // jshint ignore:line
		}
	});

	var Restaurants = Parse.Collection.extendAngular({
		model: Restaurant,
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		loadRestaurantsWithName: function(name) {
			this.query = new Parse.Query(Restaurant);
			this.query.contains('normalizedName', name.toLowerCase());
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadPendingRestaurants: function() {
			this.query = new Parse.Query(Restaurant);
			this.query.equalTo('translated', false);
			this.query.descending('name');
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadRestaurantsOrderedByName: function() {
			this.query = (new Parse.Query(Restaurant));
			this.query.descending('name');
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadRestaurantsWithinGeoBox: function(point) {
			this.query = (new Parse.Query(Restaurant));
			// geopoint query, 5 km distance
			this.query.withinKilometers('location', point, 5);
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadRestaurantsWithinGeoBoxAndCategories: function(point, categories) {
			if (!categories || !_.size(categories)) {
				return this.loadRestaurantsWithinGeoBox(point);
			}

			if (_.isArray(categories)) {
				var categoriesQueries = _.map(categories, function(category) {
					var query = new Parse.Query(Restaurant);
					query.withinKilometers('location', point, 5); // geopoint query, 5 km distance
					query.equalTo('generalCategories', category);
					return query;
				});
				if (_.size(categoriesQueries) === 1) {
					this.query = _.first(categoriesQueries);
				} else {
					this.query = Parse.Query.or.apply(null, categoriesQueries);
				}
			} else {
				this.query = (new Parse.Query(Restaurant));
				this.query.equalTo('generalCategories', categories);
				// geopoint query, 5 km distance
				this.query.withinKilometers('location', point, 5);
			}

			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadRestaurantsWithinGeoBoxAndPriceRanges: function(point, priceRanges) {
			if (!priceRanges || !_.size(priceRanges)) {
				return this.loadRestaurantsWithinGeoBox(point);
			}

			if (_.isArray(priceRanges)) {
				var priceRangesQueries = _.map(priceRanges, function(priceRange) {
					var query = new Parse.Query(Restaurant);
					query.withinKilometers('location', point, 5); // geopoint query, 5 km distance
					query.equalTo('priceRange', _.isNumber(priceRange) ? priceRange : parseInt(priceRange));
					return query;
				});
				if (_.size(priceRangesQueries) === 1) {
					this.query = _.first(priceRangesQueries);
				} else {
					this.query = Parse.Query.or.apply(null, priceRangesQueries);
				}
			} else {
				this.query = (new Parse.Query(Restaurant));
				this.query.equalTo('priceRange', _.isNumber(priceRange) ? priceRange : parseInt(priceRange));
				// geopoint query, 5 km distance
				this.query.withinKilometers('location', point, 5);
			}

			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		addRestaurant: function(name, initialLanguage) {
			// save request_id to Parse
			var _this = this;

			var restaurant = new Restaurant();
			restaurant.setName(name);
			restaurant.setInitialLanguage(initialLanguage);

			// use the extended Parse SDK to perform a save and return the promised object back into the Angular world
			return restaurant.saveParse().then(function(data){
				_this.add(data);
			});
		},
		removeRestaurant:function(restaurant) {
			if (!this.get(restaurant)) { return false; }
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
