/*
function* test(i) {
    yield i;
    if (i > 0) {
        yield* test(i - 1);
    }
}
*/

function test(i) {
    return tslib_1.__generator(this, function(_a) {
        switch (_a.label) {
            case 0:
                return [4 /*yield*/ , i];
            case 1:
                _a.sent();
                if (!(i > 0)) return [3 /*break*/ , 3];
                return [5 /*yield**/ , tslib_1.__values(test(i - 1))];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3:
                return [2 /*return*/ ];
        }
    });
}