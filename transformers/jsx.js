const t = require('@babel/types');

module.exports = function(state) {
    return {
        name: "jsx",
        visitor: {
            CallExpression(path) {
                const { callee, arguments: args } = path.node;
                if (
                    t.isMemberExpression(callee) &&
                    t.isIdentifier(callee.object, { name: "o" }) &&
                    t.isIdentifier(callee.property, { name: "jsx" })
                ) {
                    const [tag, props, key] = args;
                    console.log(props.properties)

                    const opening = t.JSXOpeningElement(
                        t.JSXIdentifier(tag.value || tag.name),
                        Object.entries(props.properties || {}).map(([k, v]) =>
                            t.JSXAttribute(t.JSXIdentifier(k.name ?? k.value), t.JSXExpressionContainer(v.value))
                        ),
                        true
                    );

                    const element = t.JSXElement(opening, null, [], true);
                    path.replaceWith(element);
                }
            }
        }
    };
};