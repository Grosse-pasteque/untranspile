const t = require("@babel/types");
const { getRootMember } = require('../includes/utils');


function buildOptionalChain(root, props) {
    let expr = root;
    for (const { type, arg, optional } of props) expr = (
        type == "call" ? t.OptionalCallExpression(expr, arg, optional) :
        type == "member" ? t.OptionalMemberExpression(expr, arg, !t.isIdentifier(arg), optional) :
        null
    );
    return expr;
}

module.exports = function (state) {
    return {
        name: "simplify-optional-chaining",
        visitor: {
            ConditionalExpression(path) {
                const { test, consequent, alternate } = path.node;

                if (
                    t.isIdentifier(consequent, { name: "undefined" })
                    && t.isLogicalExpression(test, { operator: "||" })
                ) {
                    const members = [];
                    let step;
                    if (t.isMemberExpression(alternate)) {
                        members.push({
                            type: "member",
                            arg: alternate.property,
                            optional: true
                        });
                        step = alternate.object.name;
                    } else if (
                        t.isCallExpression(alternate)
                        && t.isMemberExpression(alternate.callee)
                        && t.isIdentifier(alternate.callee.property, { name: "call" })
                        && t.isIdentifier(alternate.callee.object)
                        && alternate.arguments.length >= 1
                        && t.isIdentifier(alternate.arguments[0])
                    ) {
                        members.push({
                            type: "call",
                            arg: alternate.arguments.slice(1),
                            optional: true
                        });
                        step = alternate.callee.object.name;
                    }
                    let expr = test;
                    let mode = 0;
                    // 0 -> void 0
                    // 1 -> null
                    while (t.isLogicalExpression(expr, { operator: "||" })) {
                        const { left, right } = expr;
                        if (t.isBinaryExpression(right, { operator: "===" })) {
                            const { left: binLeft, right: binRight } = right;
                            if (
                                mode
                                && t.isNullLiteral(binRight)
                                && t.isAssignmentExpression(binLeft, { operator: "=" })
                                && t.isIdentifier(binLeft.left, { name: step })
                            ) {
                                const assignedName = binLeft.left.name;
                                const assignedExpr = binLeft.right;

                                const memberProps = [];
                                let current = assignedExpr;
                                while (true) {
                                    if (t.isMemberExpression(current)) {
                                        if (t.isIdentifier(current.property)
                                            && current.property.name == "call"
                                        ) {

                                        }
                                        memberProps.unshift({
                                            type: "member",
                                            arg: current.property,
                                            optional: false
                                        });
                                        current = current.object;
                                    } else if (t.isCallExpression(current)) {
                                        if (
                                            t.isMemberExpression(current.callee)
                                            && t.isIdentifier(current.callee.property, { name: "call" })
                                            && t.isIdentifier(current.callee.object)
                                            && current.arguments.length >= 1
                                            && t.isIdentifier(current.arguments[0])
                                        ) {
                                            memberProps.unshift({
                                                type: "call",
                                                arg: current.arguments.slice(1),
                                                optional: true // doesnt really matter since it will get overwritted 100%
                                            });
                                            current = current.callee.object;
                                        } else {
                                            memberProps.unshift({
                                                type: "call",
                                                arg: current.arguments,
                                                optional: false
                                            });
                                            current = current.callee;
                                        }
                                    } else break;
                                }
                                if (t.isIdentifier(current)) {
                                    step = current.name;
                                    memberProps[0].optional = true;
                                    members.unshift(...memberProps);
                                } else return;
                            } else if (
                                !mode
                                && t.isIdentifier(binRight, { name: "undefined" })
                                && t.isIdentifier(binLeft)
                            ) {
                                if (step && step != binLeft.name)
                                    return;
                            } else {
                                return;
                            }
                            mode = !mode;
                        }
                        expr = left;
                    }
                    if (
                        mode
                        && t.isBinaryExpression(expr, { operator: "===" })
                        && t.isNullLiteral(expr.right)
                        && t.isIdentifier(expr.left, { name: step })
                    ) {
                        path.replaceWith(buildOptionalChain(expr.left, members));
                    }
                }
            }
        }
    }
};