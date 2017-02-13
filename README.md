[![Build Status](https://travis-ci.org/cebor/rollup-plugin-angular.svg?branch=master)](https://travis-ci.org/cebor/rollup-plugin-angular)

# Prequisite
You need to copy all the templates & sass files manually to the aot outdir (set in the tsconfig.json) before bundling.
```javascript
copyfiles src/**/*.scss dist
copyfiles src/**/*.html dist
```

# rollup-plugin-angular-aot
Angular2 template and styles inliner for rollup

## Installation
```bash
npm install --save-dev rollup-plugin-angular-aot
```

## Example
```javascript
// rollup.config.js
import angular from 'rollup-plugin-angular-aot';
import typescript from 'rollup-plugin-typescript';
import alias from 'rollup-plugin-alias';
import nodeResolve from 'rollup-plugin-node-resolve';

export default {
  entry: 'src/main.ts',
  format: 'iife',
  dest: 'dist/bundle.js',
  plugins: [
    angular(),
    typescript(),
    alias({ rxjs: __dirname + '/node_modules/rxjs-es' }), // rxjs fix (npm install rxjs-es)
    nodeResolve({ jsnext: true, main: true })
  ]
}
```

## Template & Style preprocessing
You may need to do some preprocessing on your templates & styles such as minification and/or transpilation.

To do this you can pass a preprocessors object as an option, containing a style and/or template preprocessor.

### Signature
```typescript
preprocessors: {
  template: (source: string, path: string) => string,
  style: (source: string, path: string) => string,
}
```
`source` - The contents of the style or template's file.

`path` - The path to the loaded file. Can be useful for checking file extensions for example.

returns the manipulated source as a string.

### Example
The following example shows how you can use sass, clean-css (for css minification), and htmlmin.

```javascript
// rollup.config.js
import angular from 'rollup-plugin-angular-aot';
import typescript from 'rollup-plugin-typescript';
import nodeResolve from 'rollup-plugin-node-resolve';
import sass from 'node-sass';
import CleanCSS from 'clean-css';
import { minify as minifyHtml } from 'html-minifier';

const cssmin = new CleanCSS();
const htmlminOpts = {
    caseSensitive: true,
    collapseWhitespace: true,
    removeComments: true,
};

export default {
  entry: 'src/main.ts',
  format: 'iife',
  dest: 'dist/bundle.js',
  plugins: [
    angular({
      preprocessors: {
        template: template => minifyHtml(template, htmlminOpts),
        style: scss => {
            const css = sass.renderSync({ data: scss }).css;
            return cssmin.minify(css).styles;
        },
      }
    })
    typescript(),
    nodeResolve({ jsnext: true, main: true })
  ]
}
```
