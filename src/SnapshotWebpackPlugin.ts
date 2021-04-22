import webpack from "webpack";
import { RawSource } from "webpack-sources";
import postcss from "postcss";

export class SnapshotWebpackPlugin {
  snapshotContent = "";

  apply(compiler: webpack.Compiler) {
    const pluginName = SnapshotWebpackPlugin.name;

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.finishModules.tap(pluginName, (modules) => {
        const postcssInstance = postcss([
          require("postcss-css-variables"),
          require("postcss-minify-font-values")({
            removeQuotes: true,
            removeDuplicates: false,
          }),
          require("postcss-merge-rules"),
        ]);

        const miniExtractCssModules = modules.filter(
          (_module) => _module.type === "css/mini-extract"
        );
        miniExtractCssModules.forEach((module: any) => {
          this.snapshotContent += postcssInstance
            .process(module.content)
            .toString();
        });

        compilation.assets["snapshot.css"] = new RawSource(
          this.snapshotContent
        );
      });
    });
  }
}
