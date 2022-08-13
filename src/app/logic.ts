import { Event, Expression, Graph, Id, Node } from "./types";

const get = (graph: Graph, id: Id) =>
  graph
    .find((node) => node.id === id);
const set = (graph: Graph, node: Node) =>
  graph
    .map((current) => current.id === node.id ? node : current);
const evaluate = (graph: Graph, expression: Expression) =>
  graph
    .filter((node) => expression.dependencies.includes(node.id))
    .map((node) => node.value)
    .reduce((left, right) => left + right, 0);
const includes = (graph: Graph, id: Id) => graph.map(node => node.id).includes(id)

export const reducer = (graph: Graph, event: Event): Graph => {
  if (event.type === "add") {
    return includes(graph, event.node.id) ? graph : [...graph, event.node]
  }

  const target = get(graph, event.id);

  if (!target) {
    return graph;
  }

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
