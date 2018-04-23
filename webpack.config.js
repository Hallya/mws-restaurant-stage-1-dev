const ServiceWorkerWebpackPlugin = require('serviceworker-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

process.traceDeprecation = true
module.exports = {
  entry: {
    main: './dev/js/main.js',
    restaurant: './dev/js/restaurant_info.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new ServiceWorkerWebpackPlugin({
      entry: path.join(__dirname, 'dev/sw.js')
    }),
    new HtmlWebpackPlugin({
      template: 'dev/index.html'
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  },
}