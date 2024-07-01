import { build } from 'esbuild';
import builtins from "builtin-modules";

build({
    entryPoints: ['main.ts'],
    bundle: true,
    platform: 'node',
    target: 'es2020',
    sourcemap: true,
    outfile: 'main.js',
    loader: {
        '.js': 'jsx',
        '.ts': 'ts',
    },
    define: {
        'process.env.NODE_ENV': '"production"',
    },
    external: [
        "obsidian",
        "@codemirror/language",
        "@codemirror/state",
        "@codemirror/view",
        "@lezer/common",
        ...builtins],
    format: 'cjs',
    treeShaking: true,
}).catch(() => process.exit(1))
