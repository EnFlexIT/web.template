

/// <reference types="jest" />

jest.mock("@react-native-async-storage/async-storage", () => {
  return require("@react-native-async-storage/async-storage/jest/async-storage-mock");
});