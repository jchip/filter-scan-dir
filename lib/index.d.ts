export * from "../dist/index.d";

import { filterScanDir as FSD, filterScanDirSync as FSDS } from "../dist/index.d";

// backward type compatible for legacy require("filter-scan-dir") usage
// new TS code should do `import {filterScanDir} from "filter-scan-dir"`
declare function asyncApi(options?: any): Promise<any>;
declare namespace asyncApi {
  const sync: (options?: any) => any;
  const filterScanDir: typeof FSD;
  const filterScanDirSync: typeof FSDS;
}
// @ts-ignore
export = asyncApi;
