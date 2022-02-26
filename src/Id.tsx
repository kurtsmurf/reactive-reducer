export type Id = string;
export type Value = {
  type: "value";
  id: Id;
  value: number;
  dependents: Id[];
};
export type Expression = {
  type: "expression";
  id: Id;
  value: number;
  dependents: Id[];
  parts: Id[];
};
export type Node = Value |
  Expression;
export type Graph = Node[];
export type Event = {
  type: "set";
  id: Id;
  value: number;
} |
{
  type: "evaluate";
  id: Id;
};
