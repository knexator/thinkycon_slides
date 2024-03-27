import { State, SokobanState, Vec, addVec, scaleVec, rotVec, eqVec } from "./microban.js";

let state_leftBlocksRight = structuredClone(State.initialState);
state_leftBlocksRight.crates[1].x -= 1;
state_leftBlocksRight.player.x += 2;
state_leftBlocksRight.player.y += 3;

let state_rightBlocksLeft = structuredClone(State.initialState);
state_rightBlocksLeft.crates[1].x -= 1;
state_rightBlocksLeft.crates[1].y -= 3;
state_rightBlocksLeft.crates[0].y -= 1;
state_rightBlocksLeft.player.x += 1;
state_rightBlocksLeft.player.y += 1;

let state_magic = structuredClone(State.initialState);
state_magic.crates[1].y -= 1;
state_magic.crates[0].y -= 1;
state_magic.player.x += 3;
state_magic.player.y += 2;



let canvas = document.querySelector("canvas")!;
let ctx = canvas.getContext("2d")!;
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

let hovering = 0;
let grabbing = 0;

let M = .3;
let s1 = canvas.height * .5 / (M * (1 - M));
let s2 = s1 * 2;

let v1 = 1;
let v2 = v1 * 2;
let magic = .7;

function inv_x(x) {
    let t = x / canvas.width;
    t = (t - 1 / 8) * 8 / 6;
    return t;
}

function x(t) {
    return canvas.width * (1 + t * 6) / 8
}

function y1(t) {
    return (t - 1 / 4) * (t - 3 / 4) * s1 + canvas.height / 2
}

function y2(t) {
    return (t - 1 / 4) * (t - 3 / 4) * s2 + canvas.height / 2
}

let t1 = .1;
let t2 = M;
let r = canvas.height / 16;

// hacky and uneficient, but fast to code
// binary search not working??
function closest_t_in_1(_x, _y) {
    let best_dist = Infinity;
    let best_t = 0;
    let step_1 = .1;
    for (let t = 0; t <= 1 - M; t += step_1) {
        let dx = x(t) - _x;
        let dy = y1(t) - _y;
        let dist = dx * dx + dy * dy;
        if (dist < best_dist) {
            best_dist = dist;
            best_t = t;
        }
    }
    for (let t = best_t - step_1 / 2; t <= best_t + step_1 / 2; t += step_1 / 100) {
        let dx = x(t) - _x;
        let dy = y1(t) - _y;
        let dist = dx * dx + dy * dy;
        if (dist < best_dist) {
            best_dist = dist;
            best_t = t;
        }
    }
    return best_t;
}

function closest_t_in_2(_x, _y) {
    let best_dist = Infinity;
    let best_t = 0;
    let step_1 = .1;
    for (let t = M; t <= 1; t += step_1) {
        let dx = x(t) - _x;
        let dy = y2(t) - _y;
        let dist = dx * dx + dy * dy;
        if (dist < best_dist) {
            best_dist = dist;
            best_t = t;
        }
    }
    for (let t = best_t - step_1 / 2; t <= best_t + step_1 / 2; t += step_1 / 100) {
        let dx = x(t) - _x;
        let dy = y2(t) - _y;
        let dist = dx * dx + dy * dy;
        if (dist < best_dist) {
            best_dist = dist;
            best_t = t;
        }
    }
    return best_t;
}

function valid1(t) {
    if (y1(t) + r + 1 > canvas.height) return false;
    let dx = x(t) - x(t2);
    let dy = y1(t) - y2(t2);
    return !(dx * dx + dy * dy < r * r * 4)
}

// window.valid1 = valid1;

function move1(target_t) {
    target_t = clamp(target_t, 0, 1 - M)
    let step_size = .01;

    let cur_t1 = t1;
    for (let k = 0; k < 40; k++) {
        let new_t1 = towards(cur_t1, target_t, step_size);
        if (valid1(new_t1)) {
            cur_t1 = new_t1;
            if (Math.abs(cur_t1 - target_t) < .00001) {
                break;
            }
        } else {
            step_size /= 2;
        }
    }
    t1 = cur_t1;
}

function valid2(t) {
    if (y2(t) + r + 1 > canvas.height) return false;
    let dx = x(t1) - x(t);
    let dy = y1(t1) - y2(t);
    return !(dx * dx + dy * dy < r * r * 4)
}

function move2(target_t) {
    target_t = clamp(target_t, M, 1)
    let step_size = .01;

    let cur_t2 = t2;
    for (let k = 0; k < 40; k++) {
        let new_t2 = towards(cur_t2, target_t, step_size);
        if (valid2(new_t2)) {
            cur_t2 = new_t2;
            if (Math.abs(cur_t2 - target_t) < .00001) {
                break;
            }
        } else {
            step_size /= 2;
        }
    }
    t2 = cur_t2;
}

window.addEventListener("mousemove", ev => {
    if (grabbing == 0) {
        let d1x = x(t1) - ev.clientX;
        let d1y = y1(t1) - ev.clientY;
        let d2x = x(t2) - ev.clientX;
        let d2y = y2(t2) - ev.clientY;

        if (d1x * d1x + d1y * d1y < r * r) {
            hovering = 1;
            document.body.style.cursor = "grab";
        } else if (d2x * d2x + d2y * d2y < r * r) {
            hovering = 2;
            document.body.style.cursor = "grab";
        } else if (hovering != 0) {
            hovering = 0;
            document.body.style.cursor = "default";
        }
    } else {
        if (grabbing == 1) {
            move1(closest_t_in_1(ev.clientX, ev.clientY));
        } else {
            move2(closest_t_in_2(ev.clientX, ev.clientY));
        }
    }
});

window.addEventListener("mousedown", ev => {
    if (hovering != 0) {
        grabbing = hovering;
        document.body.style.cursor = "grabbing";
    }
});

window.addEventListener("mouseup", ev => {
    grabbing = 0;
    document.body.style.cursor = (hovering == 0) ? "default" : "grab";
});

let keyA = false;
let keyS = false;
let keyD = false;
window.addEventListener("keydown", ev => {
    if (ev.code === "KeyA") {
        keyA = true;
    } else if (ev.code === "KeyS") {
        keyS = true;
    } else if (ev.code === "KeyD") {
        keyD = true;
    } else if (ev.code === "KeyF") {
        grabbing = 0;
        t1 = .5;
    } else if (window.parent !== window) {
        // @ts-expect-error
        window.parent.keyPressed(ev.code);
    }
});

window.addEventListener("keyup", ev => {
    if (ev.code === "KeyA") {
        keyA = false;
    } else if (ev.code === "KeyS") {
        keyS = false;
    } else if (ev.code === "KeyD") {
        keyD = false;
    }
})

let color_1 = "#f7d125";
let color_2 = "#F600FF";
ctx.lineWidth = 3;

let last_time = 0;
function draw(cur_time: number | undefined) {
    if (cur_time === undefined) {
        cur_time = last_time;
    }
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        r = canvas.height / 16;
        s1 = canvas.height * .5 / (M * (1 - M));
        s2 = s1 * 2;
        ctx.lineWidth = 3;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#36393E"
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let delta_time = (cur_time - last_time) * 0.001;
    last_time = cur_time;

    if ((Math.abs(t2 - M) < .001) && (Math.abs(t1 - (1 - M)) < .001)) {
        // ctx.fillStyle = "#aee6bd";
        // ctx.fillRect(0,0,canvas.width,canvas.height);
    }

    if (grabbing != 1) {
        move1(t1 + delta_time * v1 * Math.pow(Math.abs(t1 - .5), magic) * Math.sign(t1 - .5));
    }
    if (grabbing != 2) {
        move2(t2 + delta_time * v2 * Math.pow(Math.abs(t2 - .5), magic) * Math.sign(t2 - .5));
    }

    ctx.strokeStyle = color_1;
    ctx.beginPath();
    let first = false;
    for (let t = 0; t <= 1 - M; t += .02) {
        if (first) {
            first = false;
            ctx.moveTo(x(t), y1(t))
        } else {
            ctx.lineTo(x(t), y1(t))
        }
    }
    ctx.stroke();

    ctx.strokeStyle = color_2;
    ctx.beginPath();
    first = false;
    for (let t = M; t <= .92; t += .02) {
        if (first) {
            first = false;
            ctx.moveTo(x(t), y2(t))
        } else {
            ctx.lineTo(x(t), y2(t))
        }
    }
    ctx.stroke();

    const won_2 = Math.abs(t2 - M) < .001;
    ctx.fillStyle = color_2;
    // ctx.strokeStyle = color_2;
    ctx.beginPath();
    ctx.arc(x(t2), y2(t2), r - 1, 0, 2 * Math.PI);
    ctx.fill()
    // ctx.stroke();

    ctx.font = '128px Arial';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    if (won_2) {
        ctx.fillText('✔️', x(t2) - 150, y2(t2) - 75);
    }

    const won_1 = Math.abs(t1 - (1 - M)) < .001;
    ctx.fillStyle = color_1;
    // ctx.strokeStyle = color_1;
    ctx.beginPath();
    ctx.arc(x(t1), y1(t1), r - 1, 0, 2 * Math.PI);
    ctx.fill()
    // ctx.stroke();

    if (won_1) {
        ctx.fillText('✔️', x(t1) + 150, y1(t1) - 75);
    }

    if (keyA) {
        State.drawState(state_leftBlocksRight, ctx, { x: canvas.width / 2, y: canvas.height / 2 }, false);
    } else if (keyS) {
        State.drawState(state_rightBlocksLeft, ctx, { x: canvas.width / 2, y: canvas.height / 2 }, false);
    } else if (keyD) {
        State.drawState(state_magic, ctx, { x: canvas.width / 2, y: canvas.height / 2 }, false);
    }

    requestAnimationFrame(draw);
}

draw(undefined);

function towards(cur, target, vel) {
    if (cur < target) {
        return Math.min(target, cur + vel);
    } else {
        return Math.max(target, cur - vel);
    }
}

function lerp(a, b, t) {
    return a * (1 - t) + b * t;
}

function clamp(t, a, b) {
    return Math.max(a, Math.min(b, t));
}