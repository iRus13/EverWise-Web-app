import "@testing-library/jest-dom/vitest";

// jsdom has no layout/scroll implementation; browser QA verifies actual scrolling.
window.scrollTo = () => {};
