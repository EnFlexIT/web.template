

/// <reference types="jest" />

jest.mock("@react-native-async-storage/async-storage", () => {
  return require("@react-native-async-storage/async-storage/jest/async-storage-mock");
});
if (
  typeof window !== "undefined" &&
  !(window as any).location
) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      origin: "http://localhost:8081",
      href: "http://localhost:8081",
    },
  });
}