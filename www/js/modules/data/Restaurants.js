/* global Parse */
angular.module('menuweb.models.Restaurants', ['parse-angular.enhance'])
.run(function() {
	'use strict';

	// --------------------------
	// Restaurant Object Definition
	// --------------------------

	// Under the hood, everytime you fetch a Restaurant object from Parse,
	// the SDK will natively use this extended class, so you don't have to
	// worry about objects instantiation if you fetch them from a Parse query for instance
	var Restaurant = Parse.Object.extend({
		className:'Restaurant',
		// Extend the object with getter and setters
		attrs: ["name", "normalizedName", "location", "address", "postalCode", "city", "state", "initialLanguage", "translationNumber", "translated", "priceRange", "description", "phone"],
		setLogoFile: function(logoFile) {
			this.set("logoFile", logoFile);
			return this;
		},
		getLogoFile: function() {
			var logoFile = this.get("logoFile");
			return logoFile ? logoFile.url() : "img/imagotipo.svg";
		}
	});

	// --------------------------
	// Restaurant Collection Definition
	// --------------------------
	var Restaurants = Parse.Collection.extend({
		model: Restaurant,
		withinKilometers: 20, // TODO change to 5
		// We give a className to be able to retrieve the collection
		// from the getClass helper. See parse-angular-patch git repo
		className: "Restaurant",
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		loadRestaurantsWithName: function(name) {
			this.query = new Parse.Query(Restaurant);
			this.query.contains('normalizedName', name.toLowerCase());
			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		loadPendingRestaurants: function() {
			this.query = new Parse.Query(Restaurant);
			this.query.equalTo('translated', false);
			this.query.descending('name');
			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		loadRestaurantsOrderedByName: function() {
			this.query = (new Parse.Query(Restaurant));
			this.query.descending('name');
			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		loadRestaurantsWithinGeoBox: function(point) {
			this.query = (new Parse.Query(Restaurant));
			this.query.withinKilometers('location', point, this.withinKilometers);
			return this.fetch();
		},
		loadRestaurantsWithinGeoBoxAndCategories: function(point, categories) {
			if (!categories || !_.size(categories)) {
				return this.loadRestaurantsWithinGeoBox(point);
			}

			if (_.isArray(categories)) {
				var self = this;
				var categoriesQueries = _.map(categories, function(category) {
					var query = new Parse.Query(Restaurant);
					query.withinKilometers('location', point, self.withinKilometers);
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
				this.query.withinKilometers('location', point, this.withinKilometers);
			}

			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		loadRestaurantsWithinGeoBoxAndPriceRanges: function(point, priceRanges) {
			if (!priceRanges || !_.size(priceRanges)) {
				return this.loadRestaurantsWithinGeoBox(point);
			}

			if (_.isArray(priceRanges)) {
				var self = this;
				var priceRangesQueries = _.map(priceRanges, function(priceRange) {
					var query = new Parse.Query(Restaurant);
					query.withinKilometers('location', point, self.withinKilometers);
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
				this.query.withinKilometers('location', point, this.withinKilometers);
			}

			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},

		loadRestaurantsWithinGeoBoxAndLanguages: function(point, languages) {
			if (!languages || !_.size(languages)) {
				return this.loadRestaurantsWithinGeoBox(point);
			}

			if (_.isArray(languages)) {
				var self = this;
				var languagesQueries = _.map(languages, function(language) {
					var query = new Parse.Query(Restaurant);
					query.withinKilometers('location', point, self.withinKilometers);
					query.equalTo('languages', language);
					return query;
				});
				if (_.size(languagesQueries) === 1) {
					this.query = _.first(languagesQueries);
				} else {
					this.query = Parse.Query.or.apply(null, languagesQueries);
				}
			} else {
				this.query = (new Parse.Query(Restaurant));
				this.query.equalTo('languages', languages);
				// geopoint query, 5 km distance
				this.query.withinKilometers('location', point, this.withinKilometers);
			}

			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		addRestaurant: function(name, initialLanguage) {
			// save request_id to Parse
			var _this = this;

			var restaurant = new Restaurant();
			restaurant.setName(name);
			restaurant.setInitialLanguage(initialLanguage);

			// use the extended  SDK to perform a save and return the promised object back into the Angular world
			return restaurant.save().then(function(data){
				_this.add(data);
			});
		},
		removeRestaurant:function(restaurant) {
			if (!this.get(restaurant)) { return false; }
			var _this = this;
			return restaurant.destroy().then(function(){
				_this.remove(restaurant);
			});
		}
	});
});
