// @ts-ignore
import deepequal from "https://cdn.skypack.dev/deepequal";
import { Event, Graph } from "./types";
import { reducer } from "./logic";

type TestCase = {
  description: string;
  graph: Graph;
  event: Event;
  expected: Graph;
};

const updatingValueNodeUpdatesItsValue: TestCase = {
  description: "Updating a value node updates its value",
  graph: [
    {
      id: "a",
      type: "value",
      value: 0,
      dependents: [],
    },
  ],
  event: {
    type: "set",
    id: "a",
    value: 1,
  },
  expected: [
    {
      id: "a",
      type: "value",
      value: 1,
      dependents: [],
    },
  ],
};

const updatingValueNodeUpdatesDependent: TestCase = {
  description: "Updating a value node updates its dependents",
  graph: [
    {
      id: "a",
      type: "value",
      value: 0,
      dependents: ["b"],
    },
    {
      id: "b",
      value: 0,
      type: "expression",
      dependencies: ["a"],
      dependents: [],
    },
  ],
  event: {
    type: "set",
    id: "a",
    value: 1,
  },
  expected: [
    {
      id: "a",
      type: "value",
      value: 1,
      dependents: ["b"],
    },
    {
      id: "b",
      value: 1,
      type: "expression",
      dependencies: ["a"],
      dependents: [],
    },
  ],
};

const addingNodeAddsNode: TestCase = {
  description: "Add node event produces graph with node",
  graph: [],
  event: {
    type: "add",
    node: {
      type: "value",
      dependents: [],
      id: "A1",
      value: 0,
    },
  },
  expected: [
    {
      type: "value",
      dependents: [],
      id: "A1",
      value: 0,
    },
  ],
};

const cantAddDuplicateNode: TestCase = {
  description: "Can't add a duplicate node",
  graph: [
    {
      type: "value",
      dependents: [],
      id: "A1",
      value: 0,
    },
  ],
  event: {
    type: "add",
    node: {
      type: "value",
      dependents: [],
      id: "A1",
      value: 1,
    },
  },
  expected: [
    {
      type: "value",
      dependents: [],
      id: "A1",
      value: 0,
    },
  ],
};

const testCases: TestCase[] = [
  updatingValueNodeUpdatesItsValue,
  updatingValueNodeUpdatesDependent,
  addingNodeAddsNode,
  cantAddDuplicateNode,
];

const reducerTest = ({ description, event, graph, expected }: TestCase) => {
  const actual = reducer(graph, event);
  const passed = deepequal(actual, expected);

  console.log(`
    ====
    TEST: ${passed ? "U PASS 💃💃💃💃💃💃" : "U FAIL 😠"}
    ====

    ${description}
    result: ${passed}

    expected: ${JSON.stringify(expected)}

    actual: ${JSON.stringify(actual)}
  `);
};

export const runTests = () => testCases.forEach(reducerTest);