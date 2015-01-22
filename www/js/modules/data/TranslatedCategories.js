/* global Parse */
angular.module('menuweb.models.TranslatedCategory', ['parse-angular.enhance'])
.run(function() {
	'use strict';

	// --------------------------
	// TranslatedCategory Object Definition
	// --------------------------

	// Under the hood, everytime you fetch a TranslatedCategory object from Parse,
	// the SDK will natively use this extended class, so you don't have to
	// worry about objects instantiation if you fetch them from a Parse query for instance
	var TranslatedCategory = Parse.Object.extend({
		className:'TranslatedCategory',
		// Extend the object with getter and setters
		attrs: ["name", "translation", "category", "language"]
	});

	// --------------------------
	// TranslatedCategory Collection Definition
	// --------------------------
	var TranslatedCategories = Parse.Collection.extend({
		model: TranslatedCategory,
		// We give a className to be able to retrieve the collection
		// from the getClass helper. See parse-angular-patch git repo
		className: "TranslatedCategory",
		comparator: function(model) {
			return -model.createdAt.getTime();
		},
		loadCategoriesOfTranslation: function(translation) {
			this.query = new Parse.Query(this.model);
			this.query.include('category');
			this.query.equalTo('translation', translation);
			this.query.descending('name');
			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		loadTranslationsOfCategory: function(category) {
			this.query = new Parse.Query(this.model);
			this.query.include('translation');
			this.query.equalTo('category', category);
			// use the enhanced load() function to fetch the collection
			return this.fetch();
		},
		loadGeneralCategoriesOfLanguage: function(language) {
			this.query = new Parse.Query(this.model);
			this.query.include('category');
			this.query.equalTo('language', language);
			this.query.ascending('name'); // TODO: mirar que no ordena
			// use the enhanced load() function to fetch the collection
			return this.query.find();
		},
		addCategory: function(name, translation) {
			// save request_id to Parse
			var _this = this;

			var translatedCategory = new TranslatedCategory();
			translatedCategory.setName(name);
			translatedCategory.setTranslation(translation);

			// use the extended Parse SDK to perform a save and return the promised object back into the Angular world
			return translatedCategory.save().then(function(data){
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
			return translatedCategory.save().then(function(data){
				_this.add(data);
			});
		},
		removeCategory:function(translatedCategory) {
			if (!this.get(translatedCategory)) { return false; }
			var _this = this;
			return translatedCategory.destroy().then(function(){
				_this.remove(translatedCategory);
			});
		}
	});
});
