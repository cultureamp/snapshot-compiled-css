import { resolve } from "path";
import { existsSync } from "fs";
export const logHeader = (text: string) => {
  console.log("-".repeat(text.length));
  console.log(text);
  console.log("-".repeat(text.length));
};
export const importExtraWebpackConfig = (extraWebpackConfigPath: string) =>
  (existsSync(resolve(extraWebpackConfigPath)) &&
    require(resolve(extraWebpackConfigPath))) ||
  undefined;
