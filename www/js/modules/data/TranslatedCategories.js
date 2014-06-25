/* global Parse */
// reference the module we declared earlier
angular.module('ExternalDataServices')

// add a factory
.factory('TranslatedCategoriesService', ['ParseQueryAngular', function(ParseQueryAngular) {
	'use strict';
	var TranslatedCategory = Parse.Object.extendAngular({
		className:'TranslatedCategory',
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
		setCategory: function(category) {
			this.set('category', category);
			return this;
		},
		getCategory: function() {
			return this.get('category');
		},
		setLanguage: function(language) {
			this.set('language', language);
			return this;
		},
		getLanguage: function() {
			return this.get('language');
		},
		destroyParse:function(){
			return ParseQueryAngular(this,{functionToCall:'destroy'}); // jshint ignore:line
		}
	});

	var TranslatedCategories = Parse.Collection.extendAngular({
		model: TranslatedCategory,
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		loadCategoriesOfTranslation: function(translation) {
			this.query = new Parse.Query(TranslatedCategory);
			this.query.include('category');
			this.query.equalTo('translation', translation);
			this.query.descending('name');
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadTranslationsOfCategory: function(category) {
			this.query = new Parse.Query(TranslatedCategory);
			this.query.include('translation');
			this.query.equalTo('category', category);
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		loadGeneralCategoriesOfLanguage: function(language) {
			this.query = new Parse.Query(TranslatedCategory);
			this.query.include('category');
			this.query.equalTo('language', language);
			this.query.ascending('name'); // TODO: mirar que no ordena
			// use the enhanced load() function to fetch the collection
			return this.load();
		},
		addCategory: function(name, translation) {
			// save request_id to Parse
			var _this = this;

			var translatedCategory = new TranslatedCategory();
			translatedCategory.setName(name);
			translatedCategory.setTranslation(translation);

			// use the extended Parse SDK to perform a save and return the promised object back into the Angular world
			return translatedCategory.saveParse().then(function(data){
				_this.add(data);
			});
		},
    addGeneralCategory: function(category, language, name) {
			// save request_id to Parse
			var _this = this;

			var translatedCategory = new TranslatedCategory();
			translatedCategory.setCategory(category);
			translatedCategory.setName(name);
			translatedCategory.setLanguage(language);

			// use the extended Parse SDK to perform a save and return the promised object back into the Angular world
			return translatedCategory.saveParse().then(function(data){
				_this.add(data);
			});
    },
		removeCategory:function(translatedCategory) {
			if (!this.get(translatedCategory)) { return false; }
			var _this = this;
			return translatedCategory.destroyParse().then(function(){
				_this.remove(translatedCategory);
			});
		}
	});

	// Return a simple API : model or collection.
	return {
		model: TranslatedCategory,
		collection: TranslatedCategories
	};

}]);
