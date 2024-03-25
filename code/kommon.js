export function deepcopy(thing) {
    // TODO: lots to do
    if (Array.isArray(thing)) {
        // @ts-ignore
        return thing.map(x => deepcopy(x));
    }
    else {
        return thing;
    }
}
export function fromCount(n, callback) {
    let result = Array(n);
    for (let k = 0; k < n; k++) {
        result[k] = callback(k);
    }
    return result;
}
export function repeat(n, thing) {
    return Array(n).fill(thing);
}
export function fromRange(lo, hi, callback) {
    let count = hi - lo;
    let result = Array(count);
    for (let k = 0; k < count; k++) {
        result[k] = callback(k + lo);
    }
    return result;
}
export function* pairwise(arr) {
    let iterator = arr[Symbol.iterator]();
    let a = iterator.next();
    if (a.done)
        return; // zero elements
    let b = iterator.next();
    if (b.done)
        return; // one element 
    while (!b.done) {
        yield [a.value, b.value];
        a = b;
        b = iterator.next();
    }
}
export function* zip2(array1, array2) {
    let iterator1 = array1[Symbol.iterator]();
    let iterator2 = array2[Symbol.iterator]();
    while (true) {
        let next1 = iterator1.next();
        let next2 = iterator2.next();
        let done = next1.done || next2.done;
        if (done)
            return;
        yield [next1.value, next2.value];
    }
}
export function* zip(...arrays) {
    let iterators = arrays.map(a => a[Symbol.iterator]());
    while (true) {
        let nexts = iterators.map(a => a.next());
        let done = nexts.some(n => n.done);
        if (done)
            return;
        yield nexts.map(n => n.value);
    }
}
export function objectMap(object, map_fn) {
    let result = {};
    for (let [k, v] of Object.entries(object)) {
        result[k] = map_fn(v);
    }
    return result;
}
export class DefaultMap {
    init_fn;
    inner_map;
    constructor(init_fn, inner_map = new Map()) {
        this.init_fn = init_fn;
        this.inner_map = inner_map;
    }
    get(key) {
        let result = this.inner_map.get(key);
        if (result === undefined) {
            result = this.init_fn(key);
            this.inner_map.set(key, result);
        }
        return result;
    }
    set(key, value) {
        this.inner_map.set(key, value);
    }
}
export class DefaultDict {
    constructor(init_fn) {
        // typing doesn't work :(
        let target = {};
        return new Proxy(target, {
            get: (target, name) => {
                if (name in target) {
                    return target[name];
                }
                else {
                    target[name] = init_fn();
                    return target[name];
                }
            }
        });
    }
}
// from https://gist.github.com/rosszurowski/67f04465c424a9bc0dae
// and https://gist.github.com/nikolas/b0cce2261f1382159b507dd492e1ceef
export function lerpHexColor(a, b, t) {
    const ah = Number(a.replace('#', '0x'));
    const bh = Number(b.replace('#', '0x'));
    const ar = (ah & 0xFF0000) >> 16, ag = (ah & 0x00FF00) >> 8, ab = (ah & 0x0000FF), br = (bh & 0xFF0000) >> 16, bg = (bh & 0x00FF00) >> 8, bb = (bh & 0x0000FF), rr = ar + t * (br - ar), rg = ag + t * (bg - ag), rb = ab + t * (bb - ab);
    return `#${((rr << 16) + (rg << 8) + (rb | 0)).toString(16).padStart(6, '0').slice(-6)}`;
}
/** Only for Vite, and only for reference! you must paste it into your script :( */
// function absoluteUrl(url: string): string {
//     return new URL(url, import.meta.url).href;
// }
