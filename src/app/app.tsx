import { useReducer } from "preact/hooks";
import { Event, Expression, Graph, Node, Value } from "./types";
import { reducer } from "./logic";
import { runTests } from "./tests";

runTests();

const initialState: Graph = [
  { id: "a", type: "value", value: 0, dependents: ["aPlusB"] },
  { id: "b", type: "value", value: 0, dependents: ["aPlusB"] },
  {
    id: "aPlusB",
    value: 0,
    type: "expression",
    dependencies: ["a", "b"],
    dependents: [],
  },
];

type Dispatch = (event: Event) => void;

const ValueCell = ({ id, value }: Value, dispatch: Dispatch) => (
  <>
    <label htmlFor={id}>{id}</label>
    <input
      type="number"
      name={id}
      id={id}
      value={value}
      onInput={(event) =>
        dispatch({
          type: "set",
          id,
          value: parseInt(event.currentTarget.value),
        })}
    />
  </>
);

const ExpressionCell = ({ id, value }: Expression, dispatch: Dispatch) => (
  <>
    <label htmlFor={id}>{id}</label>
    <input
      readOnly
      type="number"
      name={id}
      id={id}
      value={value}
    />
  </>
);

const Cell = (node: Node, dispatch: Dispatch) => {
  switch (node.type) {
    case "expression":
      return ExpressionCell(node, dispatch);
    case "value":
      return ValueCell(node, dispatch);
  }
};

export function App() {
  const [graph, dispatch] = useReducer(reducer, initialState);
  return <>{graph.map((node) => Cell(node, dispatch))}</>;
}
