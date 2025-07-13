const t = require('@babel/types');
const { isReferenceLike, flattenLogical } = require('../includes/utils');

module.exports = function(state) {
    return {
        name: "no-document-all",
        visitor: {
            LogicalExpression(path) {
                let changed = false;
                const { node } = path;
                const { operator } = node;

                // Only handle || or &&
                if (operator != '||' && operator != '&&') return;

                const parts = flattenLogical(node, operator);
                let n = parts.length - 1;
                for (let i = 0; i < n; i++) {
                    const left = parts[i],
                          right = parts[i + 1];
                    if (
                        !t.isBinaryExpression(left) ||
                        !t.isBinaryExpression(right) ||
                        left.operator != '===' && left.operator != '!==' ||
                        right.operator != '===' && right.operator != '!=='
                    ) continue;

                    let leftId, rightId;
                    if (
                        t.isIdentifier(left.right, { name: 'undefined' }) && t.isNullLiteral(right.right) ||
                        t.isNullLiteral(left.right) && t.isIdentifier(right.right, { name: 'undefined' })
                    ) {
                        leftId = left.left;
                        rightId = right.left;
                    } else if (
                        t.isIdentifier(left.left, { name: 'undefined' }) && t.isNullLiteral(right.left) ||
                        t.isNullLiteral(left.left) && t.isIdentifier(right.left, { name: 'undefined' })
                    ) {
                        leftId = left.right;
                        rightId = right.right;
                    } else continue;

                    if (
                        !isReferenceLike(rightId) || // NOTE: Not mandatory !
                        !(
                            t.isAssignmentExpression(leftId, { operator: "=" }) && t.isNodesEquivalent(rightId, leftId.left) ||
                            t.isNodesEquivalent(rightId, leftId)
                        )
                    ) continue;

                    parts[i] = t.BinaryExpression('==', t.cloneNode(leftId), t.NullLiteral());
                    changed = true;
                    parts.splice(i + 1, 1);
                    n--;
                }
                if (changed && parts.length > 0) {
                    state.changes++;
                    path.replaceWith(parts.reduce((acc, expr) => t.LogicalExpression(operator, acc, t.cloneNode(expr))));
                }
            }
        }
    };
};