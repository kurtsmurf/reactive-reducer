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
  dependencies: Id[];
};

export type Node =
  | Value
  | Expression;

export type Graph = Node[];

type Set = {
  type: "set";
  id: Id;
  value: number;
};

type Evaluate = {
  type: "evaluate";
  id: Id;
};

type Add = {
  type: "add";
  node: Node;
};

export type Event =
  | Add
  | Set
  | Evaluate;
