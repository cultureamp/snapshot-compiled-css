import flatten from "lodash/flatten";
import postcss, { AtRule, ChildNode, Declaration, Rule } from "postcss";

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
          return node;
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

export const sortCssForSnapshot = (source: string): string => {
  const root = postcss.parse(source);
  const newNodes = deepSortAndFilter(root.nodes);
  root.removeAll();
  root.append(newNodes);
  return root.toString();
};
