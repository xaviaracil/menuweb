/* global Parse */
// reference the module we declared earlier
angular.module('ExternalDataServices')

// add a factory
.factory('TranslatedDishesService', ['ParseQueryAngular', function(ParseQueryAngular) {
	'use strict';
	var TranslatedDish = Parse.Object.extendAngular({
		className:'TranslatedDish',
		setName: function(name) {
			this.set('name', name);
			return this;
		},
		getName: function() {
			return this.get('name');
		},
		setTranslation: function(translation) {
			this.set('translation', translation);
			return this;
		},
		setDish: function(dish) {
			this.set('dish', dish);
			return this;
		},
		getDish: function() {
			return this.get('dish');
		},
		destroyParse:function(){
			return ParseQueryAngular(this,{functionToCall:'destroy'}); // jshint ignore:line
		}
	});

	var TranslatedDishes = Parse.Collection.extendAngular({
		model: TranslatedDish,
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		loadDishesOfTranslation: function(translation) {
			this.query = new Parse.Query(TranslatedDish);
			this.query.include('dish');
			this.query.equalTo('translation', translation);
			//this.query.descending('dish.name');
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		addDish: function(name, translation) {
			// save request_id to Parse
			var _this = this;

			var translatedDish = new TranslatedDish();
			translatedDish.setName(name);
			translatedDish.setTranslation(translation);

			// use the extended Parse SDK to perform a save and return the promised object back into the Angular world
			return translatedDish.saveParse().then(function(data){
				_this.add(data);
			});
		},
		removeDish:function(translatedDish) {
			if (!this.get(translatedDish)) { return false; }
			var _this = this;
			return translatedDish.destroyParse().then(function(){
				_this.remove(translatedDish);
			});
		}
	});

	// Return a simple API : model or collection.
	return {
		model: TranslatedDish,
		collection: TranslatedDishes
	};

}]);
