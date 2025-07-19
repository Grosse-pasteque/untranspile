/*
function* test() {
    try {
        yield 1;
    } catch (e) {
        yield 2;
        console.log(e)
        yield e;
        if (e.name == "ABC") {
            yield "error";
            throw e;
        }
    } finally {
        yield 3;
    }
}
*/

function test() {
    var e_2;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, 7, 9]);
                return [4 /*yield*/, 1];
            case 1:
                _a.sent();
                return [3 /*break*/, 9];
            case 2:
                e_2 = _a.sent();
                return [4 /*yield*/, 2];
            case 3:
                _a.sent();
                console.log(e_2);
                return [4 /*yield*/, e_2];
            case 4:
                _a.sent();
                if (!(e_2.name == "ABC")) return [3 /*break*/, 6];
                return [4 /*yield*/, "error"];
            case 5:
                _a.sent();
                throw e_2;
            case 6: return [3 /*break*/, 9];
            case 7: return [4 /*yield*/, 3];
            case 8:
                _a.sent();
                return [7 /*endfinally*/];
            case 9: return [2 /*return*/];
        }
    });
}