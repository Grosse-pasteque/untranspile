const t = require("@babel/types");
const { flattenLogical, isReferenceLike } = require('../../includes/utils');


function rebuildOptionalChain([ { node: root }, ...members ]) {
    let expr = t.cloneNode(root);
    for (let { node, optional } of members) {
        if (t.isMemberExpression(node)) {
            expr = t.OptionalMemberExpression(
                expr,
                t.cloneNode(node.property),
                node.computed,
                optional
            );
        } else if (t.isCallExpression(node)) {
            const args = node.arguments.map(arg => t.cloneNode(arg));
            if (
                t.isOptionalMemberExpression(expr) &&
                t.isIdentifier(expr.property, { name: 'call' }) &&
                node.arguments.length > 0
            ) {
                optional = true;
                expr = expr.object;
                args.splice(0, 1);
            }
            expr = t.OptionalCallExpression(expr, args, optional);
        }
    }
    return expr;
}

module.exports = function(state) {
    return {
        name: "optional-chaining",
        visitor: {
            "ConditionalExpression|LogicalExpression"(path) {
                let parts, end;
                const isLogicalExpression = t.isLogicalExpression(path.node, { operator: "||" });
                if (isLogicalExpression) {
                    if (path.node.operator != "||") return;
                    parts = flattenLogical(path.node);
                    end = parts.pop();
                } else {
                    const { test, consequent, alternate } = path.node;
                    if (!t.isIdentifier(consequent, { name: "undefined" })) return;

                    parts = t.isLogicalExpression(test, { operator: "||" })
                        ? flattenLogical(test)
                        : [test];
                    end = alternate;
                }
                const chain = [];
                for (const part of parts) {
                    if (
                        !t.isBinaryExpression(part, { operator: "==" }) ||
                        !t.isNullLiteral(part.right)
                    ) return;
                    chain.push(part.left);
                }
                chain.push(t.AssignmentExpression("=", t.Identifier("_"), end));

                const members = [];
                let step = null;
                for (const member of chain) {
                    const toProcess = [];
                    if (!step && isReferenceLike(member)) {
                        step = member;
                        members.push({ node: member, optional: true });
                    } else if (
                        t.isAssignmentExpression(member, { operator: '=' }) &&
                        isReferenceLike(member.left)
                    ) {
                        const innerMembers = [];
                        let node = member.right;
                        while (true) {
                            innerMembers.unshift({ node, optional: false });
                            // if (t.isIdentifier(node, ))
                            node = t.isCallExpression(node)
                                ? node.callee
                                : node.object;
                            if (t.isAssignmentExpression(node, { operator: "=" }))
                                node = node.right;
                            if (!(
                                t.isCallExpression(node) ||
                                t.isMemberExpression(node)
                            )) break;
                        }
                        if (step && !t.isNodesEquivalent(node, step)) return;
                        if (!step && t.isIdentifier(node)) innerMembers.unshift({ node, optional: false });

                        innerMembers[0].optional = !!step;
                        members.push(...innerMembers);
                        step = member.left;
                    } else return;
                }
                state.changes++;
                path.replaceWith(rebuildOptionalChain(members));
            }
        }
    }
};