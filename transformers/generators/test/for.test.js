/*
function* test(i) {
    yield "start";
    for (let k=3;k > 0;k--)
        yield i;
    yield "end";
}
*/

function test(i) {
    var k;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, "start"];
            case 1:
                _a.sent();
                k = 3;
                _a.label = 2;
            case 2:
                if (!(k > 0)) return [3 /*break*/, 5];
                return [4 /*yield*/, i];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                k--;
                return [3 /*break*/, 2];
            case 5: return [4 /*yield*/, "end"];
            case 6:
                _a.sent();
                return [2 /*return*/];
        }
    });
}