import fs from "fs";
import webpack from "webpack";
import prettier from "prettier";
import { logHeader } from "./util";
import { dir } from "tmp-promise";
import { resolve } from "path";
import { webpackConfig } from "./webpackConfig";

const tmpCssFilename = "snapshot-tmp.css";
const tmpJsFilename = "snapshot-tmp.js";

/**
 * @param filePaths The stylesheets to include in the snapshot compilation
 * @returns The generated and prettified CSS source code
 */
export const generatestyleSnapshotos = async ({
  filePaths,
  extraWebpackConfig: extraConfig,
  sassResources,
}: {
  filePaths: string[];
  extraWebpackConfig?: webpack.Configuration;
  sassResources: string[];
}) => {
  const dirResult = await dir({ unsafeCleanup: true });
  const outputDir = dirResult.path;
  await compileWebpack({
    outputDir: dirResult.path,
    inputStylesheets: filePaths,
    extraConfig,
    sassResources,
  });
  const path = resolve(outputDir, tmpCssFilename);
  const css = fs.readFileSync(path).toString();
  await dirResult.cleanup();
  const prettyCss = runPrettierOnCss(css);
  return prettyCss;
};

/**
 * @returns The return promise resolves void on a successful compilation, or rejects with an error message on failure.
 */
export const compileWebpack = ({
  outputDir,
  inputStylesheets,
  extraConfig,
  sassResources,
}: {
  outputDir: string;
  inputStylesheets: string[];
  extraConfig?: webpack.Configuration;
  sassResources: string[];
}): Promise<void> => {
  return new Promise((resolvePromise, rejectPromise) => {
    webpack(
      webpackConfig({
        tmpCssFilename,
        tmpJsFilename,
        inputStylesheets,
        outputDir,
        extraConfig,
        sassResources,
      })
    ).run((err, stats) => {
      if (!err && !stats.hasErrors()) {
        logHeader("Successful webpack build:");
        console.log(stats.toString());
        resolvePromise();
      } else if (err) {
        logHeader("Failed to run webpack, see error:");
        console.error(err.message);
        rejectPromise(new Error("Failed to run webpack"));
      } else if (stats.hasErrors()) {
        logHeader("Failed to compile stylesheets, see error:");
        console.error(...stats.toJson().errors);
        rejectPromise(new Error("Failed to compile stylesheets"));
      }
    });
  });
};

const runPrettierOnCss = (css: string) => {
  logHeader("Formatting the CSS with prettier");
  const prettyCss = prettier.format(css, {
    parser: "css",
  });
  console.log("done");
  return prettyCss;
};
