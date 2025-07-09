const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const generate = require("@babel/generator").default;
const t = require("@babel/types");

const isUndefined = node => t.isIdentifier(node, { name: "undefined" }) || t.isUnaryExpression(node, { operator: "void" }) && t.isNumericLiteral(node.argument);
const isNull = node => t.isNullLiteral(node)
const isAttribute = (node, name) => t.isIdentifier(node, { name }) || t.isStringLiteral()

function reverseOptionalChaining(code) {
    const ast = parser.parse(code, {
        sourceType: "module"
    });

    traverse(ast, {
        ConditionalExpression(path) {
            const { test, consequent, alternate } = path.node;

            if (
                isUndefined(consequent)
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
                            && isUndefined(binRight)
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
    });
    return generate(ast).code;
}

function buildOptionalChain(root, props) {
    let expr = root;
    for (const { type, arg, optional } of props) expr = (
        type == "call" ? t.OptionalCallExpression(expr, arg, optional) :
        type == "member" ? t.OptionalMemberExpression(expr, arg, !t.isIdentifier(arg), optional) :
        null
    );
    return expr;
}

console.log('-'.repeat(100));
console.log(reverseOptionalChaining(`
var _a$b, _a$b$c;
let a = "";
const result = a === null || a === void 0 || (_a$b$c = (_a$b = a.b()).c) === null || _a$b$c === void 0 ? void 0 : _a$b$c.call(_a$b)[0];
`));
console.log('-'.repeat(100));
console.log(reverseOptionalChaining(`
function() {
    var n, t;
    return this.context.getModelData("truths", "playerUseUmaContainer", !1) ? (0,
    o.jsx)("div", {
        className: "uma",
        id: "uma",
        role: "region",
        "data-uia": "uma-area",
        children: this.forceUma() ? (0,
        o.jsx)(c, {
            supportsModal: !0,
            supportsBanner: !1,
            redirectOnClose: d.default ? null : l.default.browse.makePath(),
            model: null === (n = this.props) || void 0 === n || null === (n = n.error) || void 0 === n ? void 0 : n.alert[0]
        }) : (0,
        o.jsx)(c, {
            supportsModal: !0,
            supportsBanner: !1,
            playbackProxiedOnly: !0,
            redirectOnClose: d.default ? null : l.default.browse.makePath()
        })
    }, "uma-area") : (null === (t = this.props) || void 0 === t || null === (t = t.error) || void 0 === t || null === (t = t.alert) || void 0 === t ? void 0 : t[0]) === void 0 ? null : (0,
    o.jsx)(u, {
        supportsModal: !0,
        supportsBanner: !1,
        model: this.props.error.alert[0],
        redirectOnClose: d.default ? null : l.default.browse.makePath()
    })
}
`));