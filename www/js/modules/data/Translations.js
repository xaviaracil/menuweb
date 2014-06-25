/* global Parse,_,$ */
// reference the module we declared earlier
angular.module('ExternalDataServices')

// add a factory
.factory('TranslationService', ['ParseQueryAngular', 'TranslatedDishesService', function(ParseQueryAngular, TranslatedDishesService) {
	'use strict';
	var Translation = Parse.Object.extendAngular({
		className:'Translation',
		setLanguage: function(language) {
			this.set('language',language);
			return this;
		},
		getLanguage: function() {
			return this.get('language');
		},
		setRestaurant: function(restaurant) {
			this.set('restaurant', restaurant);
			return this;
		},
		getRestaurant: function() {
			return this.get('restaurant');
		},
		setCompleted: function(completed) {
			this.set('completed', completed);
		},
		getCompleted: function() {
			return this.get('completed');
		},
		destroyParse:function(){
			return ParseQueryAngular(this,{functionToCall:'destroy'}); // jshint ignore:line
		}
	});

	var Translations = Parse.Collection.extendAngular({
		model: Translation,
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		loadTranslations: function() {
			this.query = new Parse.Query(Translation);
			this.query.descending('name');
			this.query.include('restaurant');
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadTranslationsOfRestaurant: function(restaurant) {
			this.query = new Parse.Query(Translation);
			this.query.equalTo('restaurant', restaurant);
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadTranslationsOfRestaurantAndLanguage: function(restaurant, language) {
			this.query = new Parse.Query(Translation);
			this.query.equalTo('restaurant', restaurant);
			this.query.equalTo('language', language);
			// use the enhanced load() function to fetch the collection
			return this.load();
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
			return translation.saveParse().then(function(data){
				// create translated dish for each dish
				_.each(dishes.models, function(dish) {
					$rootScope.progress = (++currentStep * 100) / steps;
					$rootScope.progessAction = 'Creating initial translation for ' + dish.getName();

					var translatedDish = new TranslatedDishesService.model();
					translatedDish.setName(dish.getName());
					translatedDish.setTranslation(data);
					translatedDish.setDish(dish);
					translatedDish.saveParse().then(function() {
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
			return translation.destroyParse().then(function(){
				_this.remove(translation);
			});
		}
	});

	// Return a simple API : model or collection.
	return {
		model: Translation,
		collection: Translations
	};

}]);
