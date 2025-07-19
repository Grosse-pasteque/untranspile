const t = require('@babel/types');
const { get, list } = require("@babel/helpers");
const { isNodesEquivalentCustom } = require('../includes/utils');
const helpersGenerated = require('@babel/helpers/lib/helpers-generated').default;

const helpers = [];
for (const [{ ast, metadata }] of Object.entries(helpersGenerated)) {
    if (!t.isFunctionDeclaraction(ast)) continue;
    helpers.push()
}

// TODO: cache codemod's trees helpers with version control 
module.exports = function(state) {
    return {
        name: "remove-helpers",
        visitor: {
            // FunctionDeclaration(path) {
            //     isNodesEquivalentCustom(path.node)
            // }
        }
    };
};