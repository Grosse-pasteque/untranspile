const { isIrrelevant } = require('../includes/utils');

module.exports = function(state) {
    return {
        name: "unwrap-parenthesis",
        visitor: {
            SequenceExpression(path) {
                if (path.node.expressions.length == 2 && isIrrelevant(path.node.expressions[0])) {
                    state.changes++;
                    path.replaceWith(path.node.expressions[1]);
                }
            }
        }
    };
};