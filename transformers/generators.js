const m = require('@codemod/matchers');
const t = require('@babel/types');

const generatorCases = m.capture();
const generatorIdentifier = m.capture(m.identifier());
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
const generatorTryJump = m.capture([
    m.or(m.numericLiteral(), null),
    m.or(m.numericLiteral(), null),
    m.or(m.numericLiteral(), null),
    m.or(m.numericLiteral(), null)
]);
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
const generatorNextReturn = m.capture(m.or(m.arrayExpression([
    m.numericLiteral(),
    m.anything()
]), m.arrayExpression([
    m.numericLiteral()
])));
const generatorNext = m.capture(m.returnStatement(generatorNextReturn));
const generatorBreakTest = m.capture();
const generatorBreak = m.ifStatement(
    m.unaryExpression('!', generatorBreakTest, true),
    generatorNext,
    null
);

module.exports = function(state) {
    return {
        name: "generators",
        visitor: {
            ReturnStatement(path) {
                if (!generator.match(path.node.argument) ||
                    !generatorCases.current.every((c, value) => t.isNumericLiteral(c.test, { value }))
                ) return;

                console.log(generatorIdentifier.current.name);
                const cases = generatorCases.current.map(c => c.consequent);
                path.replaceWithMultiple(build(0, cases[0], cases));
            }
        }
    };
};

function build(label, lines, cases) {
    if (!lines || !Array.isArray(lines))
        throw "Invalid input";
    const xxx = "LABEL " + label + ' \u001b[30m' + Math.random() + '\u001b[0m';
    console.group(xxx);
    let body = [];
    while (lines.length) {
        const line = lines.shift();
        /*if (generatorJump.match(line)) {
            // IGNORED
            // generatorJumpNext.current == label + 1
            // console.log("JUMP", generatorJumpNext.current);
        } else */if (generatorNext.match(line)) {
            console.log("NEXT")
            const [{ value: mode }, value = null] = generatorNextReturn.current.elements;
            switch (mode) {
                case 0:
                case 1: // SENT
                case 6: // NORMAL
                case 7: // ENDFINALLY
                    throw "Generator modes: 0, 1, 6, 7 aren't yet supported...";
                case 2: // RETURN
                    body.push(t.returnStatement(value));
                    break;
                case 3: // BREAK
                    if (t.isNumericLiteral(value) && cases[value.value]) {
                        body.push(...build(value.value, cases[value.value], cases));
                    } else {
                        throw "Unknown BREAK location"
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
                        throw "Missing YIELD* helper __values";
                    }
                    break;
            }
        } else if (generatorBreak.match(line)) {
            console.log("BREAK");
            const consequent = generatorNext.current; // !! get's overwritten when build recalled
            body.push(t.ifStatement(
                t.cloneNode(generatorBreakTest.current),
                t.blockStatement(build(label, lines, cases))
            ));
            lines = [consequent];
        }/* else if (generatorTry.match(line)) {
            console.log("TRY", generatorTryJump.current.map(n => n?.value));
        } */else {
            console.log("EXPR", line.type)
            body.push(line);
        }
    }
    console.groupEnd(xxx);
    return body;
}