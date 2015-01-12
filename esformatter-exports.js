"use strict";

window.esformatter = require("esformatter");
window.presets = require("./node_modules/esformatter/lib/options").presets;
window.esformatterPlugins = [
	{
		name: "esformatter-quotes",
		displayName: "quotes",
		exports: require("esformatter-quotes")
		// TODO: add options!
	},
	{
		name: "esformatter-braces",
		displayName: "braces",
		exports: require("esformatter-braces")
	},
	{
		name: "esformatter-semicolons",
		displayName: "semicolons",
		exports: require("esformatter-semicolons")
	}
];