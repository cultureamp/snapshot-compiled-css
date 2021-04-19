import { exec } from "child_process";
import { logHeader } from "./util";

export const printDiff = (
  snapshotFilePath: string,
  comparisonCss: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    logHeader("Diff of current CSS to saved snapshot:");
    // The `diff` command uses a hyphen to compare against stdin
    const child = exec(`diff --context=5 ${snapshotFilePath} -`);
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
    child.stdin?.write(comparisonCss);
    child.stdin?.end();

    child.on("exit", (code, signal) => {
      if (signal) {
        console.warn(`Diff failed, received signal ${signal}`);
        resolve();
      } else {
        resolve();
      }
    });
  });
};
