const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './main.ts',
  target: 'node',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
  },
  externals: {
    "obsidian": "commonjs2 obsidian",
    "@codemirror/language": "commonjs2 @codemirror/language",
    "@codemirror/state": "commonjs2 @codemirror/state",
    "@codemirror/view": "commonjs2 @codemirror/view",
    "@lezer/common": "commonjs2 @lezer/common",
    // Add other external dependencies if needed
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
  ],
};