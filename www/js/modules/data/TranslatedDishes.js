/* global Parse */
angular.module('menuweb.models.TranslatedDish', ['parse-angular.enhance'])
.run(function() {
	'use strict';

	// --------------------------
	// TranslatedDish Object Definition
	// --------------------------

	// Under the hood, everytime you fetch a TranslatedDish object from Parse,
	// the SDK will natively use this extended class, so you don't have to
	// worry about objects instantiation if you fetch them from a Parse query for instance
	var TranslatedDish = Parse.Object.extend({
		className:'TranslatedDish',
		// Extend the object with getter and setters
		attrs: ["name", "translation", "description", "dish"]
	});

	// --------------------------
	// TranslatedDish Collection Definition
	// --------------------------
	var TranslatedDishes = Parse.Collection.extend({
		model: TranslatedDish,
		// We give a className to be able to retrieve the collection
		// from the getClass helper. See parse-angular-patch git repo
		className: "TranslatedDish",
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		loadDishesOfTranslation: function(translation) {
			this.query = new Parse.Query(TranslatedDish);
			this.query.include('dish');
			this.query.equalTo('translation', translation);
			this.query.descending('name');
			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		loadDishesOfTranslationAndCategory: function(translation, category) {
			this.query = new Parse.Query(TranslatedDish);
			this.query.equalTo('translation', translation);

			// subquery by dish.category
			// doing this way to avoid circular dependency
			var Dish = Parse.Object.extend("Dish");
			var categoryQuery = new Parse.Query(Dish);
			categoryQuery.equalTo('category', category);
			this.query.matchesQuery('dish', categoryQuery);
			this.query.descending('name');
			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},

		addDish: function(name, translation) {
			// save request_id to Parse
			var _this = this;

			var translatedDish = new TranslatedDish();
			translatedDish.setName(name);
			translatedDish.setTranslation(translation);

			// use the extended Parse SDK to perform a save and return the promised object back into the Angular world
			return translatedDish.save().then(function(data){
				_this.add(data);
			});
		},
		removeDish:function(translatedDish) {
			if (!this.get(translatedDish)) { return false; }
			var _this = this;
			return translatedDish.destroy().then(function(){
				_this.remove(translatedDish);
			});
		}
	});
});
