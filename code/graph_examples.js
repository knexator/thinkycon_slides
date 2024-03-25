// @ts-ignore
import vis from "https://unpkg.com/vis-network@9.1.2/dist/vis-network.esm.min.js";
import { fromCount } from "./kommon.js";
import { randomInt } from "./random.js";
// import Rand from "rand-seed";
import Rand from "./node_modules/rand-seed/dist/rand-seed.es.js";
import { mod } from "./math.js";
console.log(Rand);
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
});
let rand = new Rand("2");
const bottleneck = [
    ...fromCount(50 * 2, _ => [randomInt(rand, 0, 50), randomInt(rand, 0, 50)]),
    ...fromCount(50 * 2, _ => [50 + randomInt(rand, 0, 50), 50 + randomInt(rand, 0, 50)]),
    [0, 50],
    // [1, 0],
    // [2, 0],
    [50, 51],
    [50, 52],
];
rand = new Rand("1");
const double_bottleneck = [
    ...fromCount(50 * 2, _ => [randomInt(rand, 0, 50), randomInt(rand, 0, 50)]),
    ...fromCount(50 * 2, _ => [50 + randomInt(rand, 0, 50), 50 + randomInt(rand, 0, 50)]),
    ...fromCount(50 * 2, _ => [100 + randomInt(rand, 0, 50), 100 + randomInt(rand, 0, 50)]),
    [0, 50],
    // [1, 0],
    // [2, 0],
    [50, 51],
    [50, 52],
    [55, 100],
];
rand = new Rand("1");
const dead_ends = [
    ...fromCount(50 * 2, k => [randomInt(rand, 0, k), k]),
];
rand = new Rand("0");
const tight = [
    ...fromCount(100, k => [randomInt(rand, k - 5, k), k]),
    ...fromCount(100, k => [randomInt(rand, k - 5, k), randomInt(rand, k, k + 5)]),
    // ...fromCount(50, k => [randomInt(rand, k - 10, k), randomInt(rand, k, k + 10)] as [number, number]),
    // ...fromCount(50, k => [randomInt(rand, k - 10, k), randomInt(rand, k, k + 10)] as [number, number]),
];
const all_edges = [bottleneck, double_bottleneck, dead_ends, tight];
let cur_selected = 0;
update();
window.addEventListener("keydown", (ev) => {
    if (ev.code === "KeyD" || ev.code === "ArrowRight") {
        cur_selected = mod(cur_selected + 1, all_edges.length);
        update();
        ev.preventDefault();
        return false;
    }
    if (ev.code === "KeyA" || ev.code === "ArrowLeft") {
        cur_selected = mod(cur_selected - 1, all_edges.length);
        update();
        ev.preventDefault();
        return false;
    }
});
function update() {
    nodes.clear();
    edges.clear();
    const raw_edges = all_edges[cur_selected];
    for (const [source_id, target_id] of raw_edges) {
        if (source_id === target_id)
            continue;
        if (nodes.get(source_id) === null)
            addNode(source_id);
        if (nodes.get(target_id) === null)
            addNode(target_id);
        const edge_id = `${source_id}_${target_id}`;
        if (edges.get(edge_id) !== null)
            continue;
        edges.add({
            id: edge_id,
            from: source_id,
            to: target_id,
        });
    }
    network.stabilize(100);
}
// Separated this to add styling
function addNode(id) {
    let won = false;
    let cur_node = {
        id: id,
        won: won,
        expanded: false,
        color: "#fcba03",
        // shape: (state === State.initialState) ? "diamond" : won ? "star" : "dot",
        shape: "dot",
        x: 0,
        y: 0,
    };
    nodes.add(cur_node);
    console.log("added node");
}
// network.moveTo({position: {x: -200, y: 0}});
