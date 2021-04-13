import yargs, { options } from "yargs";
import { logHeader } from "./util";
import { sync as globSync } from "glob";
import { generatestyleSnapshotos } from "./generateStyleSnapshot";
import { resolve } from "path";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { printDiff } from "./printDiff";

const cliOptions = yargs
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
  }).argv;

const snapshotFile = resolve(process.cwd(), "snapshot.css");

export const runCli = async () => {
  const filePaths = globSync(cliOptions.files)
    .filter((name) => /\.(css|sass|scss|less)/.test(name))
    .map((path) => `./${path}`);
  if (!filePaths.length) {
    throw new Error(`No stylesheets files found matching ${cliOptions.files}`);
  }

  logHeader(`Creating a snapshot of ${filePaths.length} files:`);
  console.log(...filePaths.map((path) => `\n    ${path}`));

  const css = await generatestyleSnapshotos(filePaths);

  logHeader("CSS output");
  console.log(css);

  const previousSnapshotCss = existsSync(snapshotFile)
    ? readFileSync(snapshotFile).toString()
    : "";
  const matchesSnapshot = previousSnapshotCss === css;

  logHeader(`Matches existing snapshot: ${matchesSnapshot}`);
  if (!matchesSnapshot) {
    await printDiff(snapshotFile, css);
  }

  if (cliOptions.update && !matchesSnapshot) {
    writeFileSync(snapshotFile, css);
    logHeader("Snapshot updated");
  }

  process.exit(matchesSnapshot ? 0 : 1);
};
