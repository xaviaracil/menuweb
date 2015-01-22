/* global Parse,_,$ */
angular.module('menuweb.models.Translations', ['parse-angular.enhance'])
.run(function() {
	'use strict';

	// --------------------------
	// Translation Object Definition
	// --------------------------

	// Under the hood, everytime you fetch a Translation object from Parse,
	// the SDK will natively use this extended class, so you don't have to
	// worry about objects instantiation if you fetch them from a Parse query for instance
	var Translation = Parse.Object.extend({
		className:'Translation',
		// Extend the object with getter and setters
		attrs: ["language", "restaurant", "completed"]
	});

	// --------------------------
	// Translations Collection Definition
	// --------------------------
	var Translations = Parse.Collection.extend({
		model: Translation,
		// We give a className to be able to retrieve the collection
		// from the getClass helper. See parse-angular-patch git repo
		className: "Translation",
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		loadTranslations: function() {
			this.query = new Parse.Query(Translation);
			this.query.descending('name');
			this.query.include('restaurant');
			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		loadTranslationsOfRestaurant: function(restaurant) {
			this.query = new Parse.Query(Translation);
			this.query.equalTo('restaurant', restaurant);
			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		loadTranslationsOfRestaurantAndLanguage: function(restaurant, language) {
			this.query = new Parse.Query(Translation);
			this.query.equalTo('restaurant', restaurant);
			this.query.equalTo('language', language);
			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		addTranslation: function(language, restaurant, dishes, $rootScope, modal, currentStep, steps) {
			// save request_id to Parse
			var _this = this;

			var translation = new Translation();
			translation.setLanguage(language);
			translation.setCompleted(false);
			translation.setRestaurant(restaurant);

			$rootScope.progessAction = 'Creating translation for ' + language;
			// use the extended Parse SDK to perform a save and return the promised object back into the Angular world
			return translation.save().then(function(data){
				// create translated dish for each dish
				_.each(dishes.models, function(dish) {
					$rootScope.progress = (++currentStep * 100) / steps;
					$rootScope.progessAction = 'Creating initial translation for ' + dish.getName();

					var translatedDish = new TranslatedDishesService.model();
					translatedDish.setName(dish.getName());
					translatedDish.setTranslation(data);
					translatedDish.setDish(dish);
					translatedDish.save().then(function() {
						if(currentStep === steps) {
							$rootScope.progress = 100;
							$rootScope.progessAction = 'Created!';

							if (modal) {
								$(modal).modal('hide');
							}
						}
					});
				});
				_this.add(data);
			}, function(error) {
				$rootScope.progessAction = error.message;
				$rootScope.currentError = error.message;
				if (modal) {
					$(modal).modal('hide');
				}
			});
		},
		removeTranslation:function(translation) {
			if (!this.get(translation)) { return false; }
			var _this = this;
			return translation.destroy().then(function(){
				_this.remove(translation);
			});
		}
	});
});
