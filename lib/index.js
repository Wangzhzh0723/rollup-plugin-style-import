'use strict';

var chalk = require('chalk');
var esModuleLexer = require('es-module-lexer');
var ChangeCase = require('change-case');
var fs = require('fs');
var path = require('path');
var pluginutils = require('@rollup/pluginutils');
var MagicString = require('magic-string');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            }
        });
    }
    n['default'] = e;
    return Object.freeze(n);
}

var chalk__default = /*#__PURE__*/_interopDefaultLegacy(chalk);
var ChangeCase__namespace = /*#__PURE__*/_interopNamespace(ChangeCase);
var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var MagicString__default = /*#__PURE__*/_interopDefaultLegacy(MagicString);

function resolveNodeModule(root, ...dirs) {
    return pluginutils.normalizePath(path__default['default'].resolve(root, "node_modules", ...dirs));
}
function resolveModule(root, ...dirs) {
    return pluginutils.normalizePath(path__default['default'].resolve(root, ...dirs));
}
function getChangeCaseFileName(importName, libNameChangeCase) {
    try {
        // @ts-ignore
        return ChangeCase__namespace[libNameChangeCase](importName);
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
        importVariables = esModuleLexer.parse(importStr.replace("import", "export").replace(/\s+as\s+\w+?/g, ""))[1];
    }
    catch (e) {
        log(chalk__default['default'].red("transformImportVariables: "), e);
    }
    return importVariables;
}
function getLib(libList, importName) {
    return libList.find((lib) => lib.libName === importName);
}
function fileExist(filePath) {
    try {
        fs__default['default'].accessSync(filePath, fs__default['default'].constants.R_OK);
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
    args[0] = `${chalk__default['default'].green("[style-import-plugin]")} ${args[0]}`;
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
        log(chalk__default['default'].yellow("libList is required, please check your options!"));
        return { name };
    }
    return {
        name,
        enforce: "post",
        async transform(code, id) {
            const { root, sourcemap, include, exclude, libList } = options;
            const idFilter = pluginutils.createFilter(include, exclude);
            if (!code || !idFilter(id) || !isTransformCode(code, libList)) {
                return null;
            }
            log(chalk__default['default'].yellowBright("开始转换: "), id);
            await esModuleLexer.init;
            let imports = [];
            try {
                imports = esModuleLexer.parse(code)[0];
            }
            catch (e) {
                console.log(chalk__default['default'].red("imports-error: "), e);
            }
            if (!imports.length) {
                return null;
            }
            const magicString = new MagicString__default['default'](code);
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
