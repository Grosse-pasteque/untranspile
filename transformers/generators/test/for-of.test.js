/*
function* test(i) {
    yield "start";
    for (let p of [1,2,3])
        yield i;
    yield "end";
}
*/

function test(i) {
    var _i, _a, p;
    return tslib_1.__generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, "start"];
            case 1:
                _b.sent();
                _i = 0, _a = [1, 2, 3];
                _b.label = 2;
            case 2:
                if (!(_i < _a.length)) return [3 /*break*/, 5];
                p = _a[_i];
                return [4 /*yield*/, i];
            case 3:
                _b.sent();
                _b.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [4 /*yield*/, "end"];
            case 6:
                _b.sent();
                return [2 /*return*/];
        }
    });
}