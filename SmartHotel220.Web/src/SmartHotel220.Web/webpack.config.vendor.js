const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const merge = require('webpack-merge');

module.exports = (env) => {
    const isDevBuild = !(env && env.prod);
    const extractCss = new ExtractTextPlugin('vendor.css');

    const sharedConfig = {
        stats: { modules: false },
        resolve: { extensions: ['.js'] },
        module: {
            rules: [
                { test: /\.(png|woff|woff2|eot|ttf|svg)(\?|$)/, use: 'url-loader?limit=100000' }
            ]
        },
        entry: {
            vendor: [
                'bootstrap',
                'normalize.css',
                'bootstrap/dist/css/bootstrap.css',
                'domain-task',
                'event-source-polyfill',
                'history',
                'moment',
                'rc-slider',
                'rc-slider/assets/index.css',
                'react',
                'react-dom',
                'react-datepicker',
                'react-datepicker/dist/react-datepicker.css',
                'react-router-dom',
                'react-redux',
                'react-swipeable',
                'redux',
                'redux-thunk',
                'react-router-redux',
                'jquery'
            ]
        },
        output: {
            publicPath: 'dist/',
            filename: '[name].js',
            library: '[name]_[hash]',
        },
        plugins: [
            new webpack.ProvidePlugin({ $: 'jquery', jQuery: 'jquery' }), // ������������ ��� �������������� � ������� jQuery (��������� Bootstrap �������, ��� �� ����� ���������� ����������)
            new webpack.NormalModuleReplacementPlugin(/\/iconv-loader$/, require.resolve('node-noop')), // �������� ���� ��� https://github.com/andris9/encoding/issues/16
            new webpack.DefinePlugin({
                'process.env.NODE_ENV': isDevBuild ? '"development"' : '"production"'
            })
        ],
        externals: {
            Msal: 'Msal'
        }
    };

    const clientBundleConfig = merge(sharedConfig, {
        output: { path: path.join(__dirname, 'wwwroot', 'dist') },
        module: {
            rules: [
                { test: /\.css(\?|$)/, use: extractCss.extract({ use: isDevBuild ? 'css-loader' : 'css-loader?minimize' }) }
            ]
        },
        plugins: [
            extractCss,
            new webpack.DllPlugin({
                path: path.join(__dirname, 'wwwroot', 'dist', '[name]-manifest.json'),
                name: '[name]_[hash]'
            })
        ].concat(isDevBuild ? [] : [
            //new webpack.optimize.UglifyJsPlugin()
        ])
    });

    const serverBundleConfig = merge(sharedConfig, {
        target: 'node',
        resolve: { mainFields: ['main'] },
        output: {
            path: path.join(__dirname, 'ClientApp', 'dist'),
            libraryTarget: 'commonjs2'
        },
        module: {
            rules: [{ test: /\.css(\?|$)/, use: isDevBuild ? 'css-loader' : 'css-loader?minimize' }]
        },
        entry: { vendor: ['aspnet-prerendering', 'react-dom/server'] },
        plugins: [
            new webpack.DllPlugin({
                path: path.join(__dirname, 'ClientApp', 'dist', '[name]-manifest.json'),
                name: '[name]_[hash]'
            }),
            new webpack.ProvidePlugin({ window: 'global', XMLHttpRequest: 'node-fetch' })
        ]
    });

    return [clientBundleConfig, serverBundleConfig];
}