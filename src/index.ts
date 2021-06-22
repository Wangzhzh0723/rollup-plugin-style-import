import {
  checkLib,
  getLib,
  isTransformCode,
  log,
  transformImportCss,
  transformImportVariables,
} from "./shared/index";
import chalk from "chalk";
import { createFilter } from "@rollup/pluginutils";
import { ImportSpecifier, init, parse } from "es-module-lexer";
import MagicString from "magic-string";
import { StylePluginOption } from "../types";

function StyleImportPlugin(options?: StylePluginOption) {
  options = {
    root: process.cwd(),
    include: ["**/*.vue", "**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx"],
    exclude: "node_modules/**",
    libList: [],
    ...options,
  };
  const name = "StyleImportPlugin";
  if (!checkLib(options.libList)) {
    log(chalk.yellow("libList is required, please check your options!"));
    return { name };
  }

  return {
    name,
    enforce: "post",
    async transform(code: string, id: string) {
      const { root, sourcemap, include, exclude, libList } =
        options as StylePluginOption;

      const idFilter = createFilter(include, exclude);
      if (!code || !idFilter(id) || !isTransformCode(code, libList)) {
        return null;
      }
      log(chalk.yellowBright("开始转换: "), id);

      await init;

      let imports: ReadonlyArray<ImportSpecifier> = [];
      try {
        imports = parse(code)[0];
      } catch (e) {
        console.log(chalk.red("imports-error: "), e);
      }

      if (!imports.length) {
        return null;
      }

      const magicString = new MagicString(code);

      imports.forEach(({ n, se, ss }) => {
        if (!n) {
          return;
        }
        const lib = getLib(libList, n);
        if (!lib) {
          return;
        }
        const importStr = code.slice(ss, se);
        const importVariables = transformImportVariables(importStr);
        const importCssVariables = transformImportCss(
          root!,
          lib,
          importVariables,
        );
        magicString.appendRight(se + 1, `${importCssVariables.join(";")}`);
      });

      return {
        map: sourcemap ? magicString.generateMap({ hires: true }) : null,
        code: magicString.toString(),
      };
    },
  };
}

module.exports = StyleImportPlugin;
