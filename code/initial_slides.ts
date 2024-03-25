import { State, SokobanState, Vec, addVec, scaleVec, rotVec, eqVec } from "./microban.js";

const imgs = document.querySelectorAll("img");
const canvas = document.querySelector("canvas")!;
const ctx = canvas.getContext("2d")!;

canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;

// ctx.fillStyle = "red";
// ctx.fillRect(0,0,canvas.width,canvas.height);

await new Promise(res => setTimeout(res, 100));
State.drawState(State.initialState, ctx, {x: 0, y: 0}, true);

let cur = 0;
document.addEventListener('keydown', ev => {
    if (ev.code === "Space" || ev.code === "KeyD" || ev.code === "ArrowRight") {
        if (cur + 1 < imgs.length) {
            imgs[cur].style.display = "none";
            cur += 1;
            imgs[cur].style.display = "unset";
            canvas.style.display = (cur === 1 || cur === 2) ? "initial" : "none";
        }
    } else if (ev.code === "KeyA" || ev.code === "ArrowLeft") {
        if (cur > 0) {
            imgs[cur].style.display = "none";
            cur -= 1;
            imgs[cur].style.display = "unset";
            canvas.style.display = (cur === 1 || cur === 2) ? "initial" : "none";
        }
    }
});
