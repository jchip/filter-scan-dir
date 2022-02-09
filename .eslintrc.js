const { eslintRcTestTypeScript } = require("@xarc/module-dev");
module.exports = {
  extends: eslintRcTestTypeScript,
  rules: {
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/ban-ts-comment": 0,
  },
};
