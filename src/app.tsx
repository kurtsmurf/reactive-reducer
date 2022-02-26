import { useReducer } from "preact/hooks";
// @ts-ignore
import deepequal from "https://cdn.skypack.dev/deepequal";

// ********************************************************
// ********************************************************
// SECTION: TYPES
// ********************************************************
// ********************************************************

type Id = string;

type Value = {
  type: "value";
  id: Id;
  value: number;
  dependents: Id[];
};
type Expression = {
  type: "expression";
  id: Id;
  value: number;
  dependents: Id[];
  parts: Id[];
};
type Node =
  | Value
  | Expression;

type Graph = Node[];

type Event =
  | {
    type: "set";
    id: Id;
    value: number;
  }
  | {
    type: "evaluate";
    id: Id;
  };

// ********************************************************
// ********************************************************
// SECTION: LOGIC
// ********************************************************
// ********************************************************

/* Not built yet, but the idea is that the user will be able to update the graph by adding or removing nodes, and by writing formulas (for now just add expressions) that reference other nodes in the graph, creating dependent/dependency relationships between nodes. This web of dependent/dependency relationships will allow us to update the graph in a reactive way. When one node is updated, all of its dependents will be updated as well, and its dependents' dependents, and so on in a cascade.
 *
 * Managing those relationships will be a little fiddly, since both the dependent and the dependency need to be aware of each other. In concrete terms, we need to add the dependent to the dependency's 'dependents' list, and we need to add the dependency to the consuming node's 'addExpression.parts' list whenever we create or update a formula. When we remove a node, we also need to remove it from the dependent list of any dependencies it may have, and it should not be possible to remove a node if it has dependents.
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
const get = (graph: Graph, id: Id) =>
  graph
    .find((node) => node.id === id);
const set = (graph: Graph, node: Node) =>
  graph
    .map((current) => current.id === node.id ? node : current);

const evaluate = (graph: Graph, expression: Expression) =>
  graph
    .filter((node) => expression.parts.includes(node.id))
    .map((node) => node.value)
    .reduce((left, right) => left + right, 0);

const reducer = (graph: Graph, event: Event): Graph => {
  const target = get(graph, event.id);

  if (!target) return graph;

  const consequentEvents: Event[] = target.dependents.map((dep) => ({
    type: "evaluate",
    id: dep,
  }));

  if (event.type === "set" && target.type === "value") {
    const updatedTarget = { ...target, value: event.value };
    const nextGraph = set(graph, updatedTarget);
    return consequentEvents.reduce(reducer, nextGraph);
  }

  if (event.type === "evaluate" && target.type === "expression") {
    const updatedTarget = { ...target, value: evaluate(graph, target) };
    const nextGraph = set(graph, updatedTarget);
    return consequentEvents.reduce(reducer, nextGraph);
  }

  return graph;
};

// ********************************************************
// ********************************************************
// SECTION: TEST
// ********************************************************
// ********************************************************

/* tests should guarantee the invariants listed above - may be a good opportunity to try out property-based testing with fast-check or similar
 * https://www.skypack.dev/view/fast-check
 */

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

const reducerTest = (testCase: TestCase) => {
  const { description, event, graph, expected } = testCase;
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

testCases.forEach(reducerTest);

// ********************************************************
// ********************************************************
// SECTION: UI
// ********************************************************
// ********************************************************

const initialState: Graph = [
  { id: "a", type: "value", value: 0, dependents: ["aPlusB"] },
  { id: "b", type: "value", value: 0, dependents: ["aPlusB"] },
  {
    id: "aPlusB",
    value: 0,
    type: "expression",
    parts: ["a", "b"],
    dependents: [],
  },
];

export function App() {
  const [graph, dispatch] = useReducer(reducer, initialState);

  const a = get(graph, "a");
  const b = get(graph, "b");
  const aPlusB = get(graph, "aPlusB");

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
            type: "set",
            id: "a",
            value: parseInt(event.currentTarget.value),
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
            type: "set",
            id: "b",
            value: parseInt(event.currentTarget.value),
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
