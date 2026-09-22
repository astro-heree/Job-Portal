import "@testing-library/jest-dom/vitest";

// React 19 checks this global before wrapping updates in act(); without it,
// RTL's own act() wrapping still works but React logs a spurious warning on
// every async state update in a test.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
