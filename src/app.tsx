import { useReducer } from "preact/hooks";
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

/**
 * Not built yet, but the idea is that the user will be able to update the graph by adding or removing nodes, and by writing formulas (for now just add expressions) that reference other nodes in the graph, creating dependent/dependency relationships between nodes. This web of dependent/dependency relationships will allow us to update the graph in a reactive way. When one node is updated, all of its dependents will be updated as well, and its dependents' dependents, and so on in a cascade.
 *
 * Managing those relationships will be a little fiddly, since both the dependent and the dependency need to be aware of each other. In concrete terms, we need to add the dependent to the dependency's 'dependents' list, and we need to add the dependency to the consuming node's 'addExpression.parts' list whenever we create or update a formula.
 *
 * This will all be handled by the appropriate branch of the reducer - the consuming code (tests, ui) will only be aware of certain events that they can dispatch, e.g. UPDATE_VALUE, UPDATE_FORMULA etc.
 *
 * Internally the reducer will have to to maintain certain invariants, such as:
 *
 * 1. "every node listed as a dependent is an expression, not a value"
 * 2. "all relationships between nodes are known by both parties"
 * 3. "the graph has no cycles"
 *
 * Number one could read, "all dependents are expressions".
 * Number two means that if node A lists node B as an expression part, then node B must list node A as a dependent, and vice versa.
 * Number three says it must be impossible to loop back onto a node that was already visited in the current path, because doing so would cause the reducer to enter an infinite loop.
 *
 * ...other requirements?
 * */
const reducer = (graph: Graph, event: Event): Graph => {
  const target = graph.find((node) => node.id === event.node);

  if (!target) return graph;

  /**
   * If I'm updating a dependent, it must be the case that it is an "addExpression" type node, since only expression types can depend on other nodes (rule is not implemented yet, but that's the plan). I'm providing a value to the newValue prop of the update event, but only because the types require it - the reducer will update the expression's value by re-evaluating the expression. This points to a potential improvement of the types - how do I make them better?
   * */
  const consequentEvents: Event[] = target.dependents
    .map((dep) => ({
      type: "Update",
      node: dep,
      newValue: event.newValue,
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

// ********************************************************
// SECTION: TEST
// ********************************************************

const reducerTest = (
  message: string,
  given: { graph: Graph; event: Event },
  expected: Graph,
) => {
  const actual: Graph = reducer(given.graph, given.event);
  const passed = deepequal(actual, expected);

  console.log(`
    ====
    TEST: ${passed ? "U PASS 💃💃💃💃💃💃" : "U FAIL 😠"}
    ====

    ${message}
    result: ${passed}

    expected: ${JSON.stringify(expected)}

    actual: ${JSON.stringify(actual)}
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

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // It would be nicer if I could get values without scanning the list, do a table lookup instead (object? hashMap? what data structure would be best for representing the graph?)
  const a = state.find((el) => el.id === "a");
  const b = state.find((el) => el.id === "b");
  const aPlusB = state.find((el) => el.id === "aPlusB");

  if (!(a && b && aPlusB)) return <p>that ain't right</p>;

  return (
    <>
      <label htmlFor="a">A</label>
      <input
        type="number"
        name="a"
        id="a"
        value={a.value}
        onInput={(event) =>
          dispatch({
            node: "a",
            newValue: parseInt(event.currentTarget.value),
          })}
      />

      <label htmlFor="b">B</label>
      <input
        type="number"
        name="b"
        id="b"
        value={b.value}
        onInput={(event) =>
          dispatch({
            node: "b",
            newValue: parseInt(event.currentTarget.value),
          })}
      />

      <label htmlFor="aPlusB">A + B</label>
      <input
        readOnly
        type="number"
        name="aPlusB"
        id="aPlusB"
        value={aPlusB.value}
      />
    </>
  );
}
