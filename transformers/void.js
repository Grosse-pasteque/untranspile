const { isIrrelevant } = require('../includes/utils');

module.exports = function(state) {
    return {
        name: "void",
        visitor: {
            UnaryExpression(path) {
                if (
                    path.node.type == 'UnaryExpression' &&
                    path.node.operator == 'void' &&
                    isIrrelevant(path.node.argument)
                ) {
                    state.changes++;
                    path.replaceWith({
                        type: 'Identifier',
                        name: 'undefined'
                    });
                }
            }
        }
    };
};