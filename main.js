(function (window, document) {

"use strict";

var customOptions = { preset: "default" };
var $input = $("#input");
var $output = $("#output");
var $presets = $("#presets");
var $options = $("#options");
var $plugins = $("#plugins");

function init()
{
	createPresets();
	createPlugins();

	addEvents();

	loadOptions();
	updateOptions();
}

function addEvents()
{
	$input.on("keydown", onCodeKeydown);
	$("#format").on("click", onFormatClick);
	$options
		.on("change", "input", onOptionChange)
		.on("click", ".options-group-title", onOptionsGroupToggle);
	$("#importScript").on("change", onImportScript);
	$("#importOptions").on("change", onImportOptions);
	$presets.on("change", onPresetChange);
	$plugins.on("change", onPluginChange);
}

function loadOptions()
{
	// get the last options
	var options = localStorage.getItem("options");
	if (options)
		customOptions = JSON.parse(options);
}

function updateOptions()
{
	$options
		.empty()
		.append(buildTree(buildDisplayOptions(), ""));
	updateOptionsOutput();
}

function updateOptionsOutput()
{
	var options = JSON.stringify(customOptions);
	var output = esformatter.format("x = " + options);
	$("#optionsOutput").val(output.replace("x = ", ""));

	// save the current options
	localStorage.setItem("options", options);
}

function buildDisplayOptions()
{
	var options = [customOptions];
	var preset = customOptions.preset;
	while (preset)
	{
		var presetOptions = presets[preset];
		options.unshift(presetOptions);
		preset = presetOptions.preset;
	}
	options.unshift(true, {});
	return $.extend.apply($, options);
}

function buildTree(options, path)
{
	var $group = $("<ul />").addClass("options-group-container");
	var keys = Object.keys(options)//.sort();
	for (var i = 0; i < keys.length; i++)
	{
		var name = keys[i];
		if (!path && ["plugins", "preset"].indexOf(name) >= 0)
			continue;

		var innerPath = path + (!path ? "" : "-") + name;
		var $option = $("<li />");

		var v = options[name];
		if (typeof(v) !== "object")
		{
			var type = typeof(v);
			if (type === "string")
				v = escapeBackslash(v);

			var $input = $("<input />", {
				value: getCustomOptionValue(innerPath),
				placeholder: v,
				type: "text",
				"data-path": innerPath,
				"data-type": type,
				"class": "options-option"
			});

			var $label = $("<label />").text(name + ": ")
				.append($input);

			$option.append($label);
		}
		else
		{
			$option
				.addClass("options-group")
				.append("<span class='options-group-title'><b>v</b>" + name + "</span>")
				.append(buildTree(v, innerPath));
		}
		$group.append($option);
	}
	return $group;
}

function createPresets()
{
	Object.keys(presets).forEach(function(preset) {
		$presets.append($("<option />").text(preset));
	});

	$presets.val(customOptions.preset);
}

function createPlugins()
{
	esformatterPlugins.forEach(function(p) {
		var n = p.displayName || p.name;
		var $v = $("<input type='checkbox'/>").val(n);
		var $p = $("<label />").append(n).append($v);
		$plugins.append($p);
	});
}

function getCustomOptionValue(path)
{
	return path.split("-").reduce(function(o, p) { return o && o[p]; }, customOptions);
}

function cleanCustomOptions()
{
	function traverse(parent, name)
	{
		var options = parent[name];
		for (var i in options)
		{
			var t = typeof(options[i])
			if (t === "object")
				traverse(options, i);
			else if (t === "undefined")
				delete options[i];
		}
		if (!Object.keys(options).length)
			delete parent[name];
	}
	traverse({ o: customOptions }, "o");
}

function updateOutput()
{
	$output.val(
		esformatter.format($input.val(), customOptions)
	);
}

/*
 * EVENT HANDLER
 */

function onOptionChange()
{
	// write back all changes into the custom dictionary
	var $this = $(this);

	var path = $this.attr("data-path").split("-");
	var last = path.splice(path.length - 1)[0];

	var parentObjects = [];
	var o = path.reduce(
		function(o, p) {
			if (!o[p])
				o[p] = {};
			parentObjects.push(o[p]);
			return o[p];
		},
		customOptions
	);

	var value = $this.val();
	if (value)
	{
		if ($this.attr("data-type") === "number")
			value = parseInt(value, 10);
		else
			value = unescapeBackslash(value);
		o[last] = value;
	}
	else
	{
		delete o[last];
		cleanCustomOptions();
	}

	updateOutput();
	updateOptionsOutput();
}

function onOptionsGroupToggle(ev)
{
	var toggleElement = this.firstElementChild;
	var hide = toggleElement.textContent.substr(0, 1) === "v";
	toggleElement.textContent = hide ? ">" : "v";
	this.nextElementSibling.style.display = hide ? "none" : "";
}

function onCodeKeydown(ev)
{
	// simple keydown handler to support tabs
	var keyCode = ev.keyCode || ev.which;
	if (keyCode !== 9)
		return;

	// get caret position/selection
	var start = this.selectionStart;
	var end = this.selectionEnd;

	// set textarea value to: text before caret + tab + text after caret
	var value = this.value;
	this.value =
		value.substring(0, start) +
		"\t" +
		value.substring(end);

	// put caret at right position again (add one for the tab)
	this.selectionStart = this.selectionEnd = start + 1;

	// prevent the focus lose
	ev.preventDefault();
}

function onFormatClick(ev)
{
	ev.preventDefault();
	updateOutput();
}

function onImportScript(ev)
{
	readFile(this.files[0], function(t) {
		$input.val(t);
	});
}

function onImportOptions(ev)
{
	readFile(this.files[0], function(t) {
		customOptions = JSON.parse(t);
		$presets.val(customOptions.preset);
		updateOptions();
		updateOutput();
	});
}

function onPresetChange()
{
	customOptions.preset = this.value;
	updateOptions();
	updateOutput();
}

function onPluginChange(ev)
{
	var target = ev.target;
	var name = target.value;
	var plugin = esformatterPlugins.reduce(function(v, p) { return v || (p.displayName == name && p); }, null)
	esformatter[(target.checked ? "" : "un") + "register"](plugin.exports);
	updateOutput();
}

/*
 * HELPERS
 */

function readFile(file, callback)
{
	if (!file)
		return;
	var reader = new FileReader();
	reader.onload = function() {
		if (reader.readyState != 2)
			return; // ! DONE
		callback(reader.result);
	};
	reader.readAsText(file);
}

function escapeBackslash(s)
{
	return s.replace(/\n/g, "\\n").replace(/\r/g, "\\r")
			.replace(/\'/g, "\\'").replace(/\"/g, '\\"')
			.replace(/\t/g, "\\t");
}

function unescapeBackslash(s)
{
	return s.replace(/\\n/g, "\n").replace(/\\r/g, "\r")
			.replace(/\\'/g, "\'").replace(/\\"/g, '\"')
			.replace(/\\t/g, "\t");
}

init();

}(window, document));