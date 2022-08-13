// @ts-ignore
import deepequal from "https://cdn.skypack.dev/deepequal";
import { Event, Graph } from "./types";
import { reducer } from "./logic";

type TestCase = {
  title: string;
  given: Graph;
  when: Event;
  expect: Graph;
};

const testCases: TestCase[] = [{
  title: "Updating a value node updates its value",
  given: [
    {
      id: "a",
      type: "value",
      value: 0,
      dependents: [],
    },
  ],
  when: {
    type: "set",
    id: "a",
    value: 1,
  },
  expect: [
    {
      id: "a",
      type: "value",
      value: 1,
      dependents: [],
    },
  ],
}, {
  title: "Updating a value node updates its dependents",
  given: [
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
  when: {
    type: "set",
    id: "a",
    value: 1,
  },
  expect: [
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
}, {
  title: "Add node event produces graph with node",
  given: [],
  when: {
    type: "add",
    node: {
      type: "value",
      dependents: [],
      id: "A1",
      value: 0,
    },
  },
  expect: [
    {
      type: "value",
      dependents: [],
      id: "A1",
      value: 0,
    },
  ],
}, {
  title: "Can't add a duplicate node",
  given: [
    {
      type: "value",
      dependents: [],
      id: "A1",
      value: 0,
    },
  ],
  when: {
    type: "add",
    node: {
      type: "value",
      dependents: [],
      id: "A1",
      value: 1,
    },
  },
  expect: [
    {
      type: "value",
      dependents: [],
      id: "A1",
      value: 0,
    },
  ],
}];

const reducerTest = ({ title, given, when, expect }: TestCase) => {
  const actual = reducer(given, when);
  const passed = deepequal(actual, expect);

  if (passed) {
    console.log(`✅ ${title}`)
  } else {
    console.log(`❌ ${title} 
expect: ${JSON.stringify(expect)}
actual: ${JSON.stringify(actual)}`)
  }
};

export const runTests = () => testCases.forEach(reducerTest);
