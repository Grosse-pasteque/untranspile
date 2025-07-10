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

function getRootMember(node) {
    while (
        node.type == 'MemberExpression' || 
        node.type == 'OptionalMemberExpression'
    ) node = node.object;
    return node;
}


module.exports = { isIrrelevant, isReferenceLike, flattenLogical, getRootMember };
