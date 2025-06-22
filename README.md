# pulsar-ide-json

Rich language support for JSON files in Pulsar. Uses [vscode-langservers-extracted](https://www.npmjs.com/package/vscode-langservers-extracted).

## Features

* Code completion (via `autocomplete-plus`) for JSON properties and values based on the document’s [JSON schema](https://json-schema.org/) or based on existing properties/values used at other places in the document. JSON Schemas for some common types of JSON files are included; others can be configured.
* Document symbol resolution (via `symbols-view`) for JSON properties in the document.
* Hover (via `pulsar-hover`) for rich tooltip content based on descriptions in the document’s JSON schema.
* Code formatting (via `pulsar-code-format`) — able to format specific ranges or the entire document.
* Jump-to-declaration support (via `symbols-view`) for `$ref` references in JSON schemas.

## TODO

* Autocompletion isn’t quite perfect yet; it’ll insert the wrong thing if you’ve already typed quotation marks.

## Configuring JSON schemas

Any `$schema` property at the root of a JSON file will, if it references an `http`/`https` or `file` URL scheme, be used as the schema for that file.

Other JSON schemas can be added — not through the settings UI, but via your `config.cson`. For each new JSON schema you want to add, create a new object property like so:

```coffeescript
"*":
  "pulsar-ide-json":
    "jsonSchemas":
      "eslintrc":
        "fileMatch": [".eslintrc", ".eslintrc.json"],
        "uri": "https://json.schemastore.org/eslintrc.json"
```

The object property (`"eslintrc"` in the example above) is not used for anything, but it should be somewhat unique to reduce the chance of collisions. As for the properties:

* `fileMatch` should be an array of glob-like patterns to match against files.
* `uri` should have either an `http`/`https` scheme or a `file` scheme; in the latter case, it should point to an absolute path on disk. ~~It can also start with a relative path on disk, in which case it will be resolved relative to the project root (TODO).~~

Several common schemas are included out of the box:

* `tsconfig.json` and `jsconfig.json` (TypeScript configuration)
* `package.json` (NPM metadata file)
* `schema.json` (JSON Schema meta-schema)
