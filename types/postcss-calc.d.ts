declare module "postcss-calc/dist/lib/transform" {
  import { Node, Postcss, Result } from "postcss";

  const transform: (
    node: Node,
    property: "selector" | "value",
    options: { preserve?: boolean; precision: number }
  ) => void;
  export default transform;
}
