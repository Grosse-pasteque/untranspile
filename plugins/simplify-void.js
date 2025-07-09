const ignored = [
    'StringLiteral',
    'NumericLiteral',
    'BooleanLiteral',
    'NullLiteral',
    'BigIntLiteral',
    'RegExpLiteral'
];

module.exports = function (state) {
    return {
        name: "simplify-void",
        visitor: {
            UnaryExpression(path) {
                if (
                    path.node.type == 'UnaryExpression' &&
                    path.node.operator == 'void' && (
                        ignored.includes(path.node.argument.type)
                        || path.node.argument.type == 'TemplateLiteral' && !node.expressions.length
                    )
                ) {
                    state.changes++;
                    path.replaceWith({
                        type: 'Identifier',
                        name: 'undefined'
                    });
                }
            }
        }
    }
};