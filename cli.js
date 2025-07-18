#!/usr/bin/env node
process.env.BABEL_8_BREAKING = "true";

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const minimist = require('minimist');

const TRANSFORMERS_DIR = './transformers/';

const args = minimist(process.argv.slice(2), {
    boolean: ['unpack'],
    alias: {
        o: 'output',
        t: 'transformers',
        u: 'unpack'
    },
    default: {
        transformers: '*'
    }
});

const input = args._[0];
if (!input) {
    console.error(`
Usage: node untranspile
    [input.js | 'console.log(123);']
    [--output output.js]
    [--transformers transformer1,transformer2,...]
    [--unpack]
`);
    process.exit(1);
}

const source = fs.existsSync(input) ? fs.readFileSync(input, 'utf-8') : input;

// Resolve transformer list
const transformerNames = args.transformers == '*' ? fs.readdirSync(TRANSFORMERS_DIR) : args.transformers.split(',');
const selectedTransformers = transformerNames.map(name => require(TRANSFORMERS_DIR + name));
const state = { changes: 0 };
const plugins = selectedTransformers.map(transformer => transformer(state));

// Transform in a loop until no changes
let changed = true;
let cycle = 0;
const maxCycles = plugins.length == 1 ? 1 : 10;
let currentCode = source;

while (changed && cycle++ < maxCycles) {
    const { code } = babel.transformSync(currentCode, {
        plugins,
        configFile: false,
        parserOpts: {
            sourceType: "module",
            plugins: ["jsx"]
        }
    });
    changed = state.changes > 0;
    currentCode = code;
    console.log(`Cycle ${cycle}: ${state.changes} changes`);
    state.changes = 0;
}

const output = args.output;
if (output) {
    fs.writeFileSync(output, currentCode, 'utf-8');
} else {
    console.log(currentCode);
}