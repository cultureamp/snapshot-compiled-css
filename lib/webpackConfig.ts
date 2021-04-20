import MiniCssExtractPlugin from "mini-css-extract-plugin";
import OptimizeCSSAssetsPlugin from "optimize-css-assets-webpack-plugin";
import webpack from "webpack";
import { merge } from "webpack-merge";

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
      plugins: [
        require("postcss-css-variables"),
        require("postcss-minify-font-values")({
          removeQuotes: true,
          removeDuplicates: false,
        }),
        require("postcss-discard-comments")({ removeAll: true }),
        require("postcss-merge-rules"),
      ],
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

const sassResourcesLoader = (resources: string[]) => ({
  loader: "sass-resources-loader",
  options: {
    resources,
  },
});

export const rules = (sassResources: string[]) => [
  {
    test: /\.(css)$/,
    use: [styleLoader, extractLoader, cssLoader(1), postCssLoader],
  },
  {
    test: /\.(scss|sass)$/,
    use: [
      styleLoader,
      extractLoader,
      cssLoader(2),
      postCssLoader,
      sassLoader,
      sassResourcesLoader(sassResources),
    ],
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
  extraConfig,
  sassResources,
}: {
  inputStylesheets: string[];
  tmpCssFilename: string;
  tmpJsFilename: string;
  outputDir: string;
  extraConfig?: webpack.Configuration;
  sassResources: string[];
}): webpack.Configuration => {
  const mergedConfig = merge(extraConfig || {}, {
    entry: inputStylesheets,
    mode: "development",
    module: { rules: rules(sassResources) },
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

  return mergedConfig;
};
