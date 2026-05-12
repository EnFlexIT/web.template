module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/src/testes/jest.setup.ts"],
  testMatch: [
    "**/src/testes/**/*.test.ts",
    "**/src/testes/**/*.test.tsx"
  ],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native|expo|expo-modules-core|@expo|@expo/.*|react-native.*)/)"
  ],
  moduleNameMapper: {
    "^@reduxjs/toolkit$": "<rootDir>/node_modules/@reduxjs/toolkit/dist/cjs/index.js",
    "^@reduxjs/toolkit/(.*)$": "<rootDir>/node_modules/@reduxjs/toolkit/dist/cjs/$1",
    "^immer$": "<rootDir>/node_modules/immer/dist/cjs/index.js",
    "^immer/(.*)$": "<rootDir>/node_modules/immer/dist/cjs/$1"
  },
  
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"]
};