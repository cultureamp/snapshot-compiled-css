import postcss, { AtRule, ChildNode, Declaration, Rule } from "postcss";
import { transformDecl } from "./functionTransformer";
import transformCalc from "postcss-calc/dist/lib/transform";

const replaceVarWithFallback = (_name: string, ...params: string[]) => {
  const [_identifier, ...fallback] = params;
  if (fallback) {
    return fallback.join(", ");
  } else {
    return `var(${params.join(", ")})`;
  }
};
const transformNode = (node: AtRule | Declaration | Rule) => {
  let newNode = node;
  if (node.type === "decl") {
    try {
      newNode = node.clone({
        value: transformDecl(node.value, {
          var: replaceVarWithFallback,
        }),
      });
    } catch (e) {
      console.error(`Couldn't transform functions in: \`${node.toString()}\``);
      console.error(e.toString());
    }

    try {
      transformCalc(newNode, "value", { precision: 5 });
    } catch (e) {
      console.error(`Couldn't evaluate calc in: \`${node.toString()}\``);
      console.error(e.toString());
    }
  }

  return newNode;
};

type NodesWeCareAbout = Rule | AtRule | Declaration;
const getKeyOfSingleNode = (node: NodesWeCareAbout) =>
  node.type === "rule"
    ? node.selector
    : node.type === "decl"
    ? node.prop
    : `@${node.name} ${node.params}`;
const getKeyOfNodes = (nodes: ChildNode[]): string =>
  nodes
    .map((child) => {
      if (child.type === "decl") {
        return getKeyOfSingleNode(child);
      } else if (child.type === "rule" || child.type === "atrule") {
        return `${getKeyOfSingleNode(child)}${getKeyOfNodes(
          child.nodes || []
        )}}`;
      }
      return "";
    })
    .join("");

const getKey = (node: NodesWeCareAbout) =>
  node.type === "decl"
    ? getKeyOfSingleNode(node)
    : `${getKeyOfSingleNode(node)}${getKeyOfNodes(node.nodes || [])}`;

const deepSortAndFilter = (childNodes: ChildNode[]): NodesWeCareAbout[] => {
  return (
    childNodes
      // Select only the nodes we care about
      .filter(
        (node): node is Declaration | AtRule | Rule =>
          node.type === "decl" || node.type === "atrule" || node.type === "rule"
      )
      // Run the same sorting function on each set of children
      .map((node) => {
        if ("nodes" in node && node.nodes) {
          return node.clone({ nodes: deepSortAndFilter(node.nodes) });
        } else {
          return transformNode(node);
        }
      })
      // Map and sort by key
      .map((node) => ({ key: getKey(node), node }))
      .sort((a, z) => {
        return a.key.localeCompare(z.key);
      })
      // Cleanup - just return an array of nodes
      .map((node) => node.node)
  );
};

/**
 * This function will deeply sort, filter, and transform a CSS source string.
 * It will re-arrange rules, atrules, and declarations, so that they're in alphabetical order, according to the `getKey` function above.
 * It will discard anything other than rules, atrules, or decls (such as comments).
 * It will also transform declarations:
 *  - Compile CSS variables into values.
 *  - Compute calc() functions and inline result.
 *
 * You might be wondering: why do this and not use out of the box postcss plugins that could do the same thing?
 * The short answer is: for finer control and transparency over the process.
 * Upon testing this snapshot generator on large repositories, sometimes plugins like postcss-calc would fail without any warnings,
 * and end up removing chunks of CSS in the snapshot due to one invalid `calc()` usage.
 * In this, we wrap the `calc()` compilation in a try catch.
 *
 * The other reason is because we need very deterministic sorting of Rules, AtRules and Declarations, so that snapshots are much more diffable.
 * Out of the box plugins could not offer this level of sorting and determinism (even if you ordered the plugin pipeline correctly, the snapshot's CSS would still be out of order sometimes).
 *
 */
export const makeSnapshotOfCss = (cssSource: string): string => {
  const root = postcss.parse(cssSource);
  const newNodes = deepSortAndFilter(root.nodes);
  root.removeAll();
  root.append(newNodes);
  return root.toString().replace(/(\s)+/, "$1");
};
