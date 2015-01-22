/* global Parse,_,$ */
angular.module('menuweb.models.Categories', ['parse-angular.enhance'])
.run(function() {
	'use strict';

	// --------------------------
	// Category Object Definition
	// --------------------------

	// Under the hood, everytime you fetch a Category object from Parse,
	// the SDK will natively use this extended class, so you don't have to
	// worry about objects instantiation if you fetch them from a Parse query for instance
	var Category = Parse.Object.extend({
		className:'Category',
		// Extend the object with getter and setters
		attrs: ["name", "restaurant"]
	});


	// --------------------------
	// Category Collection Definition
	// --------------------------
	var Categories = Parse.Collection.extend({
		model: Category,
		// We give a className to be able to retrieve the collection
		// from the getClass helper. See parse-angular-patch git repo
		className: "Category",
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
			return category.save().then(function(data){
				// create translated dish for translation
				_.each(translations.models, function(translation) {
					$rootScope.progress = (++currentStep * 100) / steps;
					$rootScope.progessAction = 'Creating translation for ' + translation.getLanguage();

					var translatedCategory = new TranslatedCategoriesService.model();
					translatedCategory.setName(category.getName());
					translatedCategory.setTranslation(translation);
					translatedCategory.setCategory(data);
					translatedCategory.save().then(function() {
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
						translation.save();
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
			return category.save().then(function(data){
				_this.add(data);
			});
		},
		loadCategoriesOfRestaurant: function(restaurant) {
			this.query = (new Parse.Query(Category));
			this.query.equalTo('restaurant', restaurant);
			this.query.ascending('name');
			return this.query.find();
		},
		loadGeneralCategories: function() {
			this.query = (new Parse.Query(Category));
			this.query.equalTo('restaurant', null);
			this.query.ascending('name');
			return this.query.find();
		},
		removeCategory:function(category) {
			if (!this.get(category)) { return false; }
			var _this = this;
			return category.destroy().then(function(){
				_this.remove(category);
			});
		}
	});
});
