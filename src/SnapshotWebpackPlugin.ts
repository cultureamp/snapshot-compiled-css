import webpack from "webpack";
import { RawSource } from "webpack-sources";
import postcss from "postcss";
import path from "path";
import { format } from "prettier";
import { sortAndFilterCssForSnapshot } from "./sortCssForSnapshot";
import { snapshotPostcssPlugins } from "./snapshotPostcssPlugins";
/**
 * This is a webpack plugin that you can add to an existing config to generate a`snapshot.css`.
 * It requires that you've already setup a MiniCssExtractPlugin, because this plugin will only use the outputs of that to make a snapshot.
 */
export class SnapshotWebpackPlugin {
  snapshotContent = "";

  apply(compiler: webpack.Compiler) {
    const pluginName = SnapshotWebpackPlugin.name;

    compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
      compilation.hooks.finishModules.tap(pluginName, (modules) => {
        const postcssInstance = postcss(snapshotPostcssPlugins);

        const miniExtractCssModules = modules.filter(
          (_module) => _module.type === "css/mini-extract"
        );
        miniExtractCssModules.forEach((module: any) => {
          this.snapshotContent += postcssInstance
            .process(module.content)
            .toString();
        });

        // We want the snapshot to come out at CWD, and webpack needs a relative path from it's outputPath
        const snapshotPath = path.relative(
          compilation.outputOptions.path,
          "snapshot.css"
        );
        compilation.assets[snapshotPath] = new RawSource(
          format(sortAndFilterCssForSnapshot(this.snapshotContent), {
            parser: "css",
          })
        );
      });
    });
  }
}
