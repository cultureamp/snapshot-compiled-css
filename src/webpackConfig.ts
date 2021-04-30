import MiniCssExtractPlugin from "mini-css-extract-plugin";
import OptimizeCSSAssetsPlugin from "optimize-css-assets-webpack-plugin";
import webpack from "webpack";
import { snapshotPostcssPlugins } from "./snapshotPostcssPlugins";
const styleLoader = {
  loader: require.resolve("style-loader"),
};

const extractLoader = { loader: MiniCssExtractPlugin.loader };

const cssLoader = (importLoaderCount: number) => ({
  loader: require.resolve("css-loader"),
  options: {
    importLoaders: importLoaderCount,
    sourceMap: false,
    // In future we may want a CLI option to compile some paths as global (not using CSS modules)
    modules: {
      localIdentName: "[path][name]-[ext]__[local]--[hash:base64:5]",
    },
  },
});

const postCssLoader = {
  loader: require.resolve("postcss-loader"),
  options: {
    postcssOptions: {
      plugins: snapshotPostcssPlugins,
      config: false,
    },
  },
};

const sassLoader = {
  loader: require.resolve("sass-loader"),
  options: {
    sourceMap: false,
  },
};

const lessLoader = {
  loader: require.resolve("less-loader"),
  options: {
    sourceMap: false,
  },
};

const fileLoader = {
  loader: require.resolve("file-loader"),
};

export const rules = () => [
  {
    test: /\.(css)$/,
    use: [styleLoader, extractLoader, cssLoader(1), postCssLoader],
  },
  {
    test: /\.(scss|sass)$/,
    use: [styleLoader, extractLoader, cssLoader(2), postCssLoader, sassLoader],
  },
  {
    test: /\.less$/,
    use: [styleLoader, extractLoader, cssLoader(2), postCssLoader, lessLoader],
  },
  {
    test: /\.(jpg|jpeg|png|gif|svg|eot|woff|woff2|ttf|swf|ico)$/,
    use: [fileLoader],
  },
];

export const webpackConfig = ({
  inputStylesheets,
  tmpCssFilename,
  tmpJsFilename,
  outputDir,
}: {
  inputStylesheets: string[];
  tmpCssFilename: string;
  tmpJsFilename: string;
  outputDir: string;
}): webpack.Configuration => ({
  entry: inputStylesheets,
  mode: "development",
  module: { rules: rules() },
  devtool: false,
  plugins: [new MiniCssExtractPlugin({ filename: tmpCssFilename })],
  output: {
    path: outputDir,
    filename: tmpJsFilename,
  },
  optimization: {
    minimize: true,
    minimizer: [new OptimizeCSSAssetsPlugin()],
  },
});
