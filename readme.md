A rollup plugin that imports component library styles on demand

## Install (yarn or npm)

```shell
yarn add @jonath/rollup-plugin-style-import -D
or

npm i @jonath/rollup-plugin-style-import -D
```

## Effect

```
import { Button } from 'ant-design-vue';
```

        ↓ ↓ ↓ ↓ ↓ ↓

```
import { Button } from 'ant-design-vue';
import 'ant-design-vue/es/button/style/index.css';
```

## Usage

```js
import styleImport from "@jonath/rollup-plugin-style-import";

styleImport({
  libs: [
    {
      libName: "ant-design-vue",
      nodeModule: true,
      resolveStyle: (name) => {
        return `ant-design-vue/es/${name}/style/index`;
      },
    },
  ],
});
```
