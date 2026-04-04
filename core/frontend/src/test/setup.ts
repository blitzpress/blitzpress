import type { JSX } from "solid-js";
import { createComponent, ssrElement } from "solid-js/web";

type ReactProps = Record<string, unknown> & { children?: unknown };

function Fragment(props: { children?: unknown }) {
  return props.children;
}

function createElement(
  type: string | ((props: ReactProps) => JSX.Element),
  props?: ReactProps | null,
  ...children: unknown[]
) {
  const normalizedProps: ReactProps = props ? { ...props } : {};
  if (children.length === 1) {
    normalizedProps.children = children[0];
  } else if (children.length > 1) {
    normalizedProps.children = children;
  }

  if (typeof type === "function") {
    return createComponent(type, normalizedProps);
  }

  return ssrElement(type, normalizedProps, normalizedProps.children, false);
}

Object.assign(globalThis, {
  React: {
    createElement,
    Fragment,
  },
});
