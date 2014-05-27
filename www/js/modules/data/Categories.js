/* global Parse,_,$ */
// reference the module we declared earlier
angular.module('ExternalDataServices')

// add a factory
.factory('CategoriesService', ['ParseQueryAngular', 'TranslatedCategoriesService', function(ParseQueryAngular, TranslatedCategoriesService) {
	'use strict';
	var Category = Parse.Object.extendAngular({
		className:'Category',
		setName: function(name) {
			this.set('name', name);
			return this;
		},
		getName: function() {
			return this.get('name');
		},
		setRestaurant: function(restaurant) {
			this.set('restaurant', restaurant);
			return this;
		},
		getRestaurant: function() {
			return this.get('restaurant');
		},
		destroyParse:function(){
			return ParseQueryAngular(this,{functionToCall:'destroy'}); // jshint ignore:line
		}
	});

	var Categories = Parse.Collection.extendAngular({
		model: Category,
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		addCategory: function(name, restaurant, translations, $rootScope, modal, currentStep, steps) {
			// save request_id to Parse
			var _this = this;

			var category = new Category();
			category.setName(name);
			category.setRestaurant(restaurant);

			// use the extended Parse SDK to perform a save and return the promised object back into the Angular world
			$rootScope.progessAction = 'Creating category ' + name;
			return category.saveParse().then(function(data){
				// create translated dish for translation
				_.each(translations.models, function(translation) {
					$rootScope.progress = (++currentStep * 100) / steps;
					$rootScope.progessAction = 'Creating translation for ' + translation.getLanguage();

					var translatedCategory = new TranslatedCategoriesService.model();
					translatedCategory.setName(category.getName());
					translatedCategory.setTranslation(translation);
					translatedCategory.setCategory(data);
					translatedCategory.saveParse().then(function() {
						if(currentStep === steps) {
							$rootScope.progress = 100;
							$rootScope.progessAction = 'Created!';

							if (modal) {
								$(modal).modal('hide');
							}
						}
					});

					// update translation
					if (translation.getLanguage() !== restaurant.getInitialLanguage()) {
						translation.setCompleted(false);
						translation.saveParse();
					}
				});
				_this.add(data);
			});
		},
		addGeneralCategory: function(name) {
			// save request_id to Parse
			var _this = this;
			var category = new Category();
			category.setName(name);
			return category.saveParse().then(function(data){
				_this.add(data);
			});
		},
		loadCategoriesOfRestaurant: function(restaurant) {
			this.query = (new Parse.Query(Category));
			this.query.equalTo('restaurant', restaurant);
			this.query.ascending('name');
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadGeneralCategories: function() {
			this.query = (new Parse.Query(Category));
			this.query.equalTo('restaurant', null);
			this.query.ascending('name');
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		removeCategory:function(category) {
			if (!this.get(category)) { return false; }
			var _this = this;
			return category.destroyParse().then(function(){
				_this.remove(category);
			});
		}
	});

	// Return a simple API : model or collection.
	return {
		model: Category,
		collection: Categories
	};

}]);
