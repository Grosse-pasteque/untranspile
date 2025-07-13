const { get, list } = require("@babel/helpers");
const { isNodesEquivalentCustom } = require('../includes/utils');

const helpers = list.map(name => {
    const { ast } = get(name);
    return { name, ast };
});

module.exports = function(state) {
    return {
        name: "remove-helpers",
        visitor: {}
    };
};