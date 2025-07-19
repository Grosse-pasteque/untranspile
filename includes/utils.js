const t = require('@babel/types');
const { NodePath } = require('@babel/traverse');

Object.defineProperties(NodePath.prototype, {
    nextPathSibling: {
        get() {
            const container = this.container;
            const key = this.key;

            if (!Array.isArray(container)) return null;

            const nextIndex = key + 1;
            if (nextIndex >= container.length) return null;

            return this.getSibling(nextIndex);
        }
    },
    previousPathSibling: {
        get() {
            const container = this.container;
            const key = this.key;

            if (!Array.isArray(container)) return null;

            const prevIndex = key - 1;
            if (prevIndex < 0) return null;

            return this.getSibling(prevIndex);
        }
    }
});

function isIrrelevant(node) {
    if (!node) return false;

    switch (node.type) {
        case "StringLiteral":
        case "NumericLiteral":
        case "BooleanLiteral":
        case "NullLiteral":
        case "BigIntLiteral":
        case "RegExpLiteral":
        case "Identifier":
        case "ThisExpression":
        case "Super":
            return true;

        case "TemplateLiteral":
            return node.expressions.length === 0;

        default:
            return false;
    }
}

function isReferenceLike(node) {
    if (!node) return false;

    switch (node.type) {
        case 'Identifier':
        case 'ThisExpression':
        case 'Super':
            return true;

        default:
            return false;
    }
}

function flattenLogical(node, operator = "||") {
    const list = [];

    function recurse(node) {
        if (node.type == "LogicalExpression" && node.operator == operator) {
            recurse(node.left);
            recurse(node.right);
        } else {
            list.push(node);
        }
    }

    recurse(node);
    return list;
}

function flattenMember(node) {
    const parts = [];
    while (
        node.type === 'MemberExpression' || 
        node.type === 'OptionalMemberExpression'
    ) {
        parts.unshift(node.property);
        node = node.object;
    }
    parts.unshift(node);
    return parts;
}

function isNodesEquivalentCustom(a, b, check) {
    if (check && check(a, b)) {
        return true;
    }
    if (typeof a !== "object" || typeof b !== "object" || a == null || b == null) {
        return a === b;
    }
    if (a.type !== b.type) {
        return false;
    }
    const fields = Object.keys(t.NODE_FIELDS[a.type] || a.type);
    const visitorKeys = t.VISITOR_KEYS[a.type];
    for (const field of fields) {
        const val_a = a[field];
        const val_b = b[field];
        if (typeof val_a !== typeof val_b) {
            return false;
        }
        if (val_a == null && val_b == null) {
            continue;
        } else if (val_a == null || val_b == null) {
            return false;
        }
        if (Array.isArray(val_a)) {
            if (!Array.isArray(val_b)) {
                return false;
            }
            if (val_a.length !== val_b.length) {
                return false;
            }
            for (let i = 0; i < val_a.length; i++) {
                if (!isNodesEquivalentCustom(val_a[i], val_b[i], check)) {
                    return false;
                }
            }
            continue;
        }
        if (typeof val_a === "object" && !(visitorKeys != null && visitorKeys.includes(field))) {
            for (const key of Object.keys(val_a)) {
                if (val_a[key] !== val_b[key]) {
                    return false;
                }
            }
            continue;
        }
        if (!isNodesEquivalentCustom(val_a, val_b, check)) {
            return false;
        }
    }
    return true;
}

module.exports = {
    isIrrelevant,
    isReferenceLike,
    flattenLogical,
    flattenMember,
    isNodesEquivalentCustom
};