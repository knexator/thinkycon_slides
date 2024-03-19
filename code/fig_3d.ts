// @ts-ignore
import vis from "https://unpkg.com/vis-network@9.1.2/dist/vis-network.esm.min.js"
console.log("vis: ", vis)

// @ts-ignore
import "https://unpkg.com/3d-force-graph@1.71.1/dist/3d-force-graph.min.js";

// @ts-ignore
import "https://unpkg.com/three@0.150.0/build/three.js";

declare let ForceGraph3D: any;
declare let THREE: any;

console.log("three: ", THREE);

import { State, SokobanState, Vec, addVec, scaleVec, rotVec, eqVec, spritesheet } from "./microban.js";

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
    z: number,
    size?: number,
    // ctxRenderer: Function,
}

let CONFIG = {
    showIDs: false,
};

// create a network
let nodes = new vis.DataSet();
let edges = new vis.DataSet();

function triggerAction() {
    console.log("scrolling");
    let parent_window = window.parent;
    for (let frame of parent_window.document.querySelectorAll("iframe")) {
        if (frame.contentWindow == window) {
            let rect = frame.getBoundingClientRect();
            if (rect.top + rect.height / 2 < window.parent.innerHeight) {
                // stuff
                window.parent.removeEventListener("scroll", triggerAction);
            }
        }
    }
};
if (wait_for_scroll) {
    window.parent.addEventListener("scroll", triggerAction);
}



/*let cur_hover_id: string | null = null;

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
})*/

function expandNode(cur_node) {
    if (cur_node.expanded) return;
    // console.log("cur node: ", cur_node);
    let next_states = State.nextStates(cur_node.state, modulo_player, see_clearly);
    for (const [input, new_state] of Object.entries(next_states)) {
        let new_id = State.id(new_state);
        if (nodes.get(new_id) === null) {
            addNode(new_state as SokobanState, new_id, cur_node);
            // nodes.add({
            //     id: new_id,
            //     state: new_state,
            //     won: new_state.isWon(),
            //     expanded: false,
            // });
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
    /*"1:1[0:2,2:3]": {x: -424.341104590674, y: -37.891470822841114},
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
    "1:1[0:3,1:2]": {x: -2.8861085640769657, y: 170.50450121853214},*/
}

// "1:1[0:2,1:3]" -> "3:3[0:2,1:2]"
// remove "*,2:2]"

// Separated this to add styling
function addNode(state: SokobanState, id: string | undefined = undefined, parent_node: Node | undefined = undefined) {
    if (id === undefined) id = State.id(state);
    let x = (3 - state.crates[1].y) * 75;
    let y = (3 - state.crates[0].y) * 75;
    let z = (state.crates[1].x - 2) * 75;
    // if (parent_node !== undefined) {
    //     x = network.body.nodes[parent_node.id].x;
    //     y = network.body.nodes[parent_node.id].y;
    // }
    let pos = suggested_positions[id];
    if (pos !== undefined)  {
        x = pos.x;
        y = pos.y;
        z = pos.z;
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
        z: z,
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
while (pending_expansion.length > 0) {
    expandNode(pending_expansion.shift());
}
console.log(nodes);
console.log(edges);


// Random tree
const N = 300;
const gData = {
    nodes: nodes.map((node: Node) => ({
        id: node.id,
        fx: node.x,
        fy: node.y,
        fz: node.z,
        label: node.label,
        state: node.state,
    })),
    links: edges.map(edge => {
        return {
            source: edge.from,
            target: edge.to,
        }
    })
};

if (extra_edge) {
    gData.links.push({
        // extra_regular_grid
        source: "1:1[0:2,1:3]",
        target: "3:3[0:2,1:2]",
        // dashes: true,
        // width: 3,
        // color: "red",
    });

    gData.links.push({
        // extra_collapse
        source: "1:1[0:3,1:2]",
        target: "3:3[0:3,1:2]",
        // width: 2,
        // arrows: "",
        // length: 1,
    });
}

// await new Promise(r => setTimeout(r, 200));

await new Promise(r => {
    let img = new Image()
    spritesheet.onload = r;
})


// spritesheet.onload = function() {
const Graph = ForceGraph3D()
    (document.getElementById("mynetwork"))
        .nodeThreeObject((node: Node) => {
            // console.log()
            // let asdf = State.drawStateToCanvas(node.state);
            // console.log(asdf.toDataURL())
            // const imgTexture = new THREE.TextureLoader().load(`./sokoban_spritesheet.png`);
            // const imgTexture = new THREE.TextureLoader().load(`./imgs/${img}`);
            const imgTexture = new THREE.CanvasTexture(State.drawStateToCanvas(node.state));
            const material = new THREE.SpriteMaterial({ map: imgTexture });
            const sprite = new THREE.Sprite(material);
            sprite.scale.set(30, 36);
            return sprite;
        })
        .graphData(gData)
        .linkDirectionalArrowLength(3.5)
        .linkDirectionalArrowRelPos(0)
        .linkWidth(1)
        .nodeRelSize(25)
        // .enableNodeDrag(false)
        // .linkOpacity(1);
        // .linkCurvature(0.25);
// }

setTimeout(() => {
    Graph.enableNodeDrag(false);
}, 500);

document.getElementById("unfold")!.addEventListener("click", () => {
    Graph.graphData()["nodes"].forEach(x => {
        delete x.fx;
        delete x.fy;
        delete x.fz;
    });
    Graph.d3ReheatSimulation();
    Graph.enableNodeDrag(true);
    console.log(Graph.enableNodeDrag())
    Graph.d3VelocityDecay(1);
    for (let k = 0; k <= 1; k+=.05) {
        setTimeout(() => {
            Graph.d3VelocityDecay(1.0 - .6 * k);
        }, 50 + k * 500);
    }
})
