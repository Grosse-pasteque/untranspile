const t = require('@babel/types');
const { flattenLogical } = require('../../includes/utils');

module.exports = function(state) {
    return {
        name: "conditional-folding",
        visitor: {
            IfStatement(path) {
                const conditions = [];
                let current = path.node;

                while (current.alternate == null) {
                    conditions.push(current.test);

                    const cons = current.consequent;
                    if (t.isIfStatement(cons)) {
                        current = cons;
                    } else if (
                        t.isBlockStatement(cons) &&
                        cons.body.length == 1 &&
                        t.isIfStatement(cons.body[0])
                    ) {
                        current = cons.body[0];
                    } else {
                        current = cons;
                        break;
                    }
                }
                if (conditions.length < 2) return;

                const newTest = [];
                for (const condition of conditions)
                    newTest.push(...flattenLogical(condition, '&&'))
                const mergedTest = newTest.map(node => t.cloneNode(node, true)).reduce((a, b) => t.logicalExpression("&&", a, b));
                path.replaceWith(t.ifStatement(mergedTest, t.cloneNode(current)));
                state.changes++;
            }
        }
    };
};