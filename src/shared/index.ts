import chalk from "chalk";
import { parse } from "es-module-lexer";
import { LibItem, LibList, LibNameChangeCase } from "../../types";
import * as ChangeCase from "change-case";
import fs from "fs";
import path from "path";
import { normalizePath } from "@rollup/pluginutils";

export function resolveNodeModule(root: string, ...dirs: string[]) {
  return normalizePath(path.resolve(root, "node_modules", ...dirs));
}

export function resolveModule(root: string, ...dirs: string[]) {
  return normalizePath(path.resolve(root, ...dirs));
}

function getChangeCaseFileName(
  importName: string,
  libNameChangeCase: LibNameChangeCase,
) {
  try {
    // @ts-ignore
    return ChangeCase[libNameChangeCase](importName);
  } catch (e) {
    return importName;
  }
}

export function transformImportCss(
  root: string,
  lib: LibItem,
  importVariables: string[],
): string[] {
  const { libName, style, nodeModule, libNameChangeCase = "paramCase" } = lib;
  if (!isFunc(style) || !libName) {
    return [];
  }
  const set: Set<string> = new Set();
  importVariables.forEach((importVar: string) => {
    const name = getChangeCaseFileName(importVar, libNameChangeCase);
    let importStr = style(name);
    if (isBool(importStr)) return;
    const importStrs = isArray(importStr)
      ? (importStr as string[])
      : [importStr as string];

    importStrs.forEach((i) => {
      i = nodeModule ? resolveNodeModule(root, i) : resolveModule(root, i);
      if (fileExist(i)) {
        set.add(`import "${i}"`);
      }
    });
  });
  return Array.from(set);
}

export function transformImportVariables(importStr: string) {
  let importVariables: string[] = [];
  try {
    importVariables = parse(
      importStr.replace("import", "export").replace(/\s+as\s+\w+?/g, ""),
    )[1] as string[];
  } catch (e) {
    log(chalk.red("transformImportVariables: "), e);
  }
  return importVariables;
}

export function getLib(libList: LibList, importName: string) {
  return libList.find((lib) => lib.libName === importName);
}

export function fileExist(filePath: string) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export function isTransformCode(code: string, libList: LibList) {
  return libList.some(({ libName }) =>
    RegExp(`('${libName}')|("${libName}")`).test(code),
  );
}

export function checkLib<T>(libList: T[]) {
  return isArray(libList) && !!libList.length;
}

export function isArray(arr: any) {
  return Array.isArray(arr);
}

export function isFunc(obj: any) {
  return typeof obj === "function";
}
export function isBool(obj: any) {
  return typeof obj === "boolean";
}

export function log(...args: any[]) {
  args[0] = `${chalk.green("[style-import-plugin]")} ${args[0]}`;
  console.log("\n", ...args);
}
