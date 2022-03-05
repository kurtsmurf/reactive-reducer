import { render } from "preact";
import { App } from "./app/app";
import "./index.css";
import { runTests } from './app/tests'

// @ts-ignore
window.runTests = runTests;

render(<App />, document.getElementById("app")!);
