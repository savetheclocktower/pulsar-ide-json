const { CompositeDisposable } = require('atom');
const { AutoLanguageClient } = require('@savetheclocktower/atom-languageclient');

const SCHEMAS = require('./schemas');
const extend = require('just-extend');

const Path = require('path');

const ROOT = Path.normalize(Path.join(__dirname, '..'));

/** @type {string[]} */
const CODE_ACTION_KINDS = [];
/** @type {string[]} */
const DEFAULT_SCOPES = ['source.json'];

const SCHEMAS_CONFIG_PATH = `jsonSchemas`;

/**
 * @typedef {Object} ConfigSchema
 * @property {string} type
 */

class JSONLanguageClient extends AutoLanguageClient {
  /** @param args {unknown[]} */
  constructor () {
    super();

    this.enableSymbols = true;
    this.enableAutocomplete = true;
    this.disposable = new CompositeDisposable();

    this.jsonSchemas = {};
    this.customAssociations = {};

    this.disposable.add(
      atom.config.observe(`${this.getPackageName()}.enableSymbols`, (value) => {
        this.enableSymbols = value;
      }),
      atom.config.observe(`${this.getPackageName()}.jsonSchemas`, (value) => {
        this.jsonSchemas = value ?? {}
      }),
      atom.config.observe(`${this.getPackageName()}.${SCHEMAS_CONFIG_PATH}`, (customAssociations) => {
        this.customAssociations = customAssociations ?? {};
        this.sendSchemaAssociations();
      })
    );
  }

  getLanguageName () { return 'JSON'; }
  getServerName () { return 'JSON Language Server'; }

  getPackageName () {
    return Path.basename(ROOT) ?? 'pulsar-ide-json';
  }

  getPathToServer() {
    return Path.join(ROOT, 'node_modules', '.bin', 'vscode-json-language-server');
  }

  getGrammarScopes () {
    // TODO: Configuration of additional scopes?
    // let packageName = this.getPackageName();
    // let additionalScopes = atom.config.get(
    //   `${packageName}.advanced.additionalScopes`
    // );
    return DEFAULT_SCOPES;
  }

  getKindsForCodeActionRequest (_editor, _range, diagnostics) {
    // If there are any diagnostic messages associated with this position in
    // the editor, don't add any kinds. The only things that should appear in
    // the menu are actions associated with fixing that diagnostic.
    if (diagnostics.length > 0) return [];

    // Otherwise the user has asked for code actions in some other section of
    // the editor that has no diagnostic message. We should present them with
    // all the possible actions they can do on this file.
    return CODE_ACTION_KINDS;
  }

	startServerProcess() {
    // The process is a binary file. We shouldn't assume that Node can run this
    // directly; it's meant to be invoked in a shell without being prefixed by
    // `node`. The latter only works on Unix-y environments in which the
    // JavaScript CLI script can be symlinked straight into `.bin`.
    //
    // In order to run with a specific version of Node, we should be able to
    // unshift the directory of our desired Node executable onto the front of
    // the `PATH`.
		let bin = this.getPathToServer();
    this.logger.debug(`Starting bin at path: ${bin} with builtin Node`);
    return super.spawnChildNode([bin, "--stdio"], {
      cwd: atom.project.getPaths()[0] || __dirname,
      env: process.env
		});
	}

  showStartupError (err) {
    this.errorNotification = atom.notifications.addError(
      `${this.getPackageName()}: ${this.getServerName()} language server cannot start`,
      {
        description: `Consult the README on the settings page for more information.`,
        detail: err.message,
        buttons: [
          {
            text: 'Open Settings',
            onDidClick: () => {
              atom.workspace.open(`atom://config/packages/${this.getPackageName()}`);
            }
          }
        ],
        dismissable: true
      }
    );
  }

  getConnectionType() {
    return /** @type {const} */ ('stdio');
  }

  getInitializeParams (projectPath, lsProcess) {
    let result = super.getInitializeParams(projectPath, lsProcess);
    result.initializationOptions = {
      provideFormatter: true
    };
    return result;
  }

  postInitialization (server) {
    // Ordinarily we'll just assume the server started successfully and that it
    // isn't worth informing the user about. But if the server was previously
    // in an error state…
    if (this.errorNotification) {
      // …dismiss that old notification (if it's still present)…
      this.errorNotification.dismiss();
      // …and tell the user that it's been fixed.
      atom.notifications.addSuccess(
        `${this.getPackageName()}: ${this.getServerName()} started`
      );
      this.errorNotification = null;
    }

    this._server = server;
    this.sendSchemaAssociations();
  }

  getRootConfigurationKey () {
    return `${this.getPackageName()}.serverSettings`;
  }

  mapConfigurationObject (config) {
    // let result = {};
    // for (let lang of ['css', 'scss', 'less']) {
    //   // This retrieves the entire config object, plus any language-specific
    //   // overrides, no matter how deep. We don't even need to consult the
    //   // argument we're given.
    //   let base = this.getScopedSettingsForLanguage(
    //     `${this.getPackageName()}.serverSettings`,
    //     lang
    //   );
    //
    //   base.hover ??= {};
    //
    //   for (let [origin, destination] of Object.entries(CONFIG_TRANSLATIONS)) {
    //     let value = safeGet(base, origin);
    //     safeSet(base, destination, value);
    //     safeSet(base, origin, null);
    //   }
    //
    //   result[lang] = base;
    // }

    // config.json ??= {};
    // config.json.schemas ??= [];
    // config.json.schemas.push(...SCHEMAS);
    console.warn('Mapped configuration:', config);
    return config;
  }

  sendSchemaAssociations () {
    if (!this._server) return;
    let associations = [...SCHEMAS];
    for (let value of Object.values(this.customAssociations)) {
      associations.push(value);
    }
    console.warn('SENDING SCHEMAS:', associations)
    this._server.connection.sendCustomNotification(
      'json/schemaAssociations',
      associations
    );
  }

  /**
   * @param {string} key
   * @param {Parameters<import('atom').Config['get']>[1]} options
   */
  getSetting (key, options = {}) {
    return atom.config.get(`${this.getPackageName()}.${key}`, options)
  }

  getScopedSettingsForKey(key, scopeName) {
    let schema = atom.config.getSchema(key);
    if (!schema || !('type' in schema)) {
      throw new Error(`Unknown config key: ${schema}`);
    }

    let base = atom.config.get(key);
    if (!scopeName) return base;

    let scoped = atom.config.get(key, { scope: [scopeName] });

    if (schema?.type === 'object') {
      // For objects, do a deep-merge.
      return /** @type {any} */ (extend)(true, {}, base, scoped);
    } else {
      return scoped ?? base;
    }
  }

  getEditorSettingsForKey (key, editor) {
    let schema = atom.config.getSchema(key);
    if (!schema || !('type' in schema)) {
      throw new Error(`Unknown config key: ${schema}`);
    }

    let base = atom.config.get(key);
    if (!editor) return base;

    let grammar = editor.getGrammar();
    let scoped = atom.config.get(key, { scope: [grammar.scopeName] });

    if (schema?.type === 'object') {
      return /** @type {any} */ (extend)(true, {}, base, scoped);
    } else {
      return scoped ?? base;
    }
  }

  // AUTOCOMPLETE
  // ============

  provideAutocomplete () {
    // Allow the user to configure whether autocomplete is enabled. Unlike most
    // other such settings, this one requires a restart/reload to apply, and
    // isn't scope-specific.
    // TODO: Make this configurable.

    let result = super.provideAutocomplete();
    let original = result.getSuggestions;
    result.getSuggestions = (...args) => {
      if (!this.enableAutocomplete) return Promise.resolve([]);
      return original(...args);
    };
    return result;
  }

  // LINTER
  // ======

  getLinterSettings (_editor) {
    return {};
  }

  shouldIgnoreMessage (_diagnostic, _editor, _range) {
    // TODO: The `lint.enable` server setting does not seem to prevent
    // diagnostics from being sent (not sure why!), so we have to keep track of
    // this on the client.
    return false;
  }

  // SYMBOLS
  // =======

  provideSymbols () {
    let result = super.provideSymbols();
    let originalCanProvideSymbols = result.canProvideSymbols;
    result.canProvideSymbols = (...args) => {
      if (!this.enableSymbols) return false;
      return originalCanProvideSymbols(...args);
    };
    return result;
  }

  getSymbolSettings (_editor) {
    return {}
  }

  shouldIgnoreSymbol (_symbol, _editor) {
    return false;
  }

  // INTENTIONS
  // ==========

  // This is annoying because it should be almost entirely a package-specific
  // concern. But `atom-languageclient` must be aware of this because there's
  // no concept of a “code” or “message type” in the `linter` service contract.
  // So we can't pull this off just by inspecting the linter messages; we have
  // to look at the original `Diagnostic` objects from the language server.
  getIntentionsForLinterMessage (_message, _editor) {
    // TODO: Once we find out if this server ever sends diagnostics, figure out
    // if any of them have associated code actions.
    return []
  }

  // REFERENCES
  // ==========

  getReferences (editor, point) {
    // TODO: The `hover.references` server setting does not seem to prevent
    // the server from responding to reference requests, so we have to handle
    // this on the client.
    return super.getReferences(editor, point);
  }
}

module.exports = new JSONLanguageClient();
