'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var MagicString = _interopDefault(require('magic-string'));
var rollupPluginutils = require('rollup-pluginutils');

var moduleIdRegex = /moduleId\s*:(.*)/g;
var componentRegex = /Component\(\s?{([\s\S]*)}\s?\)(,)?$/gm;
var templateUrlRegex = /templateUrl\s*:(.*)/g;
var styleUrlsRegex = /styleUrls\s*:(\s*\[[\s\S]*?\])/g;
var stringRegex = /(['"])((?:[^\\]\\\1|.)*?)\1/g;

function insertText(str, dir, preprocessor, processFilename) {
  if ( preprocessor === void 0 ) preprocessor = function (res) { return res; };
  if ( processFilename === void 0 ) processFilename = false;

  return str.replace(stringRegex, function (match, quote, url) {
    var includePath = path.join(dir, url);
    if (processFilename) {
      return '\'' + preprocessor(includePath) + '\'';
    }
    var text = fs.readFileSync(includePath).toString();
    return '\'' + preprocessor(text, includePath) + '\'';
  });
}

function angular(options) {
  if ( options === void 0 ) options = {};

  options.preprocessors = options.preprocessors || {};

  // ignore @angular/** modules
  options.exclude = options.exclude || [];
  if (typeof options.exclude === 'string' || options.exclude instanceof String) { options.exclude = [options.exclude]; }
  if (options.exclude.indexOf('node_modules/@angular/**') === -1) { options.exclude.push('node_modules/@angular/**'); }

  var filter = rollupPluginutils.createFilter(options.include, options.exclude);

  return {
    name: 'angular',
    transform: function transform(source, map) {
      if (!filter(map)) { return; }

      var magicString = new MagicString(source);
      var dir = path.parse(map).dir;

      var hasReplacements = false;
      var match;
      var start, end, replacement;

      while ((match = componentRegex.exec(source)) !== null) {
        console.log('source', source);

        start = match.index;
        end = start + match[0].length;

        replacement = match[0]
          .replace(templateUrlRegex, function (match, url) {
            hasReplacements = true;
            return 'template:' + insertText(url, dir, options.preprocessors.template, options.processFilename);
          })
          .replace(styleUrlsRegex, function (match, urls) {
            console.log('style match', match);
            console.log('style urls', match);
            hasReplacements = true;
            return 'styles:' + insertText(urls, dir, options.preprocessors.style, options.processFilename);
          })
          .replace(moduleIdRegex, function (match, moduleId) {
            hasReplacements = true;
            return '';
          });

        if (hasReplacements) { magicString.overwrite(start, end, replacement); }
      }

      if (!hasReplacements) { return null; }

      var result = { code: magicString.toString() };
      if (options.sourceMap !== false) { result.map = magicString.generateMap({ hires: true }); }

      return result;
    }
  };
}

module.exports = angular;
