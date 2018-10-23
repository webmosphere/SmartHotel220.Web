const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CheckerPlugin = require('awesome-typescript-loader').CheckerPlugin;
const merge = require('webpack-merge');
const SassLintPlugin = require('sasslint-webpack-plugin');

module.exports = (env) => {
    // ���� ���� � ����������
    const isDevBuild = !(env && env.prod);

    // ������������, ��� ��� ����������, ��� � ��� ��������� �������
    const sharedConfig = () => ({
        stats: { modules: false },
        resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
        output: {
            filename: '[name].js',
            publicPath: 'dist/' // Webpack dev middleware, ���� ��������, ������������ ������� ��� ����� URL ��������
        },
        module: {
            rules: [
                { test: /\.tsx?$/, enforce: 'pre', loader: 'tslint-loader', options: { configFile: '.ts-lint.json' } },
                { test: /\.tsx?$/, include: /ClientApp/, use: 'awesome-typescript-loader?silent=true' },
                { test: /\.(png|jpg|jpeg|gif|svg)$/, use: 'url-loader?limit=25000' }
            ]
        },
        plugins: [new CheckerPlugin()]
    });

    // ������������ ��� ����������� ������, ����������� ��� ������ � ���������
    const clientBundleOutputDir = './wwwroot/dist';
    const clientBundleConfig = merge(sharedConfig(), {
        entry: { 'main-client': './ClientApp/boot-client.tsx' }, // �������� ����
        module: {
            rules: [
                { test: /\.scss$/, use: ExtractTextPlugin.extract({ use: isDevBuild ? ['css-loader', 'postcss-loader', 'sass-loader'] : ['css-loader?minimize', 'postcss-loader', 'sass-loader'] }) }
            ]
        },
        output: { path: path.join(__dirname, clientBundleOutputDir) },
        plugins: [
            new ExtractTextPlugin('site.css'),
            new webpack.DllReferencePlugin({
                context: __dirname,
                manifest: require('./wwwroot/dist/vendor-manifest.json')
            }),
            new webpack.DefinePlugin({
                'process.env': {
                    IS_BROWSER: true
                }
            })
        ].concat(isDevBuild ? [
            // �������, ������� ����������� ������ ��� ����������
            new webpack.SourceMapDevToolPlugin({
                filename: '[file].map', // ������� ��� ������, ���� �� ������������� ���������� �������� �����
                moduleFilenameTemplate: path.relative(clientBundleOutputDir, '[resourcePath]') // ���������� ������ sourcemap � �������� ������������ ������ �� �����
            })
        ] : [
                // �������, ������� ����������� ������ � ������� ������
                //new webpack.optimize.UglifyJsPlugin()
            ])
    });

    // ������������ ��� ��������� ����� (������������) ����� ���������� ��� ������ � Node
    const serverBundleConfig = merge(sharedConfig(), {
        resolve: { mainFields: ['main'] },
        entry: { 'main-server': './ClientApp/boot-server.tsx' },
        plugins: [
            new webpack.DllReferencePlugin({
                context: __dirname,
                manifest: require('./ClientApp/dist/vendor-manifest.json'),
                sourceType: 'commonjs2',
                name: './vendor'
            }),
            new SassLintPlugin({
                configFile: '.sass-lint.yml',
                glob: 'ClientApp/**/*.s?(a|c)ss',
                failOnError: false
            }),
            new webpack.ProvidePlugin({ window: 'global' })
        ],
        output: {
            libraryTarget: 'commonjs',
            path: path.join(__dirname, './ClientApp/dist')
        },
        target: 'node',
        devtool: 'inline-source-map'
    });

    return [clientBundleConfig, serverBundleConfig];
}