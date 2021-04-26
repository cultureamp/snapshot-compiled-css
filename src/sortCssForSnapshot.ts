import flatten from "lodash/flatten";
import postcss, { AtRule, ChildNode, Rule } from "postcss";

const getKey = (node: Rule | AtRule) =>
  node.type === "rule" ? node.selector : `@${node.name} ${node.params}`;
const sortAndFilterNodes = (nodes: ChildNode[]) => {
  const rules = new Map<string, Rule[]>();
  const atRules = new Map<string, AtRule[]>();

  nodes.forEach((node) => {
    if (node.type === "rule") {
      const key = getKey(node);
      rules.set(key, (rules.get(key) || []).concat(node));
    }
    if (node.type === "atrule") {
      const childrenKey = node.nodes?.length
        ? sortAndFilterNodes(node.nodes).map(getKey).join("")
        : "";
      const key = `${getKey(node)}${childrenKey}`;
      atRules.set(key, (atRules.get(key) || []).concat(node));
    }
  });

  const sortedRules = flatten(
    Array.from(rules.keys())
      .sort((a, z) => a.localeCompare(z))
      .map((key) => rules.get(key) || [])
  );
  const sortedAtRules = flatten(
    Array.from(atRules.keys())
      .sort((a, z) => a.localeCompare(z))
      .map((key) => atRules.get(key) || [])
  );

  return [...sortedAtRules, ...sortedRules];
};
export const sortCssForSnapshot = (source: string): string => {
  const root = postcss.parse(source);
  const newNodes = sortAndFilterNodes(root.nodes);
  root.removeAll();
  root.append(newNodes);
  return root.toString();
};
