const { init, parse } = require("es-module-lexer");
const path = require("path");
(async () => {
  await init;

  const c = "import {add as cc, dd} from 'b'"
    .replace("import", "export")
    .replace(/\s+as\s+\w+?/g, "");
  console.log(c);
  console.log(parse(c));
  console.log(path.resolve(__dirname, __dirname));
})();
