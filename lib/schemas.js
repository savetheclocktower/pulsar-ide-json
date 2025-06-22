const Path = require('path');

const ROOT = Path.resolve(Path.join(__dirname, '..'));
const SCHEMAS_PATH = Path.resolve(ROOT, 'schemas');

/** @type {Array<import('./pulsar-ide-json').JSONSchemaSettings>} */
const SCHEMAS = [
  {
    fileMatch: ["tsconfig.json"],
    uri: `file://${SCHEMAS_PATH}/tsconfig.schema.json`
  },
  {
    fileMatch: ["jsconfig.json"],
    uri: `file://${SCHEMAS_PATH}/jsconfig.schema.json`
  },
  {
    fileMatch: ["package.json"],
    uri: `file://${SCHEMAS_PATH}/package.schema.json`
  },
  {
    fileMatch: ["*.schema.json"],
    uri: `file://${SCHEMAS_PATH}/schema.schema.json`
  }
];

module.exports = SCHEMAS;
