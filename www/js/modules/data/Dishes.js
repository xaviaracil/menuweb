/* global Parse,_,$ */
// reference the module we declared earlier
angular.module('ExternalDataServices')

// add a factory
.factory('DishesService', ['ParseQueryAngular', 'TranslatedDishesService', function(ParseQueryAngular, TranslatedDishesService) {
	'use strict';
	var Dish = Parse.Object.extendAngular({
		className:'Dish',
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
		setCategory: function(category) {
    		this.set('category', category);
    		return this;
		},
		getCategory: function() {
    		return this.get('category');
		},
		getDescription: function() {
  		return this.get('description');
		},
		setDescription: function(description) {
  		this.set('description', description);
  		return this;
		},
		getPrice: function() {
  		return this.get('price');  		
		},
		setPrice: function(price) {
  		this.set('price', price);
  		return this;
		},
		destroyParse:function(){
			return ParseQueryAngular(this,{functionToCall:'destroy'}); // jshint ignore:line
		}
	});

	var Dishes = Parse.Collection.extendAngular({
		model: Dish,
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
			return dish.saveParse().then(function(data){
				// create translated dish for translation
				_.each(translations.models, function(translation) {
					$rootScope.progress = (++currentStep * 100) / steps;
					$rootScope.progessAction = 'Creating translation for ' + translation.getLanguage();

					var translatedDish = new TranslatedDishesService.model();
					translatedDish.setName(dish.getName());
					translatedDish.setTranslation(translation);
					translatedDish.setDish(data);
					translatedDish.saveParse().then(function() {
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
		loadDishesOfRestaurant: function(restaurant) {
			this.query = (new Parse.Query(Dish));
			this.query.equalTo('restaurant', restaurant);
			this.query.ascending('name');
			this.query.include('category');
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		removeDish:function(dish) {
			if (!this.get(dish)) { return false; }
			var _this = this;
			return dish.destroyParse().then(function(){
				_this.remove(dish);
			});
		}
	});

	// Return a simple API : model or collection.
	return {
		model: Dish,
		collection: Dishes
	};

}]);
