/*
function* test(i) {
    yield "start";
    for (let k=3;k > 0;k--)
        for (let j = 0; j < 10;j += 2)
            yield i;
    yield "end";
}
*/

function test(i) {
    var k, j;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, "start"];
            case 1:
                _a.sent();
                k = 3;
                _a.label = 2;
            case 2:
                if (!(k > 0)) return [3 /*break*/, 7];
                j = 0;
                _a.label = 3;
            case 3:
                if (!(j < 10)) return [3 /*break*/, 6];
                return [4 /*yield*/, i];
            case 4:
                _a.sent();
                _a.label = 5;
            case 5:
                j += 2;
                return [3 /*break*/, 3];
            case 6:
                k--;
                return [3 /*break*/, 2];
            case 7: return [4 /*yield*/, "end"];
            case 8:
                _a.sent();
                return [2 /*return*/];
        }
    });
}