const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

// Load environment variables from .env file
const dotenvEnv = dotenv.config().parsed || {};

// Allow REACT_APP_* variables from the real process environment (e.g., Render dashboard)
const reactAppFromProcess = Object.keys(process.env)
  .filter((k) => k.startsWith('REACT_APP_'))
  .reduce((acc, k) => {
    acc[k] = process.env[k];
    return acc;
  }, {});

// Merge .env values with process.env, giving precedence to process.env
const mergedEnv = { ...dotenvEnv, ...reactAppFromProcess };

// Prepare environment variables for DefinePlugin
const envKeys = Object.keys(mergedEnv).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(mergedEnv[next]);
  return prev;
}, {});

module.exports = {
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js',
    publicPath: '/',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.web.js', '.web.ts', '.web.tsx'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-vector-icons': 'react-native-vector-icons/dist',
    },
    fallback: {
      crypto: false,
      stream: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            plugins: [],
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      favicon: './public/favicon.ico',
    }),
    new webpack.DefinePlugin({
      ...envKeys,
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'public'),
    },
  },
  mode: 'development',
};
