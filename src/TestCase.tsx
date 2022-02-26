// @ts-ignore
import deepequal from "https://cdn.skypack.dev/deepequal";
import { Graph, Event } from "./Id";
import { reducer } from "./get";

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
      parts: ["a"],
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
      parts: ["a"],
      dependents: [],
    },
  ],
};
const testCases: TestCase[] = [
  updatingValueNodeUpdatesItsValue,
  updatingValueNodeUpdatesDependent,
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
