import { State } from "./microban.js";
const imgs = document.querySelectorAll("img");
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const see_clearly = false;
let cur_state = State.initialState;
cur_state.player.x += 1;
cur_state.player.y += 2;
let cur_next_states = State.nextStates(cur_state, false, see_clearly);
let history = [cur_state];
setMainNode(cur_state);
function setMainNode(state) {
    cur_state = state;
    cur_next_states = State.nextStates(cur_state, false, see_clearly);
    history.push(cur_state);
}
function redraw() {
    State.drawState(cur_state, ctx, { x: 0, y: 0 }, true);
}
const CODE2ACTION = {
    "KeyA": "left",
    "ArrowLeft": "left",
    "KeyD": "right",
    "ArrowRight": "right",
    "KeyW": "up",
    "ArrowUp": "up",
    "KeyS": "down",
    "ArrowDown": "down",
};
// window.addEventListener("keydown", (ev: KeyboardEvent) => {
//     let action = CODE2ACTION[ev.code];
//     if (action && cur_next_states[action]) {
//         setMainNode(cur_next_states[action]);
//         ev.preventDefault();
//         return false;
//     } else if (ev.code === "KeyZ" && history.length > 1) {
//         history.pop();
//         cur_state = history.at(-1)!;
//         cur_next_states = State.nextStates(cur_state, false, see_clearly);
//         ev.preventDefault();
//         return false;
//     } else if (ev.code === "KeyR") {
//         setMainNode(State.initialState);
//         ev.preventDefault();
//         return false;
//     }
//     if (window.parent !== window) {
//         // @ts-expect-error
//         window.parent.keyPressed(ev.code);
//     }
// });
for (let k = 0; k < 10; k++) {
    setTimeout(redraw, k * 100);
}
canvas.style.display = "none";
let cur = 0;
document.addEventListener('keydown', ev => {
    if (cur === 1) {
        let action = CODE2ACTION[ev.code];
        if (action && cur_next_states[action]) {
            setMainNode(cur_next_states[action]);
            redraw();
            ev.preventDefault();
            return false;
        }
        else if (ev.code === "KeyZ" && history.length > 1) {
            history.pop();
            cur_state = history.at(-1);
            cur_next_states = State.nextStates(cur_state, false, see_clearly);
            redraw();
            ev.preventDefault();
            return false;
        }
        else if (ev.code === "KeyR") {
            setMainNode(State.initialState);
            redraw();
            ev.preventDefault();
            return false;
        }
        else if (ev.code === "Space") {
            if (cur + 1 < imgs.length) {
                imgs[cur].style.display = "none";
                cur += 1;
                imgs[cur].style.display = "unset";
                canvas.style.display = (cur === 1 || cur === 2) ? "initial" : "none";
            }
        }
        if (window.parent !== window) {
            // @ts-expect-error
            window.parent.keyPressed(ev.code);
        }
    }
    else {
        if (ev.code === "Space" || ev.code === "KeyD" || ev.code === "ArrowRight") {
            if (cur + 1 < imgs.length) {
                imgs[cur].style.display = "none";
                cur += 1;
                imgs[cur].style.display = "unset";
                canvas.style.display = (cur === 1 || cur === 2) ? "initial" : "none";
            }
        }
        else if (ev.code === "KeyA" || ev.code === "ArrowLeft") {
            if (cur > 0) {
                imgs[cur].style.display = "none";
                cur -= 1;
                imgs[cur].style.display = "unset";
                canvas.style.display = (cur === 1 || cur === 2) ? "initial" : "none";
            }
        }
        else if (window.parent !== window) {
            // @ts-expect-error
            window.parent.keyPressed(ev.code);
        }
    }
});
