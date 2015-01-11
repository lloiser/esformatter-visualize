"use strict";

window.esformatter = require("esformatter");
window.presets = require("./node_modules/esformatter/lib/options").presets;
esformatter.register(require("esformatter-braces"));
esformatter.register(require("esformatter-quotes"));