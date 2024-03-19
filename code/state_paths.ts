// @ts-ignore
import vis from "https://unpkg.com/vis-network@9.1.2/dist/vis-network.esm.min.js"

import { State, SokobanState, Vec, addVec, scaleVec, rotVec, eqVec } from "./microban.js";

let modulo_player = true;
let see_clearly = true;
let wait_for_scroll = true;
let extra_edge = true;
let fig_n = 4;

interface Node {
    id: string,
    state: SokobanState,
    shape: string,
    won: boolean,
    expanded: boolean,
    label: string,
    color: string,
    x: number,
    y: number,
    size?: number,
    // ctxRenderer: Function,
}

let CONFIG = {
    showIDs: false,
};

/*
let gui = new dat.GUI();
let BUTTONS = {
    expandLevel: expandLevel,
    expandAll: expandAll,
    autoStep: autoStep,
    clusterByCratePosition: clusterByCratePosition,
    hideLostCrates: () => {
        for (let node_id of Object.keys(network.body.nodes)) {
            if (network.isCluster(node_id)) {
                let representative_id = network.getNodesInCluster(node_id)[0];
                if (State.isClearlyLost(nodes.get(representative_id).state)) {
                    network.clustering.updateClusteredNode(node_id, { hidden: true });
                }
            } else {
                if (State.isClearlyLost(nodes.get(node_id).state)) {
                    nodes.update({ id: node_id, hidden: true });
                }
            }
        }
    }
}
gui.add(BUTTONS, "expandLevel");
gui.add(BUTTONS, "expandAll");
gui.add(BUTTONS, "autoStep");
gui.add(BUTTONS, "clusterByCratePosition");
gui.add(BUTTONS, "hideLostCrates");
*/

// create a network
let nodes = new vis.DataSet();
let edges = new vis.DataSet();
let network = new vis.Network(
    document.getElementById("mynetwork"),
    { // data
        nodes: nodes,
        edges: edges,
    },
    { // options
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
                // centralGravity: 0.3,
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
    }
);
setTimeout(() => {
    // addNode(State.initialState);
    // expandNode(nodes.get()[0]);
    if (!wait_for_scroll) {
        autoStep();
    }
}, 100)

let fully_expanded = false;

function triggerAction() {
    console.log("scrolling");
    let parent_window = window.parent;
    // parent_window.frames
    for (let frame of parent_window.document.querySelectorAll("iframe")) {
        if (frame.contentWindow == window) {
            let rect = frame.getBoundingClientRect();
            if (rect.top + rect.height / 2 < window.parent.innerHeight) {
                autoStep();
                window.parent.removeEventListener("scroll", triggerAction);
                let scale = [0.35, 0.45, 0.6, 0.6][fig_n];
                network.moveTo({scale: scale, animation: {duration: 1000, easingFunction: "easeInOutCubic"}});
            }
        }
    }
};
if (wait_for_scroll) {
    window.parent.addEventListener("scroll", triggerAction);
}

// $(window).scroll(function(){
//     if( isElementVisible( element ) )
//        // Perform your code.
//     });

network.on("click", function (params) {
    let clicked_node_id = params.nodes[0];
    // console.log(clicked_node_id);
    // console.log(params);
    if (clicked_node_id !== undefined) {
        let clicked_node = nodes.get(clicked_node_id);
        if (!clicked_node.expanded) {
            expandNode(clicked_node);
        }
    }
});

let cur_hover_id: string | null = null;

network.on("hoverNode", function (params) {
    if (!network.isCluster(params.node)) {
        cur_hover_id = params.node;
    }
})

network.on("blurNode", function (params) {
    cur_hover_id = null;
})

network.on("afterDrawing", function (ctx: CanvasRenderingContext2D) {
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

    if (fully_expanded) {
        // TODO: tangents, etc
        let node_positions: Record<string, Vec> = network.getPositions();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "red";
        ctx.beginPath();
        moveTo(ctx, addVec(node_positions["1:1[0:2,2:3]"], {x:-20, y:20}));
        lineTo(ctx, addVec(node_positions["1:1[0:2,1:3]"], {x:-20, y:20}));
        lineTo(ctx, addVec(node_positions["3:3[0:2,1:2]"], {x:-20, y:20}));
        lineTo(ctx, addVec(node_positions["2:3[0:2,1:1]"], {x:-20, y:20}));
        lineTo(ctx, addVec(node_positions["1:1[0:2,1:0]"], {x:-20, y:20}));
        ctx.stroke();
        let mid1 = scaleVec(addVec(node_positions["1:1[0:2,2:3]"], node_positions["1:1[0:2,1:3]"]), .5);
        ctx.beginPath();
        moveTo(ctx, addVec(mid1, {x:0, y:10}));
        lineTo(ctx, addVec(mid1, {x:10, y:20}));
        lineTo(ctx, addVec(mid1, {x:0, y:30}));
        ctx.stroke();
        let cross_center_1 = scaleVec(addVec(node_positions["1:1[0:2,1:3]"], node_positions["3:3[0:2,1:2]"]), .5);
        cross_center_1 = addVec(cross_center_1, {x:0, y:20})
        moveTo(ctx, addVec(cross_center_1, {x:-20, y:-40}));
        lineTo(ctx, addVec(cross_center_1, {x:20, y:40}));
        moveTo(ctx, addVec(cross_center_1, {x:20, y:-40}));
        lineTo(ctx, addVec(cross_center_1, {x:-20, y:40}));
        ctx.stroke();

        ctx.strokeStyle = "green";
        ctx.beginPath();
        moveTo(ctx, addVec(node_positions["1:1[0:2,2:3]"], {x:20, y:20}));
        lineTo(ctx, addVec(node_positions["1:1[0:1,2:3]"], {x:20, y:20}));
        lineTo(ctx, addVec(node_positions["1:1[0:1,1:3]"], {x:20, y:20}));
        lineTo(ctx, addVec(node_positions["1:3[0:1,1:2]"], {x:20, y:20}));
        lineTo(ctx, addVec(node_positions["1:3[0:1,1:1]"], {x:20, y:20}));
        lineTo(ctx, addVec(node_positions["2:2[0:1,1:0]"], {x:20, y:20}));
        lineTo(ctx, addVec(node_positions["1:1[0:2,1:0]"], {x:20, y:20}));
        ctx.stroke();
        let mid2 = scaleVec(addVec(node_positions["1:1[0:1,2:3]"], node_positions["1:1[0:1,1:3]"]), .5);
        ctx.beginPath();
        moveTo(ctx, addVec(mid2, {x:-3, y:15}));
        lineTo(ctx, addVec(mid2, {x:10, y:22}));
        lineTo(ctx, addVec(mid2, {x:0, y:35}));
        ctx.stroke();
        let cross_center_2 = scaleVec(addVec(node_positions["2:2[0:1,1:0]"], node_positions["1:1[0:2,1:0]"]), .5);
        cross_center_2 = addVec(cross_center_2, {x:20, y:0})
        moveTo(ctx, addVec(cross_center_2, {x:-40, y:-20}));
        lineTo(ctx, addVec(cross_center_2, {x:40, y:20}));
        moveTo(ctx, addVec(cross_center_2, {x:40, y:-20}));
        lineTo(ctx, addVec(cross_center_2, {x:-40, y:20}));
        ctx.stroke();
        
        ctx.strokeStyle = "blue";
        ctx.beginPath();
        moveTo(ctx, addVec(node_positions["1:1[0:2,2:3]"], {x:-20, y:-20}));
        lineTo(ctx, addVec(node_positions["1:1[0:1,2:3]"], {x:-20, y:-20}));
        lineTo(ctx, addVec(node_positions["1:1[0:1,1:3]"], {x:-20, y:-20}));
        lineTo(ctx, addVec(node_positions["1:3[0:1,1:2]"], {x:-20, y:-20}));
        lineTo(ctx, addVec(node_positions["1:1[0:1,2:2]"], {x:-20, y:-20}));
        lineTo(ctx, addVec(node_positions["1:1[0:2,2:2]"], {x:-20, y:-20}));
        lineTo(ctx, addVec(node_positions["3:3[0:2,1:2]"], {x:-20, y:-20}));
        lineTo(ctx, addVec(node_positions["2:3[0:2,1:1]"], {x:-20, y:-20}));
        lineTo(ctx, addVec(node_positions["1:1[0:2,1:0]"], {x:-20, y:-20}));
        ctx.stroke();

        ctx.beginPath();
        moveTo(ctx, addVec(mid2, {x:-3, y:-32}));
        lineTo(ctx, addVec(mid2, {x:10, y:-27}));
        lineTo(ctx, addVec(mid2, {x:0, y:-12}));
        ctx.stroke();
    }
})

function moveTo(ctx: CanvasRenderingContext2D, pos: Vec) {
    ctx.moveTo(pos.x, pos.y);
}

function lineTo(ctx: CanvasRenderingContext2D, pos: Vec) {
    ctx.lineTo(pos.x, pos.y);
}

function expandNode(cur_node) {
    if (cur_node.expanded) return;
    // console.log("cur node: ", cur_node);
    let next_states = State.nextStates(cur_node.state, modulo_player, see_clearly);
    for (const [input, new_state] of Object.entries(next_states)) {
        let new_id = State.id(new_state);
        if (nodes.get(new_id) === null) {
            addNode(new_state as SokobanState, new_id, cur_node);
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

let pending_expansion: Node[] = [];
let expandCount = 1;
let expandTime = 100;
function autoStep() {
    for (let k=0; k<expandCount; k++) {
        if (pending_expansion.length == 0) {
            // end expansion
            if (extra_edge) {
                edges.add({
                    id: "extra_regular",
                    from: "1:1[0:2,1:3]",
                    to: "3:3[0:2,1:2]",
                    input: "extra",
                    dashes: true,
                    width: 3,
                    // label: input,
                    // color: "red",
                });

                edges.add({
                    id: "extra_collapse",
                    from: "1:1[0:3,1:2]",
                    to: "3:3[0:3,1:2]",
                    input: "extra",
                    // dashes: true,
                    width: 2,
                    arrows: "", /*{
                        to: {
                            scaleFactor: .5,
                        },
                        from: {
                            scaleFactor: .5,
                        },
                    },*/
                    length: 1,
                    // label: input,
                });
            }

            fully_expanded = true;

            return;
        };
        expandNode(pending_expansion.shift());
    }
    if (expandTime < 50) {
        expandCount = Math.min(expandCount + .1, 10);
    } else {
        expandTime *= .92;
    }
    setTimeout(autoStep, expandTime);
}

let suggested_positions = {
    "1:1[0:2,2:3]": {x: -424.341104590674, y: -37.891470822841114},
    "1:1[0:3,2:3]": {x: -388.7637979881888, y: 122.43101881112976},
    "1:1[0:1,2:3]": {x: -357.85491547180425, y: -189.36817880464022},
    "1:1[0:2,1:3]": {x: -258.7316603461704, y: -28.45536907689095},
    "1:1[0:3,1:3]": {x: -205.58858592975244, y: 148.30090964158563},
    "1:1[0:1,1:3]": {x: -188.3046743396565, y: -206.5347547530107},
    "1:3[0:1,1:2]": {x: 49.81717706119103, y: -267.58432305806514},
    "1:1[0:1,2:2]": {x: -75.84188832864612, y: -339.9839050199733},
    "1:3[0:1,1:1]": {x: 258.4658806430857, y: -233.3188260460738},
    "2:2[0:1,1:0]": {x: 439.2548284302405, y: -197.65752605120005},
    "1:1[0:2,2:2]": {x: -38.58240136099219, y: -170.66564492662076},
    "1:1[0:3,2:2]": {x: -37.81369371811408, y: -2.890828607337385},
    "3:3[0:2,1:2]": {x: 125.55275548458623, y: -123.34206346137421},
    "2:3[0:2,1:1]": {x: 280.4880835132871, y: -45.16156593582624},
    "3:3[0:3,1:2]": {x: 107.55136763725278, y: 38.35377470095149},
    "1:1[0:2,1:0]": {x: 451.99984357007133, y: -18.03152337462962},
    "1:1[0:3,1:1]": {x: 212.52385369205464, y: 142.1459374687223},
    "1:1[0:3,1:0]": {x: 398.08371057654483, y: 136.36383014802888},
    "1:1[0:3,1:2]": {x: -2.8861085640769657, y: 170.50450121853214},
}

// "1:1[0:2,1:3]" -> "3:3[0:2,1:2]"
// remove "*,2:2]"

// Separated this to add styling
function addNode(state: SokobanState, id: string | undefined = undefined, parent_node: Node | undefined = undefined) {
    if (id === undefined) id = State.id(state);
    let x = 0;
    let y = 0;
    // if (parent_node !== undefined) {
    //     x = network.body.nodes[parent_node.id].x;
    //     y = network.body.nodes[parent_node.id].y;
    // }
    let pos = suggested_positions[id];
    if (pos !== undefined)  {
        x = pos.x;
        y = pos.y;
    }
    let won = State.isWon(state);
    let cur_node = {
        id: id,
        state: state,
        won: won,
        expanded: false,

        label: id,
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
    } as Node;
    if (extra_edge) {
        if (id === "1:1[0:3,1:2]" || id === "3:3[0:3,1:2]") {
            cur_node.size = 15;
        }
    }
    nodes.add(cur_node);
    pending_expansion.push(cur_node);
}

addNode(State.initialState);


autoStep();