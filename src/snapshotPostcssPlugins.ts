export const snapshotPostcssPlugins = [
  require("postcss-merge-rules"),
  require("postcss-minify-font-values")({
    removeQuotes: true,
    removeDuplicates: false,
  }),
  require("postcss-discard-comments")({ removeAll: true }),
  require("postcss-css-variables"),
];
