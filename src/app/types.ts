export type Graph = Node[];

export type Node =
  | Value
  | Expression;

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

export type Event =
  | Add
  | Set
  | Evaluate;

type Add = {
  type: "add";
  node: Node;
};

type Set = {
  type: "set";
  id: Id;
  value: number;
};

type Evaluate = {
  type: "evaluate";
  id: Id;
};

export type Id = string;
