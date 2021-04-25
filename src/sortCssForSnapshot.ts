import flatten from "lodash/flatten";
import postcss, { AtRule, Rule } from "postcss";

export const sortCssForSnapshot = (source: string): string => {
  const root = postcss.parse(source);

  const rules = new Map<string, Rule[]>();
  const atRules = new Map<string, AtRule[]>();
  root.walkRules((rule) => {
    const key = rule.selector;
    rules.set(key, (rules.get(key) || []).concat(rule));
    rule.remove();
  });
  root.walkAtRules((rule) => {
    const key = `@${rule.name} ${rule.params}`;
    atRules.set(key, (atRules.get(key) || []).concat(rule));
    rule.remove();
  });
  const sortedRules = flatten(
    Array.from(rules.keys())
      .sort((a, z) => a.localeCompare(z))
      .map((key) => rules.get(key) || [])
  );
  const sortedAtRules = flatten(
    Array.from(rules.keys())
      .sort((a, z) => a.localeCompare(z))
      .map((key) => atRules.get(key) || [])
  );
  root.append([...sortedAtRules, ...sortedRules]);
  return root.toString();
};
