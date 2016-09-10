var path = require('path');

// Helper functions
var ROOT = path.resolve(__dirname, '..');

function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [ROOT].concat(args));
}

module.exports = {
  entry: './src/index.ts',
  target: 'node',
  resolve: {
    extensions: ['', '.ts', '.js', '.json'],

    // Make sure root is src
    root: '',

    // remove other default values
    modulesDirectories: ['node_modules']
  },
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, 'webpack'),
    filename: 'handler.js'
  },
  module: {
    loaders: [
      {
        test: /\.ts$/,
        loaders: [
          'awesome-typescript-loader'
        ],
        exclude: [/\.(spec|e2e)\.ts$/]
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
    ]
  }
};


// //var path = require('path');

// module.exports = {
//   entry: __dirname + '/src/index.ts',
//   target: 'node',
//   resolve: {
//     extensions: ['', '.ts', '.js', '.json'],

//     // Make sure root is src
//     root: __dirname + '/src',

//     // remove other default values
//     modulesDirectories: ['node_modules']
//   },
//   output: {
//     libraryTarget: 'commonjs',
//     path: __dirname + '/webpack',
//     filename: 'bundle.js'
//   },
//   module: {
//     // preLoaders: [
//     //   {
//     //     test: /\.ts$/,
//     //     loader: 'string-replace-loader',
//     //     query: {
//     //       search: '(System|SystemJS)(.*[\\n\\r]\\s*\\.|\\.)import\\((.+)\\)',
//     //       replace: '$1.import($3).then(mod => mod.__esModule ? mod.default : mod)',
//     //       flags: 'g'
//     //     },
//     //     include: [__dirname + '/src']
//     //   }
//     // ],
//     loaders: [
//       {
//         test: /\.ts$/,
//         loaders: [
//           'awesome-typescript-loader'
//         ],
//         exclude: [/\.(spec|e2e)\.ts$/]
//       },
//       {
//         test: /\.json$/,
//         loader: 'json-loader'
//       },
//     ]
//   }
// };
