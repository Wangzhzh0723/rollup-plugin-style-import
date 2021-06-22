declare const _default: (options: StylePluginOption) => { name: string };
export default _default;

export interface StylePluginOption {
  root?: string;
  sourcemap?: boolean;
  include?: FilterPattern;
  exclude?: FilterPattern;
  libList: LibList;
}

export declare type LibList = LibItem[];

export interface LibItem {
  libName: string;
  libDir?: string;
  nodeModule?: boolean;
  style: (name: string) => string | string[] | boolean;
  libNameChangeCase?: LibNameChangeCase;
}

export declare type FilterPattern =
  | Array<string | RegExp>
  | string
  | RegExp
  | null;

export declare type LibNameChangeCase =
  | ChangeCaseType
  | ((name: string) => string);

export declare type ChangeCaseType =
  | "camelCase"
  | "capitalCase"
  | "constantCase"
  | "dotCase"
  | "headerCase"
  | "noCase"
  | "paramCase"
  | "pascalCase"
  | "pathCase"
  | "sentenceCase"
  | "snakeCase";
