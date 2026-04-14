import { Route, Router } from "@solidjs/router";
import { Suspense } from "solid-js";
import Footer from "~/components/Footer";
import Nav from "~/components/Nav";
import routes from "~/routes";
import "./app.css";

export default function App() {
  return (
    <Router
      root={props => (
        <>
          <Nav />
          <Suspense>{props.children}</Suspense>
          <Footer />
        </>
      )}
    >
      {routes.map(route => (
        <Route path={route.path} component={route.component} />
      ))}
    </Router>
  );
}
