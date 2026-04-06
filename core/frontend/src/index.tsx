import { Router } from "@solidjs/router";
import { render } from "solid-js/web";

import App from "./App";
import { routes } from "./routes";
import "./styles.css";

const mountNode = document.getElementById("app");

if (!mountNode) {
  throw new Error("BlitzPress frontend mount node '#app' was not found");
}

render(
  () => (
    <Router root={(props) => <App>{props.children}</App>}>
      {routes}
    </Router>
  ),
  mountNode,
);
