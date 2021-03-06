import { Event, Expression, Graph, Id, Node } from "./types";

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
 */

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

const hasDuplicates = (graph: Graph) =>
  new Set(graph.map((node) => node.id)).size !== graph.length;

export const reducer = (graph: Graph, event: Event): Graph => {
  if (event.type === "add") {
    const nextGraph = [...graph, event.node];

    // Only return nextGraph if you can verify the following:

    // 1. "every dependent is an expression"
    // 2. "all relationships between nodes are known by both parties"
    // (number 1 is covered by number 2)

    // 3. "it has no cycles"

    if (
      // 4. "all ids are unique"
      hasDuplicates(nextGraph)
    ) {
      return graph;
    }

    return nextGraph;
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
