/**
 * PulseOS Test Module Registration Hook
 *
 * Registers the lightweight JSX extension-aliasing loader for native Node.js test execution.
 * Uses standard Node.js module customization hook (node:module register, supported in Node v20.6.0+).
 *
 * Scope & Limitations:
 * - This hook only maps .jsx file extensions to format: 'module' so Node's native ESM loader
 *   can import pure JavaScript logic stored in .jsx files without compilation errors.
 * - This is NOT a JSX transpiler; imported modules must not contain uncompiled JSX syntax.
 * - Contains zero machine-specific paths and does not interfere with Vite's production build.
 */
import { register } from 'node:module';
register('./jsxLoader.js', import.meta.url);
