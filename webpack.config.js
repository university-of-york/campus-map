const path = require("path");

module.exports = {
    entry: {
        vendors: './src/vendors.js',
        map: './src/main.js'
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: '[name].bundle.min.js'
    },
    devServer: {
        contentBase: "./src",
        //publicPath: '/dist/',
        index: "index.html",
        compress: true,
        port: 8080,
        open: true,
        //hot: true,
        watchOptions: {
            poll: true
        },
        watchContentBase: true
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                loaders: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    }
};