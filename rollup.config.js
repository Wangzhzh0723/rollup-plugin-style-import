const path = require("path");
const pkg = require("./package.json");

const typescript = require("@rollup/plugin-typescript");
const nodeResolvePlugin = require("rollup-plugin-node-resolve");

const resolve = (dir) => path.resolve(__dirname, dir);

module.exports = {
  input: resolve("src/index.ts"),
  output: [
    {
      file: resolve(pkg.main),
      format: "cjs",
    },
    {
      file: resolve(pkg.module),
      format: "esm",
    },
  ],
  plugins: [typescript()],
  external: ["chalk", "@rollup/pluginutils"],
};
