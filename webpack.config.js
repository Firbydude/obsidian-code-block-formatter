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
  // Output a single bundle file.
  optimization: {
    splitChunks: false,
  },
  output: {
    path: path.resolve(__dirname, 'dist'), // The output directory as an absolute path.
    filename: 'main.js', // The name of each output bundle. '[name]' is replaced by the name of the chunk.
    publicPath: '/', // The public URL of the output directory when referenced in a browser.
    library: 'ObsidianCodeBlockFormatter', // The name of the exported library.
    libraryTarget: 'umd', // The type of the exported library (var, this, commonjs, amd, umd, etc.).
    // chunkFilename: '[id].bundle.js', // The filename of non-entry chunks as a relative path inside the output.path directory.
    // assetModuleFilename: 'assets/[hash][ext][query]', // The filename of asset modules as a relative path inside the output.path directory.
    clean: true, // Clean the output directory before emit.
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
    new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
    }),
  ],
};