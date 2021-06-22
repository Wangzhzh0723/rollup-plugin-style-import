import chalk from 'chalk';
import { parse, init } from 'es-module-lexer';
import * as ChangeCase from 'change-case';
import fs from 'fs';
import path from 'path';
import { normalizePath, createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';

function resolveNodeModule(root, ...dirs) {
    return normalizePath(path.resolve(root, "node_modules", ...dirs));
}
function resolveModule(root, ...dirs) {
    return normalizePath(path.resolve(root, ...dirs));
}
function getChangeCaseFileName(importName, libNameChangeCase) {
    try {
        // @ts-ignore
        return ChangeCase[libNameChangeCase](importName);
    }
    catch (e) {
        return importName;
    }
}
function transformImportCss(root, lib, importVariables) {
    const { libName, style, nodeModule, libNameChangeCase = "paramCase" } = lib;
    if (!isFunc(style) || !libName) {
        return [];
    }
    const set = new Set();
    importVariables.forEach((importVar) => {
        const name = getChangeCaseFileName(importVar, libNameChangeCase);
        let importStr = style(name);
        if (isBool(importStr))
            return;
        const importStrs = isArray(importStr)
            ? importStr
            : [importStr];
        importStrs.forEach((i) => {
            i = nodeModule ? resolveNodeModule(root, i) : resolveModule(root, i);
            if (fileExist(i)) {
                set.add(`import "${i}"`);
            }
        });
    });
    return Array.from(set);
}
function transformImportVariables(importStr) {
    let importVariables = [];
    try {
        importVariables = parse(importStr.replace("import", "export").replace(/\s+as\s+\w+?/g, ""))[1];
    }
    catch (e) {
        log(chalk.red("transformImportVariables: "), e);
    }
    return importVariables;
}
function getLib(libList, importName) {
    return libList.find((lib) => lib.libName === importName);
}
function fileExist(filePath) {
    try {
        fs.accessSync(filePath, fs.constants.R_OK);
        return true;
    }
    catch (error) {
        return false;
    }
}
function isTransformCode(code, libList) {
    return libList.some(({ libName }) => RegExp(`('${libName}')|("${libName}")`).test(code));
}
function checkLib(libList) {
    return isArray(libList) && !!libList.length;
}
function isArray(arr) {
    return Array.isArray(arr);
}
function isFunc(obj) {
    return typeof obj === "function";
}
function isBool(obj) {
    return typeof obj === "boolean";
}
function log(...args) {
    args[0] = `${chalk.green("[style-import-plugin]")} ${args[0]}`;
    console.log("\n", ...args);
}

function StyleImportPlugin(options) {
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
        async transform(code, id) {
            const { root, sourcemap, include, exclude, libList } = options;
            const idFilter = createFilter(include, exclude);
            if (!code || !idFilter(id) || !isTransformCode(code, libList)) {
                return null;
            }
            log(chalk.yellowBright("开始转换: "), id);
            await init;
            let imports = [];
            try {
                imports = parse(code)[0];
            }
            catch (e) {
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
                const importCssVariables = transformImportCss(root, lib, importVariables);
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
