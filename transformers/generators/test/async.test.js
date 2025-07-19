/*
async function test(i) {
    if (i > 10) return -1;
    let rk;
    try {
        rk = await fetch('https://example.com');
    } catch (e) {
        return await test(i + 1);
    }
    const {
        count,
        code
    } = await rk.json();
    for (let i of test(count))
        await console.log(i);
    return code;
}
*/

function test() {
    return tslib_1.__awaiter(this, arguments, void 0, function(i) {
        var rk, e_1, _a, count, code, _i, _b, i_1;
        if (i === void 0) {
            i = 0;
        }
        return tslib_1.__generator(this, function(_c) {
            switch (_c.label) {
                case 0:
                    if (i > 10)
                        return [2 /*return*/ , -1];
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 5]);
                    return [4 /*yield*/ , fetch('https://example.com')];
                case 2:
                    rk = _c.sent();
                    return [3 /*break*/ , 5];
                case 3:
                    e_1 = _c.sent();
                    return [4 /*yield*/ , test(i + 1)];
                case 4:
                    return [2 /*return*/ , _c.sent()];
                case 5:
                    return [4 /*yield*/ , rk.json()];
                case 6:
                    _a = _c.sent(), count = _a.count, code = _a.code;
                    for (_i = 0, _b = test(count); _i < _b.length; _i++) {
                        i_1 = _b[_i];
                        console.log(i_1);
                    }
                    return [2 /*return*/ , code];
            }
        });
    });
}