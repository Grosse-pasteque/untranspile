const { declare } = require("@babel/helper-plugin-utils");
const t = require("@babel/types");

function isNullishCheck(node, refName) {
    if (!t.isLogicalExpression(node)) return false;
    if (node.operator !== "||") return false;
    const left = node.left;
    const right = node.right;
    if (
        !(
            t.isBinaryExpression(left) &&
            (left.operator === "===" || left.operator === "==") &&
            ((t.isIdentifier(left.left, { name: refName }) && t.isNullLiteral(left.right)) ||
                (t.isNullLiteral(left.left) && t.isIdentifier(left.right, { name: refName })))
        )
    )
        return false;
    if (
        !(
            t.isBinaryExpression(right) &&
            (right.operator === "===" || right.operator === "==") &&
            ((t.isIdentifier(right.left, { name: refName }) &&
                t.isUnaryExpression(right.right, { operator: "void" })) ||
                (t.isUnaryExpression(right.left, { operator: "void" }) &&
                    t.isIdentifier(right.right, { name: refName })))
        )
    )
        return false;
    return true;
}

function unwrapNullishConditional(path) {
    if (!path.isConditionalExpression()) return null;
    const { node } = path;
    // Check pattern: test is nullish check on some temp var
    if (
        !t.isLogicalExpression(node.test) ||
        node.test.operator !== "||" ||
        !(
            (t.isBinaryExpression(node.test.left) && (node.test.left.operator === "===" || node.test.left.operator === "==")) &&
            (t.isBinaryExpression(node.test.right) && (node.test.right.operator === "===" || node.test.right.operator === "=="))
        )
    )
        return null;

    // Extract temp var name used in nullish check
    let refName = null;
    const tryExtract = (expr) => {
        if (t.isBinaryExpression(expr)) {
            if (t.isIdentifier(expr.left)) return expr.left.name;
            if (t.isIdentifier(expr.right)) return expr.right.name;
        }
        return null;
    };
    refName = tryExtract(node.test.left) || tryExtract(node.test.right);
    if (!refName) return null;

    // Alternate expression uses the temp var and is where chain continues
    return {
        refName,
        expr: node.alternate,
    };
}

function reconstructChain(node, refName) {
    // node should be like _tmp.prop or _tmp()
    if (t.isIdentifier(node, { name: refName })) {
        // This is base case, return original object
        return null; // We need original base, so return null
    }

    if (t.isMemberExpression(node)) {
        if (
            t.isIdentifier(node.object, { name: refName }) ||
            t.isMemberExpression(node.object) ||
            t.isCallExpression(node.object)
        ) {
            const objChain = reconstructChain(node.object, refName);
            if (objChain === null) {
                // means node.object is the temp var, so start optional chain from here
                return t.optionalMemberExpression(
                    t.identifier(refName).name === node.object.name ? node.object : objChain || node.object,
                    node.property,
                    node.computed,
                    true
                );
            } else {
                return t.optionalMemberExpression(objChain, node.property, node.computed, true);
            }
        }
    }

    if (t.isCallExpression(node)) {
        if (t.isIdentifier(node.callee, { name: refName })) {
            return t.optionalCallExpression(t.identifier(refName), node.arguments, true);
        }
        if (
            t.isMemberExpression(node.callee) &&
            t.isIdentifier(node.callee.property, { name: "call" }) &&
            node.arguments.length > 0
        ) {
            const callObj = node.callee.object;
            const context = node.arguments[0];
            const args = node.arguments.slice(1);
            const calleeChain = reconstructChain(callObj, refName);
            if (calleeChain === null) {
                // Base case: callee is the temp var itself
                return t.optionalCallExpression(t.identifier(refName), args, true);
            }
            return t.optionalCallExpression(calleeChain, args, true);
        }
        const newCallee = reconstructChain(node.callee, refName);
        if (newCallee === null) return null;
        return t.callExpression(newCallee, node.arguments);
    }

    if (t.isIdentifier(node)) {
        if (node.name === refName) return null;
        return node;
    }

    return null;
}

module.exports = declare((api) => {
    api.assertVersion(7);

    return {
        name: "reverse-transform-optional-chaining",
        visitor: {
            ConditionalExpression(path) {
                const unwrapped = unwrapNullishConditional(path);
                if (!unwrapped) return;
                const { refName, expr } = unwrapped;
                const reconstructed = reconstructChain(expr, refName);
                if (reconstructed) {
                    path.replaceWith(reconstructed);
                }
            },
        },
    };
});