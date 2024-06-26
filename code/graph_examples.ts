// @ts-ignore
import vis from "https://unpkg.com/vis-network@9.1.2/dist/vis-network.esm.min.js"
import { fromCount } from "./kommon.js";
import { randomInt } from "./random.js";
// import Rand from "rand-seed";
import Rand from "./node_modules/rand-seed/dist/rand-seed.es.js";
import { mod } from "./math.js";


interface Node {
    id: number,
    shape: string,
    won: boolean,
    color: string,
    x: number,
    y: number,
}

function makeNetwork(raw_edges: [number, number][]): HTMLDivElement {
    let new_div = document.createElement("div");
    document.body.appendChild(new_div);

    // create a network
    let nodes = new vis.DataSet();
    let edges = new vis.DataSet();
    let network = new vis.Network(
        // document.getElementById("mynetwork"),
        new_div,
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


    // Separated this to add styling
    function addNode(id: number) {
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
        } as Node;
        nodes.add(cur_node);
    }

    for (const [source_id, target_id] of raw_edges) {
        if (source_id === target_id) continue;
        if (nodes.get(source_id) === null) addNode(source_id);
        if (nodes.get(target_id) === null) addNode(target_id);
        const edge_id = `${source_id}_${target_id}`;
        if (edges.get(edge_id) !== null) continue;
        edges.add({
            id: edge_id,
            from: source_id,
            to: target_id,
        });
    }
    network.stabilize(100);

    return new_div
}

// network.moveTo({position: {x: -200, y: 0}});

let rand = new Rand("2");
const bottleneck: [number, number][] = [
    ...fromCount(50 * 2, _ => [randomInt(rand, 0, 50), randomInt(rand, 0, 50)] as [number, number]),
    ...fromCount(50 * 2, _ => [50 + randomInt(rand, 0, 50), 50 + randomInt(rand, 0, 50)] as [number, number]),
    [0, 50],
    // [1, 0],
    // [2, 0],
    [50, 51],
    [50, 52],
];

rand = new Rand("1");
const double_bottleneck: [number, number][] = [
    ...fromCount(50 * 2, _ => [randomInt(rand, 0, 50), randomInt(rand, 0, 50)] as [number, number]),
    ...fromCount(50 * 2, _ => [50 + randomInt(rand, 0, 50), 50 + randomInt(rand, 0, 50)] as [number, number]),
    ...fromCount(50 * 2, _ => [100 + randomInt(rand, 0, 50), 100 + randomInt(rand, 0, 50)] as [number, number]),
    [0, 50],
    // [1, 0],
    // [2, 0],
    [50, 51],
    [50, 52],
    [55, 100],
];

rand = new Rand("1");
const dead_ends: [number, number][] = [
    ...fromCount(50 * 2, k => [randomInt(rand, 0, k), k] as [number, number]),
];

rand = new Rand("0");
const tight: [number, number][] = [
    ...fromCount(100, k => [randomInt(rand, k - 5, k), k] as [number, number]),
    ...fromCount(100, k => [randomInt(rand, k - 5, k), randomInt(rand, k, k + 5)] as [number, number]),
    // ...fromCount(50, k => [randomInt(rand, k - 10, k), randomInt(rand, k, k + 10)] as [number, number]),
    // ...fromCount(50, k => [randomInt(rand, k - 10, k), randomInt(rand, k, k + 10)] as [number, number]),
];

const all_edges: [number, number][][] = [bottleneck, double_bottleneck, dead_ends, tight];
let cur_selected = 0;
const divs = all_edges.map(x => makeNetwork(x));

function updateVisible() {
    divs.forEach((x, k) => {
        x.style.display = k === cur_selected ? "unset" : "none";
    });
}

updateVisible();

window.addEventListener("keydown", (ev: KeyboardEvent) => {
    if (ev.code === "KeyD" || ev.code === "ArrowRight") {
        cur_selected = mod(cur_selected + 1, all_edges.length);
        updateVisible();
        ev.preventDefault();
        return false;
    }
    if (ev.code === "KeyA" || ev.code === "ArrowLeft") {
        cur_selected = mod(cur_selected - 1, all_edges.length);
        updateVisible();
        ev.preventDefault();
        return false;
    }
    if (window.parent !== window) {
        // @ts-expect-error
        window.parent.keyPressed(ev.code);
    }
});
