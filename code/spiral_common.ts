// @ts-ignore
import vis from "https://unpkg.com/vis-network@9.1.2/dist/vis-network.esm.min.js"

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
            // arrows: "to",
            smooth: false,
        },
        nodes: {
            shape: "dot",
            // fixed: true,
        },
        physics: {
            enabled: false,
            barnesHut: {
                // theta: 0.5,
                gravitationalConstant: -200000,
                centralGravity: 0.0,
                // springLength: 15,
                springConstant: 0.1,
                // damping: 0.25,
                // avoidOverlap: 0
            },
            minVelocity: 0,
        },
    }
);

function triggerAction() {
    let parent_window = window.parent;
    // parent_window.frames
    for (let frame of parent_window.document.querySelectorAll("iframe")) {
        if (frame.contentWindow == window) {
            let rect = frame.getBoundingClientRect();
            if (rect.top + rect.height / 2 < window.parent.innerHeight) {
                autoStep();
                window.parent.removeEventListener("scroll", triggerAction);
                // network.moveTo({scale: .8, animation: {duration: 1000, easingFunction: "easeInOutCubic"}});
                setTimeout(() => {
                    network.moveTo({scale: .15, animation: {duration: 1500, easingFunction: "linear"}});
                }, 900)
            }
        }
    }
};
window.parent.addEventListener("scroll", triggerAction);
// setTimeout(autoStep, 100);

function unfold() {
    network.physics.physicsEnabled = true;
    network.physics.options.enabled = true;
    network.startSimulation();
    console.log("pium");
}

let button = document.querySelector("button")!;
button.addEventListener("click", () => {
    unfold();
    button.disabled = true;
})

let expandCount = 1;
let expandTime = 100;
let n_total = 180;
let n_done = 0;
let cur_angle = 2;
let cur_dist_to_center = 500;
function autoStep() {
    for (let k=0; k<expandCount; k++) {
        if (n_done >= n_total) {
            // end expansion
            button.disabled = false;
            return;
        };
        cur_dist_to_center = 300 + 200 * Math.sqrt(100 * n_done / n_total);
        cur_angle += 70 / cur_dist_to_center;

        let angle = cur_angle + (Math.random()-.5) * .15;
        let dist = cur_dist_to_center + (Math.random()-.5) * 230;
        let new_node = {
            id: n_done.toString(),            
            x: Math.cos(angle) * dist,
            y: Math.sin(angle) * dist,
            // fixed: true,
        }
        nodes.add(new_node);

        for (let j=n_done - 6; j<n_done; j++) {
            if (j < 0) continue;
            let other_node = nodes.get(j.toString());
            if (other_node === null) continue;

            let dx = other_node.x - new_node.x;
            let dy = other_node.y - new_node.y;
            let dist_sq = dx*dx + dy*dy;
            if ((n_done-j)<2 || dist_sq < 70000) {
                edges.add({
                    id: `${new_node.id}_${other_node.id}`,
                    from: new_node.id,
                    to: other_node.id,
                    length: Math.sqrt(dist_sq),
                })
            }
        }

        // cur_angle += (.2 - ((cur_dist_to_center - 1100) * 0.00008)) * .35;
        // cur_dist_to_center += 25 * .6 * (1.3 - cur_dist_to_center / 4000);

        /*let time = 100 + 400 * n_done / n_total;
        time *= 3;
        cur_angle = .25 * Math.SQRT2 * Math.sqrt(time);
        cur_dist_to_center = time;*/        

        n_done += 1;
    }
    if (expandTime < 50) {
        expandCount = Math.min(expandCount + .1, 10);
    } else {
        expandTime *= .92;
    }
    setTimeout(autoStep, expandTime);
}

network.moveTo({scale: .5});
// network.stopSimulation();
