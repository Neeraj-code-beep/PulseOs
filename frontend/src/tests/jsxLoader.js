/**
 * PulseOS Lightweight Node.js ESM Loader for .jsx Files
 *
 * Scope & Limitations:
 * - Extension resolver: Resolves extensionless imports to .jsx when standard resolution fails.
 * - Format mapper: Designates .jsx files as format: 'module' so Node treats them as ES modules.
 * - Pure JavaScript only: Does NOT transform JSX elements (<Component />) to React.createElement.
 *   Modules loaded via this hook must contain pure JavaScript functions.
 * - Standard Node.js hook: Uses standard resolve and load hook signatures.
 */

export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND' && !specifier.endsWith('.jsx')) {
      try {
        return await nextResolve(`${specifier}.jsx`, context);
      } catch {
        throw err;
      }
    }
    throw err;
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.jsx')) {
    return nextLoad(url, { ...context, format: 'module' });
  }
  return nextLoad(url, context);
}
