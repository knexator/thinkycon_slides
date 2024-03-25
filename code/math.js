export function randomFloat(low_inclusive, high_exclusive) {
    return low_inclusive + Math.random() * (high_exclusive - low_inclusive);
}
export function randomInt(low_inclusive, high_exclusive) {
    return low_inclusive + Math.floor(Math.random() * (high_exclusive - low_inclusive));
}
export function randomCentered(half_size) {
    return (Math.random() * 2 - 1) * half_size;
}
/** random float between -.5 & .5 */
export function rand05() {
    return Math.random() - .5;
}
export function roundTo(value, digits) {
    const asdf = Math.pow(10, digits);
    return Math.round(value * asdf) / asdf;
}
export function max(arr) {
    if (arr.length === 0) {
        return undefined;
    }
    return arr[argmax(arr)];
}
export function argmax(arr) {
    if (arr.length === 0) {
        return undefined;
    }
    let res = 0;
    let biggest = arr[0];
    for (let k = 1; k < arr.length; k++) {
        if (arr[k] > biggest) {
            biggest = arr[k];
            res = k;
        }
    }
    return res;
}
export function argmin(arr) {
    if (arr.length === 0) {
        return undefined;
    }
    let res = 0;
    let smallest = arr[0];
    for (let k = 1; k < arr.length; k++) {
        if (arr[k] < smallest) {
            smallest = arr[k];
            res = k;
        }
    }
    return res;
}
export function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}
/** t === inverseLerp(a, b, lerp(a, b, t)) */
export function inverseLerp(a, b, value) {
    if (a === b)
        return 0.5;
    let t = (value - a) / (b - a);
    return t;
}
export function towards(cur, target, max_delta) {
    if (cur > target) {
        return Math.max(cur - max_delta, target);
    }
    else if (cur < target) {
        return Math.min(cur + max_delta, target);
    }
    else {
        return target;
    }
}
export function mod(n, m) {
    return ((n % m) + m) % m;
}
export function wrap(value, low, high) {
    return mod(value - low, high - low) + low;
}
export function remap(value, old_a, old_b, new_a, new_b) {
    let t = (value - old_a) / (old_b - old_a);
    return t * (new_b - new_a) + new_a;
}
export function smoothstep(toZero, toOne, value) {
    let x = Math.max(0, Math.min(1, (value - toZero) / (toOne - toZero)));
    return x * x * (3 - 2 * x);
}
;
export function clamp(value, min_inclusive, max_inclusive) {
    return Math.max(min_inclusive, Math.min(max_inclusive, value));
}
export function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
export function inRange(value, min_inclusive, max_exclusive) {
    return value >= min_inclusive && value < max_exclusive;
}
export function onBorder(value, min_inclusive, max_exclusive) {
    return value == min_inclusive || (value + 1) === max_exclusive;
}
// from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    // While there remain elements to shuffle.
    while (currentIndex != 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
    return array;
}
export function randomChoice(arr) {
    if (arr.length === 0) {
        throw new Error("can't choose out of an empty array");
    }
    return arr[Math.floor(Math.random() * arr.length)];
}
