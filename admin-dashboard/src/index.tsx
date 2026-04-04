import { render } from "solid-js/web";
import App from "./App";
import "./styles.css";

const mountNode = document.getElementById("app");

if (!mountNode) {
  throw new Error("Admin dashboard mount node '#app' was not found");
}

render(() => <App />, mountNode);
