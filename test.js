#!/usr/bin/env node
require('./includes/utils');

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const { codeFrameColumns } = require('@babel/code-frame');

const TRANSFORMERS_DIR = './transformers/';

const transformer = process.argv[2];
if (!transformer) {
    console.error(`Usage: node test [transformer]`);
    process.exit(1);
}
if (!fs.existsSync(TRANSFORMERS_DIR + transformer)) {
    console.error(`Unknown transformer: "${transformer}"`);
    process.exit(1);
}
let tests = process.argv.slice(3).map(t => t + '.test.js');
if (!tests.length)
    tests = fs.readdirSync(TRANSFORMERS_DIR + transformer + '/test/');

const state = { changes: 0 };
const plugin = require(TRANSFORMERS_DIR + transformer)(state);

// Transform in a loop until no changes
let changed = true;
let cycle = 0;
const maxCycles = 10;

for (const test of tests) {
    let currentCode = fs.readFileSync(TRANSFORMERS_DIR + transformer + '/test/' + test, 'utf-8');
    while (changed && cycle++ < maxCycles) {
        const { code } = babel.transformSync(currentCode, {
            plugins: [plugin],
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
    console.log(codeFrameColumns(currentCode, {}, {
        highlightCode: true
    }));
}