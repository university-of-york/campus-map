const path = require("path");

const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// require further investigation:
// - https://github.com/jantimon/resource-hints-webpack-plugin
// - https://github.com/numical/style-ext-html-webpack-plugin

module.exports = {
    entry: {
        vendors: './src/vendors.js',
        map: './src/main.js'
    },
    plugins: [
         new CleanWebpackPlugin(['dist']),
         new HtmlWebpackPlugin({
             title: 'Production',
             inject: 'head',
             template: './src/index.html'
        }),
        new CopyWebpackPlugin([
            {
                from:'./src/img',to:'img'
            }
        ]),
    ],
    output: {
        filename: '[name].bundle.min.js',
        path: path.resolve(__dirname, "dist")
    },
    resolve: {
        alias: {
            img: path.resolve(__dirname, './src/img/')
        }
    },
    module: {
        rules: [
            {
                test: /\.(gif|png|jp(e*)g|svg)$/,
                use: [
                    'file-loader',
                    {
                        loader: 'image-webpack-loader',
                        options: {
                            //disable: true, // webpack@2.x and newer
                        },
                }]
            },
        ]
    }
};