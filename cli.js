#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const minimist = require('minimist');

const PLUGINS_DIR = './plugins/';

const args = minimist(process.argv.slice(2), {
    alias: {
        o: 'output',
        p: 'plugins'
    },
    default: {
        plugins: '*'
    }
});

const inputFile = args._[0];
if (!inputFile) {
    console.error('Usage: node reverse-babel input.js [-o output.js] [-p plugin1,plugin2,...]');
    process.exit(1);
}

const source = fs.readFileSync(inputFile, 'utf-8');

// Resolve plugin list
const pluginNames = args.plugins == '*' ? fs.readdirSync(PLUGINS_DIR) : args.plugins.split(',');
const selectedPlugins = pluginNames.map(name => require(PLUGINS_DIR + name));
const state = { changes: 0 };
const plugins = selectedPlugins.map(plugin => plugin(state));

// Transform in a loop until no changes
let changed = true;
let cycle = 0;
const maxCycles = plugins.length == 1 ? 1 : 10;
let currentCode = source;

while (changed && cycle++ < maxCycles) {
    const { code, metadata } = babel.transformSync(currentCode, {
        plugins,
        configFile: false
    });
    changed = state.changes > 0;
    currentCode = code;
    console.log(`Cycle ${maxCycles}: ${state.changes} changes`);
    state.changes = 0;
}

const output = args.output;
if (output) {
    fs.writeFileSync(output, currentCode, 'utf-8');
} else {
    console.log(currentCode);
}