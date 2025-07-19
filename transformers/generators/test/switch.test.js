/*
function* test(i) {
    yield "start";
    switch (i) {
        case 0:
            return 0
        case 1:
            yield 1;
            i = 3;
        case 2:
            yield 2;
            break;
        case 3:
            yield 3;
            break;
        default:
            yield -1;
    }
    yield "end";
}
*/

function test(i) {
    var _a;
    return tslib_1.__generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, "start"];
            case 1:
                _b.sent();
                _a = i;
                switch (_a) {
                    case 0: return [3 /*break*/, 2];
                    case 1: return [3 /*break*/, 3];
                    case 2: return [3 /*break*/, 5];
                    case 3: return [3 /*break*/, 7];
                }
                return [3 /*break*/, 9];
            case 2: return [2 /*return*/, 0];
            case 3: return [4 /*yield*/, 1];
            case 4:
                _b.sent();
                i = 3;
                _b.label = 5;
            case 5: return [4 /*yield*/, 2];
            case 6:
                _b.sent();
                return [3 /*break*/, 11];
            case 7: return [4 /*yield*/, 3];
            case 8:
                _b.sent();
                return [3 /*break*/, 11];
            case 9: return [4 /*yield*/, -1];
            case 10:
                _b.sent();
                _b.label = 11;
            case 11: return [4 /*yield*/, "end"];
            case 12:
                _b.sent();
                return [2 /*return*/];
        }
    });
}