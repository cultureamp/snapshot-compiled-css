#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "fs";
import { sync as globSync } from "glob";
import { resolve } from "path";
import yargs from "yargs";
import { generatestyleSnapshotos } from "./generateStyleSnapshot";
import { printDiff } from "./printDiff";
import { importExtraWebpackConfig, logHeader } from "./util";

const cliConfig = yargs
  .option("files", {
    demandOption: true,
    description:
      "A glob of SASS files you want to use as the source of the snapshot.\nE.g. ./**/!(node_modules)/*.{scss,css,sass}' ",
    type: "string",
  })
  .option("update", {
    description:
      "Update the current snapshot on disk rather than compare against it",
    type: "boolean",
    default: false,
  })
  .option("snapshotFile", {
    description:
      "The location of a css file that should be used for comparison and commitment of newer snapshots",
    type: "string",
    default: resolve(process.cwd(), "snapshot.css"),
    coerce: (file) => resolve(file),
  })
  .option("webpackConfig", {
    description:
      "The location of a module (JS or JSON) that exports a webpack configuration that the snapshot generator should merge with it's base configuration. Uses webpack-merge as the merge method.",
    type: "string",
  })
  .option("sassResources", {
    description:
      "Locations to SASS files that contain resources such as global mixins or variables.",
    type: "array",
  })
  .option("showDiff", {
    description: "Show a diff between the current snapshot and the previous",
    type: "boolean",
  });

export const runCli = async () => {
  const cliOptions = cliConfig.argv;
  const snapshotFile = cliOptions.snapshotFile;
  const extraWebpackConfig =
    cliOptions.webpackConfig &&
    importExtraWebpackConfig(cliOptions.webpackConfig);
  const filePaths = globSync(cliOptions.files)
    .filter((name) => /\.(css|sass|scss|less)/.test(name))
    .map((path) => `./${path}`);
  if (!filePaths.length) {
    throw new Error(`No stylesheets files found matching ${cliOptions.files}`);
  }

  logHeader(`Creating a snapshot of ${filePaths.length} files:`);
  console.log(...filePaths.map((path) => `\n    ${path}`));

  const css = await generatestyleSnapshotos({
    filePaths,
    extraWebpackConfig: extraWebpackConfig,
    sassResources:
      cliOptions.sassResources?.map((resource) =>
        resolve(process.cwd(), resource.toString())
      ) || [],
  });

  logHeader("CSS output");
  console.log(css);

  const previousSnapshotExists = existsSync(snapshotFile);
  const previousSnapshotCss = previousSnapshotExists
    ? readFileSync(snapshotFile).toString()
    : "";
  const matchesSnapshot = previousSnapshotCss === css;

  logHeader(`Matches existing snapshot: ${matchesSnapshot}`);
  if (!matchesSnapshot && cliOptions.showDiff) {
    if (previousSnapshotExists) {
      await printDiff(snapshotFile, css);
    } else {
      console.log(`No existing snapshot found at ${snapshotFile}`);
    }
  }

  if (cliOptions.update && !matchesSnapshot) {
    writeFileSync(snapshotFile, css);
    logHeader("Snapshot updated");
  }

  process.exit(matchesSnapshot ? 0 : 1);
};

runCli();
