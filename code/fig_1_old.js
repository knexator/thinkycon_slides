// import vis from "./vis-network.esm.min.js"
// @ts-ignore
import vis from "https://unpkg.com/vis-network@9.1.2/dist/vis-network.esm.min.js";
import { State, addVec } from "./microban.js";
// create a network
let nodes = new vis.DataSet({});
let edges = new vis.DataSet();
let network = new vis.Network(document.getElementById("mynetwork"), {
    nodes: nodes,
    edges: edges,
}, {
    edges: {
        arrows: "to",
        smooth: false, /*{
        type: "continuous",
    },*/
    },
    /*nodes: {
        color: {
            highlight: "#fcba03",
        },
    },*/
    physics: {
        // enabled: false,
        barnesHut: {
            // theta: 0.5,
            gravitationalConstant: -20000,
            // centralGravity: 0.3,
            // springLength: 55,
            // springConstant: 0.04,
            damping: 0.75,
            // avoidOverlap: 0
        },
        minVelocity: 0,
    },
    interaction: {
        hover: true,
    },
});
network.on("click", function (params) {
    let clicked_node_id = params.nodes[0];
    if (clicked_node_id !== undefined) {
        setMainNode(nodes.get(clicked_node_id).state);
    }
    network.setSelection({ nodes: [main_node.id] });
});
let cur_hover_id = null;
network.on("hoverNode", function (params) {
    if (!network.isCluster(params.node)) {
        cur_hover_id = params.node;
    }
});
network.on("blurNode", function (params) {
    cur_hover_id = null;
});
network.on("afterDrawing", function (ctx) {
    if (cur_hover_id !== null) {
        let cur_hover_node = nodes.get(cur_hover_id);
        let pos = network.getPositions(cur_hover_id)[cur_hover_id];
        // ctx.translate(pos.x, pos.y);
        State.drawState(cur_hover_node.state, ctx, pos);
        // console.log(cur_hover_node);
        // ctx.fillStyle = "#000000";
        // ctx.fillRect(0, 0, 100, 100);
        // ctx.fillRect(pos.x, pos.y, 100, 100);
        // ctx.fillRect(cur_hover_pos.x, cur_hover_pos.y, 100, 100);
    }
    ctx.resetTransform();
    State.drawState(main_node.state, ctx, { x: 0, y: 0 }, true);
});
/*
function expandNode(cur_node) {
    if (cur_node.expanded) return;
    // console.log("cur node: ", cur_node);
    let next_states = State.nextStates(cur_node.state, false, false);
    for (const [input, new_state] of Object.entries(next_states)) {
        let new_id = State.id(new_state);
        if (nodes.get(new_id) === null) {
            addNode(new_state as SokobanState, new_id, cur_node);
        }
        edges.add({
            id: `${cur_node.id}_${input}`,
            from: cur_node.id,
            to: new_id,
            input: input,
            // label: input,
        });
    }
    nodes.update({ id: cur_node.id, expanded: true, color: "#fcba03" });
}
*/
function getOrAddNode(state, pos) {
    let id = State.id(state);
    let existing = nodes.get(id);
    if (existing !== null) {
        return existing;
    }
    /*pos = addVec(
        scaleVec(state.player, 250),
        addVec(
            scaleVec(rotVec(state.crates[0],  .5), 150),
            scaleVec(rotVec(state.crates[1], -.3), 200),
        )
    )*/
    let x = 0;
    let y = 0;
    if (pos !== null) {
        x = pos.x;
        y = pos.y;
    }
    let won = State.isWon(state);
    let cur_node = {
        id: id,
        state: state,
        won: won,
        expanded: false,
        color: "#9803fc",
        shape: (state === State.initialState) ? "diamond" : won ? "star" : "dot",
        x: x,
        y: y,
    };
    nodes.add(cur_node);
    return cur_node;
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
const delta_pos = {
    "left": { x: -250, y: 0 },
    "right": { x: 250, y: 0 },
    "up": { x: 0, y: -250 },
    "down": { x: 0, y: 250 },
};
network.moveTo({ position: { x: -100, y: 100 } });
let main_node = getOrAddNode(State.initialState, { x: 0, y: 0 });
nodes.update({ id: main_node.id, color: "#fcba03" });
let main_next_states = State.nextStates(main_node.state, false, false);
for (let next_action in main_next_states) {
    let cur = getOrAddNode(main_next_states[next_action], delta_pos[next_action]);
    edges.add({
        id: `${main_node.id}_${next_action}`,
        from: main_node.id,
        to: cur.id,
        input: next_action,
    });
}
network.setSelection({ nodes: [main_node.id] });
let history = [main_node];
function expandNode(cur_node) {
    if (cur_node.expanded)
        return;
    // console.log("cur node: ", cur_node);
    let next_states = State.nextStates(cur_node.state, false, false);
    for (const [input, new_state] of Object.entries(next_states)) {
        let new_id = State.id(new_state);
        if (nodes.get(new_id) === null) {
            // addNode(new_state as SokobanState, new_id, cur_node);
            getOrAddNode(new_state, null);
            /*nodes.add({
                id: new_id,
                state: new_state,
                won: new_state.isWon(),
                expanded: false,
            });*/
        }
        edges.add({
            id: `${cur_node.id}_${input}`,
            from: cur_node.id,
            to: new_id,
            input: input,
            // label: input,
        });
    }
    nodes.update({ id: cur_node.id, expanded: true, color: "#fcba03" });
}
let pending_expansion = [];
let expandCount = 1;
let expandTime = 100;
function autoStep() {
    for (let k = 0; k < expandCount; k++) {
        if (pending_expansion.length == 0) {
            // end expansion
            return;
        }
        ;
        expandNode(pending_expansion.shift());
    }
    if (expandTime < 50) {
        expandCount = Math.min(expandCount + .1, 10);
    }
    else {
        expandTime *= .92;
    }
    setTimeout(autoStep, expandTime);
}
window.addEventListener("keydown", (ev) => {
    if (ev.code === "Space") {
        autoStep();
        return false;
    }
    let action = CODE2ACTION[ev.code];
    if (action && main_next_states[action]) {
        setMainNode(main_next_states[action]);
        ev.preventDefault();
        return false;
    }
    else if (ev.code === "KeyZ" && history.length > 1) {
        history.pop();
        main_node = history.at(-1);
        main_next_states = State.nextStates(main_node.state, false, false);
        network.setSelection({ nodes: [main_node.id] });
        ev.preventDefault();
        return false;
    }
    else if (ev.code === "KeyR") {
        setMainNode(State.initialState);
        ev.preventDefault();
        return false;
    }
});
function setMainNode(state) {
    main_node = getOrAddNode(state, null);
    main_next_states = State.nextStates(main_node.state, false, false);
    let main_pos = network.getPositions(main_node.id)[main_node.id];
    for (let next_action in main_next_states) {
        let cur = getOrAddNode(main_next_states[next_action], addVec(main_pos, delta_pos[next_action]));
        nodes.update({ id: main_node.id, color: "#fcba03" });
        if (edges.get(`${main_node.id}_${next_action}`) === null) {
            edges.add({
                id: `${main_node.id}_${next_action}`,
                from: main_node.id,
                to: cur.id,
                input: next_action,
            });
        }
    }
    network.setSelection({ nodes: [main_node.id] });
    history.push(main_node);
}
