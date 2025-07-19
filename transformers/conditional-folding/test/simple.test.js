/*
if (a && a && a && a && a) doSomething();
if (a) {
    if (b) {
        if ((d || e) && f) doSomething();
    } else if (c) doSomethingElse();
    else doSomethingOther();
}
if (a && b) doSomething();
if (a && b && c) {
    doSomething();
}
*/

if (a) if (a) if (a) if (a) if (a) doSomething();

if (a) {
    if (b) { 
        if (d || e) if (f) doSomething();
    } else if (c) doSomethingElse();
    else doSomethingOther();
}

if (a) {
    if (b) doSomething();
}

if (a) {
    if (b) if (c) {
        doSomething();
    }
}