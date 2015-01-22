/* global Parse,_,$ */
angular.module('menuweb.models.Dishes', ['parse-angular.enhance'])
.run(function() {
	'use strict';

	// --------------------------
	// Dish Object Definition
	// --------------------------

	// Under the hood, everytime you fetch a Dish object from Parse,
	// the SDK will natively use this extended class, so you don't have to
	// worry about objects instantiation if you fetch them from a Parse query for instance
	var Dish = Parse.Object.extend({
		className:'Dish',
		// Extend the object with getter and setters
		attrs: ["name", "restaurant", "category", "description", "price"]
	});

	// --------------------------
	// Dish Collection Definition
	// --------------------------
	var Dishes = Parse.Collection.extend({
		model: Dish,
		// We give a className to be able to retrieve the collection
		// from the getClass helper. See parse-angular-patch git repo
		className: "Dish",
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		addDish: function(name, description, price, restaurant, category, translations, $rootScope, modal, currentStep, steps) {
			// save request_id to Parse
			var _this = this;

			var dish = new Dish();
			dish.setName(name);
			dish.setDescription(description);
			dish.setPrice(price);
			dish.setRestaurant(restaurant);
			dish.setCategory(category);

			// use the extended Parse SDK to perform a save and return the promised object back into the Angular world
			$rootScope.progessAction = 'Creating dish ' + name;
			return dish.save().then(function(data){
				// create translated dish for translation
				_.each(translations.models, function(translation) {
					$rootScope.progress = (++currentStep * 100) / steps;
					$rootScope.progessAction = 'Creating translation for ' + translation.getLanguage();

					var translatedDish = new TranslatedDishesService.model();
					translatedDish.setName(dish.getName());
					translatedDish.setTranslation(translation);
					translatedDish.setDish(data);
					translatedDish.save().then(function() {
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
		loadDishesOfRestaurant: function(restaurant) {
			this.query = (new Parse.Query(Dish));
			this.query.equalTo('restaurant', restaurant);
			this.query.ascending('name');
			this.query.include('category');
			return this.query.find();
		},
		removeDish:function(dish) {
			if (!this.get(dish)) { return false; }
			var _this = this;
			return dish.destroy().then(function(){
				_this.remove(dish);
			});
		}
	});
});
