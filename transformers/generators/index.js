const m = require('@codemod/matchers');
const t = require('@babel/types');

const generatorCases = m.capture();
const generatorIdentifier = m.capture();
const generatorContext = m.capture(m.identifier());
const generatorContextLabel = m.memberExpression(
    m.fromCapture(generatorContext),
    m.identifier('label')
);
const generator = m.callExpression(generatorIdentifier, [
    m.thisExpression(),
    m.functionExpression(
        null,
        [generatorContext],
        m.blockStatement([
            m.switchStatement(generatorContextLabel, generatorCases)
        ]),
        false,
        false
    )
]);
const generatorJumpNext = m.capture();
const generatorJump = m.expressionStatement(
    m.assignmentExpression('=',
        generatorContextLabel,
        m.numericLiteral(generatorJumpNext)
    )
);
const generatorTryJump = m.capture(m.arrayExpression([
    m.or(m.numericLiteral(), null),
    m.or(m.numericLiteral(), null),
    m.or(m.numericLiteral(), null),
    m.or(m.numericLiteral(), null)
]));
// <generatorContext>.trys.push([TryScope, CatchScope, FinallyScope, NextScope])
const generatorTry = m.expressionStatement(
    m.callExpression(
        m.memberExpression(
            m.memberExpression(
                m.fromCapture(generatorContext),
                m.identifier('trys')
            ),
            m.identifier('push')
        ),
        [generatorTryJump]
    )
);
/*
const generatorNextMode = m.capture();
const generatorNextValue = m.capture();
const generatorNextReturn = m.capture(m.or(m.arrayExpression([
    m.numericLiteral(generatorNextMode),
    generatorNextValue
]), m.arrayExpression([
    m.numericLiteral(generatorNextMode)
])));
*/
const generatorNextReturn = m.capture(m.or(m.arrayExpression([
    m.numericLiteral(),
    m.anything()
]), m.arrayExpression([
    m.numericLiteral()
])));
const generatorNext = m.capture(m.returnStatement(generatorNextReturn));
const generatorBranchTest = m.capture();
const generatorBranch = m.ifStatement(
    generatorBranchTest,
    generatorNext,
    null
);

const generatorSent = m.callExpression(
    m.memberExpression(
        m.fromCapture(generatorContext),
        m.identifier('sent')
    ),
    []
);

module.exports = function(state) {
    return {
        name: "generators",
        visitor: {
            ReturnStatement(path) {
                if (!generator.match(path.node.argument) ||
                    !generatorCases.current.every((c, value) => t.isNumericLiteral(c.test, { value }))
                ) return;

                const func = path.parentPath.parent;
                if (
                    !t.isFunctionExpression(func) &&
                    !t.isFunctionDeclaration(func)
                ) {
                    // throw new Error("Generator isnt a function");
                    return;
                }
                func.generator = true;

                const cases = generatorCases.current.map(c => c.consequent);
                path.replaceWithMultiple(build(0, cases[0], cases));
                cleanup(path.parentPath)
                state.changes++;
            }
        }
    };
};

/* TODO: maybe use this structure could be faster I'll see later

path.get("argument.arguments.1.body")

casePath.traverse({
    "Function|ExpressionStatement|Expression"(inner) {
        inner.skip();
    },
    ReturnStatement(inner) {
        // go from here
    }
});

*/
function build(label, lines, cases) {
    if (!lines || !Array.isArray(lines))
        throw new Error("Invalid input");
    const xxx = "LABEL " + label + ' \u001b[30m' + Math.random() + '\u001b[0m';
    console.group(xxx);
    let body = [];
    while (lines.length) {
        const line = lines.shift();
        if (generatorJump.match(line)) { // CONTINUE
            // IGNORED
            if (generatorJumpNext.current !== label + 1)
                throw new Error(`Invalid CONTINUE jump: ${label + 1} !== ${generatorJumpNext.current}`);
            // console.log("JUMP", generatorJumpNext.current);
        } else if (generatorNext.match(line)) {
            console.log("NEXT")
            const [{ value: mode }, value = null] = generatorNextReturn.current.elements;
            switch (mode) {
                case 0:
                case 1: // SENT
                case 6: // NORMAL
                case 7: // ENDFINALLY
                    throw new Error("Generator modes: 0, 1, 6, 7 aren't yet supported...");
                case 2: // RETURN
                    body.push(t.returnStatement(value));
                    break;
                case 3: // BREAK
                    if (t.isNumericLiteral(value) && cases[value.value]) {
                        body.push(...build(value.value, cases[value.value], cases));
                    } else {
                        throw new Error("Unknown BREAK location");
                    }
                    break;
                case 4: // YIELD
                    body.push(
                        t.expressionStatement(t.yieldExpression(value)),
                        ...build(label + 1, cases[label + 1], cases)
                    );
                    break;
                case 5: // YIELD*
                    if (
                        t.isCallExpression(value) &&
                        value.arguments.length == 1 /* &&
                        isValuesHelper(value.callee) */
                    ) {
                        body.push(
                            t.expressionStatement(t.yieldExpression(value.arguments[0], true)),
                            ...build(label + 1, cases[label + 1], cases)
                        );
                    } else {
                        throw new Error("Missing YIELD* helper __values");
                    }
                    break;
            }
        } else if (generatorBranch.match(line)) {
            let test, inner;
            if (
                t.isUnaryExpression(generatorBranchTest.current, { operator: '!', prefix: true }) &&
                // NOTE: may cause problem later if we don't check
                generatorNextReturn.current.elements[0].value === 3
            ) {
                console.log("BREAK");
                test = generatorBranchTest.current.argument;
                inner = lines;
                lines = [generatorNext.current];
            } else {
                console.log("RETURN");
                inner = [generatorNext.current];
                test = generatorBranchTest.current;
            }
            body.push(t.ifStatement(
                t.cloneNode(test),
                t.blockStatement(build(label, inner, cases))
            ));
        }  else if (generatorTry.match(line)) {
            console.log("TRY", generatorTryJump.current.map(n => n?.value));
        }  else {
            console.log("EXPR", line.type);
            body.push(line);
        }
    }
    console.groupEnd(xxx);
    return body;
}

function cleanup(path) {
    // if (!t.isBlockStatement(path)) // Not mandatory
    //     throw new Error("Not block statement");
    const yieldsPaths = [];
    path.traverse({
        YieldExpression(path) {
            if (!t.isExpressionStatement(path.parent))
                throw new Error("Not expression statement yield");
            yieldsPaths.push(path.parentPath);
        },
        "FunctionExpression|FunctionDeclaration|ArrowFunctionExpression"(inner) {
            inner.skip();
        },
        ClassMethod(inner) {
            inner.get('body').skip();
            inner.get('params').forEach(p => p.skip());
        },
        ObjectMethod(inner) {
            inner.get('body').skip();
        },
        ClassProperty(inner) {
            inner.get('value').skip();
        }
    });
    yieldsPaths.forEach(yieldPath => yieldPath.nextPathSibling.traverse({
        CallExpression(sentPath) {
            if (!generatorSent.match(sentPath.node))
                return;
            sentPath.replaceWith(t.cloneNode(yieldPath.node));
            yieldPath.remove();
            sentPath.stop();
        }
    }));
    const body = path.node.body;
    if (t.isReturnStatement(body[body.length - 1], { argument: null }))
        body.splice(-1, 1);
}