// import { useReducer } from "preact/hooks";
// @ts-ignore
import deepequal from "https://cdn.skypack.dev/deepequal";

// ********************************************************
// SECTION: TYPES
// ********************************************************

type Id = string;
type AddExpression = { parts: Id[] };
type Node =
  & { id: Id; value: number; dependents: Id[] }
  & (
    | { type: "value" }
    | { type: "addExpression"; addExpression: AddExpression }
  );
type Graph = Node[];
type Event = { node: Id; newValue: number };

// ********************************************************
// SECTION: LOGIC
// ********************************************************

const reducer = (graph: Graph, event: Event): Graph => {
  const target = graph.find((node) => node.id === event.node);

  if (!target) return graph;

  const consequentEvents: Event[] = target.dependents
    .map((dep) => ({
      type: "Update",
      node: dep,
      newValue: event.newValue || 0,
    }));

  switch (target.type) {
    case "value": {
      const updatedTarget = { ...target, value: event.newValue };
      const nextGraph = graph.map((node) =>
        node.id === event.node ? updatedTarget : node
      );
      return consequentEvents.reduce(reducer, nextGraph);
    }
    case "addExpression": {
      const sum = (left: number, right: number) => left + right;
      const isPart = (node: Node) =>
        target.addExpression.parts.includes(node.id);
      const nextValue = graph
        .filter(isPart)
        .map((node) => node.value)
        .reduce(sum, 0);
      const nextGraph = graph.map((node) =>
        node.id === event.node ? { ...node, value: nextValue } : node
      );
      return consequentEvents.reduce(reducer, nextGraph);
    }
  }
};

const initialState: Graph = [
  { id: "a", type: "value", value: 0, dependents: ["aPlusB"] },
  { id: "b", type: "value", value: 0, dependents: ["aPlusB"] },
  {
    id: "aPlusB",
    value: 0,
    type: "addExpression",
    addExpression: { parts: ["a", "b"] },
    dependents: [],
  },
];

// ********************************************************
// SECTION: TEST
// ********************************************************

const reducerTest = (
  message: string,
  given: { graph: Graph; event: Event },
  expected: Graph,
) => {
  const actual: Graph = reducer(given.graph, given.event);

  const stringify = (obj: object) => JSON.stringify(obj);
  const passed = deepequal(actual, expected);

  console.log(`
    ====
    TEST: ${passed ? "U PASS 💃💃💃💃💃💃" : "U FAIL 😠"}
    ====

    ${message}
    result: ${passed}

    expected: ${stringify(expected)}

    actual: ${stringify(actual)}

  `);
};

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
      "id": "a",
      "type": "value",
      "value": 0,
      "dependents": [],
    },
  ],
  event: {
    "node": "a",
    "newValue": 1,
  },
  expected: [
    {
      "id": "a",
      "type": "value",
      "value": 1,
      "dependents": [],
    },
  ],
};

const updatingValueNodeUpdatesDependent: TestCase = {
  description: "Updating a value node updates its dependents",
  graph: [
    {
      "id": "a",
      "type": "value",
      "value": 0,
      "dependents": [
        "aPlusB",
      ],
    },
    {
      "id": "b",
      "type": "value",
      "value": 1,
      "dependents": [
        "aPlusB",
      ],
    },
    {
      "id": "aPlusB",
      "value": 1,
      "type": "addExpression",
      "addExpression": {
        "parts": [
          "a",
          "b",
        ],
      },
      "dependents": [],
    },
  ],

  event: {
    "node": "a",
    "newValue": 1,
  },

  expected: [
    {
      "id": "a",
      "type": "value",
      "value": 1,
      "dependents": [
        "aPlusB",
      ],
    },
    {
      "id": "b",
      "type": "value",
      "value": 1,
      "dependents": [
        "aPlusB",
      ],
    },
    {
      "id": "aPlusB",
      "value": 2,
      "type": "addExpression",
      "addExpression": {
        "parts": [
          "a",
          "b",
        ],
      },
      "dependents": [],
    },
  ],
};

const testCases: TestCase[] = [
  updatingValueNodeUpdatesItsValue,
  updatingValueNodeUpdatesDependent,
];

for (const testCase of testCases) {
  const { description, event, graph, expected } = testCase;
  const given = { graph, event };
  reducerTest(description, given, expected);
}

// ********************************************************
// SECTION: UI
// ********************************************************

export function App() {
  // const [state, dispatch] = useReducer(reducer, initialState);

  // return (
  //   <>
  //     <label htmlFor="a">A</label>
  //     <input
  //       type="number"
  //       name="a"
  //       id="a"
  //       value={state["a"].value}
  //       onInput={(event) =>
  //         dispatch({
  //           node: "a",
  //           newValue: parseInt(event.currentTarget.value),
  //         })}
  //     />

  //     <label htmlFor="b">B</label>
  //     <input type="number" name="b" id="b" />

  //     <label htmlFor="b">A + B</label>
  //     <input type="number" name="aPlusB" id="aPlusB" readOnly />
  //   </>
  // );

  return <></>;
}
