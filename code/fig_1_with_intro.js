// @ts-ignore
import vis from "https://unpkg.com/vis-network@9.1.2/dist/vis-network.esm.min.js";
import { State, eqVec } from "./microban.js";
let IN_INITIAL_ANIMATIONS = true;
let animation_state = null;
let modulo_player = false;
let see_clearly = false;
// create a network
let nodes = new vis.DataSet();
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
    physics: {
        barnesHut: {
            // theta: 0.5,
            gravitationalConstant: -20000,
            centralGravity: 0.0,
            // springLength: 55,
            // springConstant: 0.04,
            damping: 0.25,
            // avoidOverlap: 0
        },
        minVelocity: 0,
    },
    interaction: {
        hover: true,
    },
});
// $(window).scroll(function(){
//     if( isElementVisible( element ) )
//        // Perform your code.
//     });
network.on("click", function (params) {
    let clicked_node_id = params.nodes[0];
    // console.log(clicked_node_id);
    // console.log(params);
    console.log('click id: ', clicked_node_id);
    if (clicked_node_id !== undefined) {
        let clicked_node = nodes.get(clicked_node_id);
        if (!IN_INITIAL_ANIMATIONS && !clicked_node.expanded) {
            expandNode(clicked_node);
        }
        if (!IN_INITIAL_ANIMATIONS) {
            setMainNode(clicked_node.state);
        }
        else {
            otherSetNode(clicked_node.state);
        }
    }
    else if (IN_INITIAL_ANIMATIONS && animation_state === null && findNodeContainingState(cur_state) === null) {
        console.log('xxxx');
        console.log(params.pointer);
        addNodeWithAnimation(cur_state, params.pointer.canvas.x, params.pointer.canvas.y, params.pointer.DOM.x, params.pointer.DOM.y);
    }
    let asdf = findNodeContainingState(cur_state);
    if (asdf !== null) {
        network.setSelection({ nodes: [asdf.id] });
    }
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
    if (animation_state !== null)
        return;
    if (cur_hover_id !== null) {
        let cur_hover_node = nodes.get(cur_hover_id);
        let pos = network.getPositions(cur_hover_id)[cur_hover_id];
        State.drawState(cur_hover_node.state, ctx, pos);
    }
    ctx.resetTransform();
    State.drawState(cur_state, ctx, { x: 0, y: 0 }, true);
});
function expandNode(node) {
    if (node.expanded)
        return false;
    // console.log("cur node: ", cur_node);
    let next_states = State.nextStates(node.state, modulo_player, see_clearly);
    for (const [input, new_state] of Object.entries(next_states)) {
        let new_id = State.id(new_state);
        if (nodes.get(new_id) === null) {
            addNode(new_state);
            /*nodes.add({
                id: new_id,
                state: new_state,
                won: new_state.isWon(),
                expanded: false,
            });*/
        }
        let edge_id = `${node.id}_${input}`;
        if (edges.get(edge_id) === null) {
            edges.add({
                id: edge_id,
                from: node.id,
                to: new_id,
                input: input,
                // label: input,
            });
        }
    }
    nodes.update({ id: node.id, expanded: true, color: "#fcba03" });
    return true;
}
function addMissingEdges(new_node) {
    // new_node is source
    let next_states = State.nextStates(new_node.state, modulo_player, see_clearly);
    for (const [input, new_state] of Object.entries(next_states)) {
        let target_node = findNodeContainingState(new_state);
        if (target_node !== null) {
            let edge_id = `${new_node.id}_${input}`;
            if (edges.get(edge_id) === null) {
                edges.add({
                    id: edge_id,
                    from: new_node.id,
                    to: target_node.id,
                    input: input,
                });
            }
        }
    }
    // new_node is target
    for (const source_node of nodes.get()) {
        if (source_node.id === new_node.id)
            continue;
        let next_states = State.nextStates(source_node.state, modulo_player, see_clearly);
        for (const [input, new_state] of Object.entries(next_states)) {
            if (new_node.id !== State.id(new_state))
                continue;
            let edge_id = `${source_node.id}_${input}`;
            if (edges.get(edge_id) === null) {
                edges.add({
                    id: edge_id,
                    from: source_node.id,
                    to: new_node.id,
                    input: input,
                });
            }
        }
    }
}
// Separated this to add styling
function addNode(state, x = undefined, y = undefined) {
    let id = State.id(state);
    x = x ?? 0;
    y = y ?? 0;
    // if (parent_node !== undefined) {
    //     x = network.body.nodes[parent_node.id].x;
    //     y = network.body.nodes[parent_node.id].y;
    // }
    /*let pos = suggested_positions[id];
    if (pos !== undefined)  {
        x = pos.x;
        y = pos.y;
    }*/
    let won = State.isWon(state);
    let cur_node = {
        id: id,
        state: state,
        won: won,
        expanded: false,
        // label: id,
        // label: CONFIG.showIDs ? id : "",
        // label: "",
        color: "#9803fc",
        shape: (state === State.initialState) ? "diamond" : won ? "star" : "dot",
        // shape: "image",
        x: x,
        y: y,
        // image: State.drawToUrl(state),
        // size: 50,
        // ctxRenderer: ctxRenderer,
    };
    nodes.add(cur_node);
}
function addNodeWithAnimation(state, pos_x, pos_y, view_x, view_y) {
    let id = State.id(state);
    let won = State.isWon(state);
    let cur_node = {
        id: id,
        state: State.copy(state),
        won: won,
        expanded: false,
        color: "#9803fc",
        shape: (state === State.initialState) ? "diamond" : won ? "star" : "dot",
        x: pos_x,
        y: pos_y,
    };
    animation_state = {
        t: 0,
        state, pos_x, pos_y, view_x, view_y,
        node: cur_node,
    };
}
// addNode(State.initialState);
let cur_state = State.initialState;
let cur_next_states = State.nextStates(cur_state, false, see_clearly);
let history = [cur_state];
// setMainNode(cur_state);
network.moveTo({ position: { x: -200, y: 0 } });
console.log(network);
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
window.addEventListener("keydown", (ev) => {
    if (IN_INITIAL_ANIMATIONS) {
        let action = CODE2ACTION[ev.code];
        if (action && cur_next_states[action]) {
            otherSetNode(cur_next_states[action]);
            ev.preventDefault();
            return false;
        }
        else if (ev.code === "KeyZ" && history.length > 1) {
            history.pop();
            otherSetNode(history.at(-1));
            ev.preventDefault();
            return false;
        }
        else if (ev.code === "KeyR") {
            otherSetNode(State.initialState);
            ev.preventDefault();
            return false;
        }
        else if (ev.code === "Space" && animation_state === null) {
            for (const node of nodes.get()) {
                expandNode(node);
            }
            IN_INITIAL_ANIMATIONS = false;
        }
    }
    else {
        let action = CODE2ACTION[ev.code];
        if (action && cur_next_states[action]) {
            setMainNode(cur_next_states[action]);
            ev.preventDefault();
            return false;
        }
        else if (ev.code === "KeyZ" && history.length > 1) {
            history.pop();
            cur_state = history.at(-1);
            cur_next_states = State.nextStates(cur_state, false, see_clearly);
            network.setSelection({ nodes: [findNodeContainingState(cur_state).id] });
            ev.preventDefault();
            return false;
        }
        else if (ev.code === "KeyR") {
            setMainNode(State.initialState);
            ev.preventDefault();
            return false;
        }
        if (window.parent !== window) {
            // @ts-expect-error
            window.parent.keyPressed(ev.code);
        }
    }
});
function findNodeContainingState(state) {
    let res = nodes.get({
        filter: function (node) {
            return eqVec(node.state.crates[0], state.crates[0]) && eqVec(node.state.crates[1], state.crates[1])
                && eqVec(node.state.player, state.player);
        }
    });
    return res[0] || null;
}
function setMainNode(state) {
    let cur_node = nodes.get(State.id(state));
    expandNode(cur_node);
    cur_node.expanded = true;
    cur_state = state;
    cur_next_states = State.nextStates(cur_state, false, see_clearly);
    network.setSelection({ nodes: [cur_node.id] });
    history.push(cur_state);
}
function otherSetNode(state) {
    let cur_node = findNodeContainingState(state);
    cur_state = state;
    cur_next_states = State.nextStates(cur_state, false, see_clearly);
    if (cur_node !== null) {
        network.setSelection({ nodes: [cur_node.id] });
    }
    history.push(cur_state);
}
let canvas = document.querySelector("canvas");
let ctx = canvas.getContext("2d");
let last_time = 0;
function draw(cur_time) {
    if (cur_time === undefined) {
        cur_time = last_time;
    }
    let delta_time = (cur_time - last_time) * 0.001;
    last_time = cur_time;
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    network.redraw();
    ctx.resetTransform();
    State.drawState(cur_state, ctx, { x: 0, y: 0 }, true);
    if (animation_state !== null) {
        // let target_x = animation_state.pos_x + network.canvas.canvasViewCenter.x;
        // let target_y = animation_state.pos_y + network.canvas.canvasViewCenter.y;
        // target_x += network.view.targetTranslation.x - network.view.sourceTranslation.x;
        // target_y += network.view.targetTranslation.y - network.view.sourceTranslation.y;
        let target_x = animation_state.view_x;
        let target_y = animation_state.view_y;
        State.drawStateScaledAnimationIntroThing(cur_state, ctx, { x: target_x * animation_state.t, y: target_y * animation_state.t }, 1 - animation_state.t);
        animation_state.t += delta_time;
        if (animation_state.t >= 1) {
            nodes.add(animation_state.node);
            addMissingEdges(animation_state.node);
            animation_state = null;
        }
    }
    requestAnimationFrame(draw);
}
draw(undefined);
