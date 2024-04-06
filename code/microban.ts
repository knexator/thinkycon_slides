export interface Vec {
    x: number,
    y: number
}

export interface SokobanState {
    w: number,
    h: number,
    walls: boolean[][],
    targets: Vec[],
    crates: Vec[],
    player: Vec,
}

function copy(x: SokobanState): SokobanState {
    return structuredClone(x);
}

const DIRS = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: -1 },
]

let forbidden_places: boolean[][] | null = null;

function parseLevel(ascii: string): SokobanState {
    let rows = ascii.trim().split("\n").map(x => x.trim())
    console.log(rows)
    let height = rows.length
    let width = rows[0].length

    let targets: Vec[] = [];
    let crates: Vec[] = [];
    let player: Vec;
    let walls: boolean[][] = [];
    for (let j = 0; j < height; j++) {
        let wall_row: boolean[] = [];
        for (let i = 0; i < width; i++) {
            let val = rows[j][i];
            if (val === "#") {
                wall_row.push(true);
                continue;
            } else {
                wall_row.push(false);
            }
            switch (val) {
                case ".":
                    break;
                case "#":
                    break;
                case "*":
                    crates.push({ x: i, y: j });
                    break;
                case "O":
                    targets.push({ x: i, y: j });
                    break;
                case "@":
                    crates.push({ x: i, y: j });
                    targets.push({ x: i, y: j });
                    break;
                case "P":
                    player = { x: i, y: j };
                    break;
                default:
                    break;
            }
        }
        walls.push(wall_row);
    }

    let state: SokobanState = {
        w: width,
        h: height,
        walls: walls,
        targets: targets,
        crates: crates,
        player: player!,
    }

    forbidden_places = generateForbiddenMap(state);
    movePlayerToStandardPosition(state);

    return state
}

let initialState = parseLevel(`
####..
#.O#..
#..###
#@P..#
#..*.#
#..###
####..
`)

// let initialState = parseLevel(`
// ######
// #....#
// #.#P.#
// #.*@.#
// #.O@.#
// #....#
// ######
// `)

// let initialState = parseLevel(`
// .....####
// ...###..#
// .###.OO.#
// .#.**#..#
// ##.#.#.##
// #..@.P..#
// #...#...#
// ######..#
// .....####
// `)

// let initialState = parseLevel(`
// ###########..
// #...P.#...###
// #.*.*.#.O..O#
// #.##.###.##.#
// #.#.......#.#
// #.#...#...#.#
// #.#########.#
// #...........#
// #############
// `)

// let initialState = parseLevel(`
// ..#####..
// .##...###
// .#......#
// .#@#@#@.#
// .#.#P*.##
// ##.#.#O#.
// #......#.
// #...#..#.
// ########.
// `)

function crateAt(state: SokobanState, pos: Vec) {
    return state.crates.some(c => c.x == pos.x && c.y == pos.y)
}

function targetAt(state: SokobanState, pos: Vec) {
    return state.targets.some(c => c.x == pos.x && c.y == pos.y)
}

function isWon(state: SokobanState) {
    return state.targets.every(t => {
        return crateAt(state, t);
    })
}

function movePlayerToStandardPosition(state: SokobanState): void {
    let explored = rectGrid(false, state.w, state.h);
    let pending: Vec[] = [state.player];
    while (pending.length > 0) {
        let curPos = pending.pop()!;
        if (explored[curPos.y][curPos.x]) continue;
        explored[curPos.y][curPos.x] = true;
        for (let k = 0; k < 4; k++) {
            const dir = DIRS[k];
            let newPos = addVec(curPos, dir);
            if (!validPos(state, newPos) || explored[newPos.y][newPos.x] || crateAt(state, newPos)) {
                continue;
            }
            pending.push(newPos);
        }
    }
    for (let row = 0; row < state.h; row++) {
        for (let col = 0; col < state.w; col++) {
            if (explored[row][col]) {
                state.player = { x: col, y: row };
                return;
            }
        }
    }
}

function nextStates(state: SokobanState, modulo: boolean, seeClearly: boolean): Record<string, SokobanState> {
    if (modulo) {
        return nextStates_modulo(state, seeClearly);
    } else {
        return nextStates_full(state, seeClearly);
    }
}

function nextStates_modulo(state: SokobanState, seeClearly: boolean): Record<string, SokobanState> {
    let result = {};

    let explored = rectGrid(false, state.w, state.h);
    let pending: Vec[] = [state.player];
    while (pending.length > 0) {
        let curPos = pending.pop()!;
        if (explored[curPos.y][curPos.x]) continue;
        explored[curPos.y][curPos.x] = true;
        for (let k = 0; k < 4; k++) {
            const dir = DIRS[k];
            let newPos = addVec(curPos, dir);
            if (!validPos(state, newPos) || explored[newPos.y][newPos.x]) {
                continue;
            }
            if (crateAt(state, newPos)) {
                let new_crate_pos = addVec(newPos, dir);
                if (validPos(state, new_crate_pos) && !crateAt(state, new_crate_pos)) {
                    let new_crates = state.crates.map(c => {
                        if (c.x == newPos.x && c.y == newPos.y) {
                            return { x: new_crate_pos.x, y: new_crate_pos.y }
                        } else {
                            return { x: c.x, y: c.y }
                        }
                    }).sort((a, b) => {
                        if (a.x === b.x) return a.y - b.y
                        return a.x - b.x;
                    })
                    let new_state = {
                        w: state.w,
                        h: state.h,
                        walls: state.walls,
                        targets: state.targets,
                        crates: new_crates,
                        player: newPos,
                    };
                    if (seeClearly && isClearlyLost(new_state)) {
                        continue;
                    }
                    movePlayerToStandardPosition(new_state);
                    result[`${newPos.x},${newPos.y}->${new_crate_pos.x},${new_crate_pos.y}`] = new_state;
                }
            } else {
                pending.push(newPos);
            }
        }
    }

    return result
}

function nextStates_full(state: SokobanState, seeClearly: boolean): Record<string, SokobanState> {
    let result = {
        left: nextState(state, { x: -1, y: 0 }),
        right: nextState(state, { x: 1, y: 0 }),
        up: nextState(state, { x: 0, y: -1 }),
        down: nextState(state, { x: 0, y: 1 })
    }
    for (let key in result) {
        if (result[key] === false || (seeClearly && isClearlyLost(result[key]))) {
            delete result[key]
        }
    }
    return result as Record<string, SokobanState>;
}

function nextState(state: SokobanState, dir: Vec): SokobanState | false {
    let new_p = {
        x: state.player.x + dir.x,
        y: state.player.y + dir.y
    }
    if (!validPos(state, new_p)) return false
    if (!crateAt(state, new_p)) {
        return {
            w: state.w,
            h: state.h,
            walls: state.walls,
            targets: state.targets,
            crates: state.crates,
            player: new_p,
        }
    }
    let new_crate_pos = {
        x: new_p.x + dir.x,
        y: new_p.y + dir.y
    }
    if (!validPos(state, new_crate_pos) || crateAt(state, new_crate_pos)) {
        return false
    }
    let new_crates = state.crates.map(c => {
        if (c.x == new_p.x && c.y == new_p.y) {
            return { x: new_crate_pos.x, y: new_crate_pos.y }
        } else {
            return { x: c.x, y: c.y }
        }
    }).sort((a, b) => {
        if (a.x === b.x) return a.y - b.y
        return a.x - b.x;
    })
    return {
        w: state.w,
        h: state.h,
        walls: state.walls,
        targets: state.targets,
        crates: new_crates,
        player: new_p,
    }
}

// false if oob or wall
function validPos(state: SokobanState, pos: Vec) {
    if (pos.x < 0 || pos.x >= state.w || pos.y < 0 || pos.y >= state.h) {
        return false
    }
    return !state.walls[pos.y][pos.x]
}

function id(state: SokobanState) {
    let result = `${state.player.x}:${state.player.y}`
    result += '[' + state.crates.map(c => `${c.x - 1}:${c.y - 1}`).join(',') + ']'
    return result
}

export let spritesheet = new Image();
spritesheet.src = './sokoban_spritesheet.png';

function drawStateScaledAnimationIntroThing(state: SokobanState, ctx: CanvasRenderingContext2D, pos: Vec, scale: number) {
    let TILE_S = scale * Math.ceil(ctx.canvas.height / state.h);
    ctx.imageSmoothingEnabled = false;

    let OFF_X = pos.x;
    let OFF_Y = pos.y;

    for (let j = 0; j < state.h; j++) {
        for (let i = 0; i < state.w; i++) {
            if (state.walls[j][i]) {
                // wall
                ctx.drawImage(spritesheet, 1 + 0 * 7, 1, 5, 5, OFF_X + i * TILE_S, OFF_Y + j * TILE_S, TILE_S, TILE_S);
            } else {
                // background
                ctx.drawImage(spritesheet, 1 + 1 * 7, 1, 5, 5, OFF_X + i * TILE_S, OFF_Y + j * TILE_S, TILE_S + 1, TILE_S + 1);
            }
        }
    }

    state.targets.forEach(target => {
        ctx.drawImage(spritesheet, 1 + 2 * 7, 1, 5, 5, OFF_X + target.x * TILE_S, OFF_Y + target.y * TILE_S, TILE_S, TILE_S);
    })

    state.crates.forEach(target => {
        ctx.drawImage(spritesheet, 1 + 3 * 7, 1, 5, 5, OFF_X + target.x * TILE_S, OFF_Y + target.y * TILE_S, TILE_S, TILE_S);
    })

    ctx.drawImage(spritesheet, 1 + 4 * 7, 1, 5, 5, OFF_X + state.player.x * TILE_S, OFF_Y + state.player.y * TILE_S, TILE_S, TILE_S);
}


function drawState(state: SokobanState, ctx: CanvasRenderingContext2D, pos: Vec, main: boolean = false) {
    let TILE_S = main ? Math.ceil(ctx.canvas.height / state.h) : 50;
    ctx.imageSmoothingEnabled = false;

    let OFF_X = main ? 0 : Math.round(pos.x - state.w * TILE_S / 2);
    let OFF_Y = main ? 0 : Math.round(pos.y + TILE_S);

    function drawSprite(id: number, i: number, j: number) {
        ctx.drawImage(spritesheet, 1 + id * 7, 1, 5, 5,
            Math.floor(OFF_X + i * TILE_S) - 1,
            Math.floor(OFF_Y + j * TILE_S) - 1,
            Math.ceil(TILE_S) + 1,
            Math.ceil(TILE_S) + 1,
        );
    }

    for (let j = 0; j < state.h; j++) {
        for (let i = 0; i < state.w; i++) {
            if (state.walls[j][i]) {
                // wall
                drawSprite(0, i, j);
            } else {
                // background
                drawSprite(1, i, j);
            }
        }
    }

    state.targets.forEach(target => {
        drawSprite(2, target.x, target.y);
    })

    state.crates.forEach(crate => {
        drawSprite(3, crate.x, crate.y);
    })

    drawSprite(4, state.player.x, state.player.y);
}

function drawStateToCanvas(state: SokobanState) {
    let TILE_S = 50;
    let temp_canvas = document.createElement('canvas');
    temp_canvas.width = state.w * TILE_S;
    temp_canvas.height = state.h * TILE_S;
    let temp_ctx = temp_canvas.getContext('2d')!;
    temp_ctx.imageSmoothingEnabled = false;
    drawState(state, temp_ctx, { x: 0, y: 0 }, true);
    return temp_canvas;
}

/*let TILE_S = 50;
let canvas = document.createElement('canvas');
canvas.width = TILE_S * initialState.w;
canvas.height = TILE_S * initialState.h;
let ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;
function drawToUrl(state: SokobanState) {
    
    for (let j = 0; j < state.h; j++) {
        for (let i = 0; i < state.w; i++) {
            if (state.walls[j][i]) {
                // wall
                ctx.drawImage(spritesheet, 0, 0, 5, 5, i * TILE_S, j * TILE_S, TILE_S, TILE_S);
            } else {
                // background
                ctx.drawImage(spritesheet, 5, 0, 5, 5, i * TILE_S, j * TILE_S, TILE_S, TILE_S);
            }
        }
    }

    state.targets.forEach(target => {
        ctx.drawImage(spritesheet, 10, 0, 5, 5, target.x * TILE_S, target.y * TILE_S, TILE_S, TILE_S);
    })

    state.crates.forEach(target => {
        ctx.drawImage(spritesheet, 15, 0, 5, 5, target.x * TILE_S, target.y * TILE_S, TILE_S, TILE_S);
    })

    ctx.drawImage(spritesheet, 20, 0, 5, 5, state.player.x * TILE_S, state.player.y * TILE_S, TILE_S, TILE_S);

    let res = canvas.toDataURL();
    console.log(res);
    return canvas.toDataURL();
}*/

function isClearlyLost(state: SokobanState) {
    // is some crate is stuck in some corner?
    if (state.crates.some(crate => {
        return forbidden_places![crate.y][crate.x]
    })) {
        return true;
    }

    // Subtler: can we find a mapping from crates to targets?
    for (let crate_indices of permute(zeroToN(state.crates.length))) {
        let valid_permutation = true;
        for (let k = 0; k < state.crates.length; k++) {
            if (!couldMaybeBePushedFromAtoB(state, state.crates[crate_indices[k]], state.targets[k])) {
                valid_permutation = false;
                break;
            }
        }
        if (valid_permutation) {
            return false;
        }
    }
    return true;
}

function zeroToN(N: number) {
    let res = Array(N);
    for (let i = 0; i < N; i++) {
        res[i] = i;
    }
    return res;
}

function* permute<T>(permutation: T[]) {
    var length = permutation.length,
        c = Array(length).fill(0),
        i = 1, k, p;

    yield permutation.slice();
    while (i < length) {
        if (c[i] < i) {
            k = i % 2 && c[i];
            p = permutation[i];
            permutation[i] = permutation[k];
            permutation[k] = p;
            ++c[i];
            i = 1;
            yield permutation.slice();
        } else {
            c[i] = 0;
            ++i;
        }
    }

    // Memory efficient iteration through permutations:
    // for (var permutation of permute([1, 2, 3])) console.log(permutation);
}

/*
function generateTargetMap(state: SokobanState) {
 
}
*/


function generateForbiddenMap(state: SokobanState): boolean[][] {
    let result: boolean[][] = [];
    for (let row = 0; row < state.h; row++) {
        let cur_row: boolean[] = [];
        for (let col = 0; col < state.w; col++) {
            cur_row.push(!state.targets.some(target => {
                return couldMaybeBePushedFromAtoB(state, { x: col, y: row }, target);
            }));
            // cur_row.push(couldMaybeBePushedFromAtoB(state, { x: col, y: row }, { x: 2, y: 4 }));
        }
        result.push(cur_row);
    }

    return result;
}

function couldMaybeBePushedFromAtoB(state: SokobanState, posA: Vec, posB: Vec): boolean {
    if (!validPos(state, posA)) return false;
    let explored = rectGrid(false, state.w, state.h);
    let pending: Vec[] = [posA];
    while (pending.length > 0) {
        let curPos = pending.pop()!;
        if (eqVec(posB, curPos)) return true;
        if (explored[curPos.y][curPos.x]) continue;
        explored[curPos.y][curPos.x] = true;
        for (let k = 0; k < 4; k++) {
            const dir = DIRS[k];
            let newPos = addVec(curPos, dir);
            if (!validPos(state, newPos) || explored[newPos.y][newPos.x]) {
                continue;
            }
            let pushingFromPos = subVec(curPos, dir);
            if (validPos(state, pushingFromPos)) {
                pending.push(newPos);
            }
        }
    }
    return false
}

export function eqVec(a: Vec, b: Vec): boolean {
    return a.x === b.x && a.y === b.y;
}

export function addVec(a: Vec, b: Vec): Vec {
    return { x: a.x + b.x, y: a.y + b.y };
}

export function scaleVec(a: Vec, s: number): Vec {
    return { x: a.x * s, y: a.y * s };
}

export function rotVec(a: Vec, radians: number): Vec {
    let c = Math.cos(radians);
    let s = Math.sin(radians);
    return { x: a.x * c - a.y * s, y: a.x * s + a.y * c };
}

export function subVec(a: Vec, b: Vec): Vec {
    return { x: a.x - b.x, y: a.y - b.y };
}

function rectGrid<T>(fillValue: T, width: number, height: number): T[][] {
    let result: T[][] = [];
    for (let row = 0; row < height; row++) {
        let cur_row: T[] = [];
        for (let col = 0; col < width; col++) {
            cur_row.push(fillValue);
        }
        result.push(cur_row);
    }
    return result;
}

export let State = { initialState, nextStates, isWon, id, isClearlyLost, drawState, drawStateToCanvas /*drawToUrl*/, drawStateScaledAnimationIntroThing, copy }