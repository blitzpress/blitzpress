export function registerPlugin() {}

export const hooks = {
  addAction() { return "placeholder-action"; },
  addFilter() { return "placeholder-filter"; },
  doAction() {},
  applyFilters(_name, value) { return value; },
  removeAction() { return false; },
  removeFilter() { return false; }
};
