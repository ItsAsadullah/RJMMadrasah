module.exports = {
  testEnvironment: "node",
  testMatch: ["**/updateStudentStatus.test.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: { module: "commonjs", jsx: "react-jsx", esModuleInterop: true },
    }],
  },
};
