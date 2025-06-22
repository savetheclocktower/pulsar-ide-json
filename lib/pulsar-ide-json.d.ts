export type JSONSchema = unknown;

export type JSONSchemaSettings = {
  // An array of file patterns to match against when resolving JSON files to
  // schemas. `*` and '**' can be used as a wildcard. Exclusion patterns can
  // also be defined and start with '!'. A file matches when there is at least
  // one matching pattern and the last matching pattern is not an exclusion
  // pattern.
  fileMatch?: string[];
  // A URL or absolute file path to a schema. Can be a relative path (starting
  // with './') in workspace and workspace folder settings.
  uri?: string;
  // The schema definition for the given URL. The schema only needs to be
  // provided to avoid accesses to the schema URL.
  schema?: JSONSchema;
  // If provided, the association is only used if the document is located in
  // the given folder (directly or in a subfolder).
  folderUri?: string;
} & ({ uri: string } | { schema: string })

export interface ISchemaAssociations {
  /**
   * An object where:
   *  - keys are file names or file paths (using `/` as path separator) and `*`
   *    can be used as a wildcard;
   *  - values are an arrays of schema URIs.
   */
  [pattern: string]: string[];
}

export interface ISchemaAssociation {
  /**
   * The URI of the schema, which is also the identifier of the schema.
   */
  uri: string;

  /**
   * A list of file path patterns that are associated to the schema. The '*'
   * wildcard can be used. Exclusion patterns starting with '!'. For example
   * '*.schema.json', 'package.json', '!foo*.schema.json'. A match succeeds
   * when there is at least one pattern matching and last matching pattern does
   * not start with '!'.
   */
  fileMatch: string[];
  /**
   * If provided, the association is only used if the validated document is
   * located in the given folder (directly or in a subfolder).
   */
  folderUri?: string;
  /**
   * The schema for the given URI. If no schema is provided, the schema will be
   * fetched with the schema request service (if available).
   */
  schema?: JSONSchema;
}
