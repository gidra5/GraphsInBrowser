window.graphTraversalTypes = {
  DEPTH: 'Depth',
  BREADTH: 'Breadth',
}

window.graphTraversal = (graph, startingIndex, type) => {
    const verticies = [];
    const visited = [];
    const edges = [];
    let height = 0;
    let traversalTreeGraph = window.graph(verticies, edges, true);
    let inOriginalForm = window.graph(verticies, edges, true);

    let currentIndex = startingIndex;
    let stepForwardFunc = () => { };

    const recreateGraph = () => {
        const input = verticies.map(v =>
            ({
                tag: v.tag,
                color: (v.tag === graph.getTags()[currentIndex] ? createVector(255, 120, 10) : createVector(0)),
                pos: v.pos
            }));

        inOriginalForm = window.graph(visited.map(i => graph.getVertInfo()[i]).map(v => ({
                tag: v.tag,
                color: (v.tag === graph.getTags()[currentIndex] ? createVector(255, 120, 10) : createVector(0)),
                pos: v.pos
            })), edges.map( v => ({ e : v, color: createVector(0) })), true);

        traversalTreeGraph = window.graph(input, edges.map( v => ({ e : v, color: createVector(0) })), true);
    }

    //gives how many space is needed for all children below
    const getWidth = parentIndex => {
        const children = edges.filter(({ i, j }) => i === parentIndex).map(({ i, j }) => j);

        if (children.length === 0) return 1;
        else return children.reduce((acc, v) => acc + getWidth(v), 0);
    };

    //places verticies of treversal tree in a correct tree shape starting from parent
    const restructureTree = (parentIndex = 0, width = getWidth(parentIndex)) => {
        const parentVertex = verticies[parentIndex];
        const children = edges.filter(({ i, j }) => i === parentIndex).map(({ i, j }) => j);
        let offset = 0;
        children.forEach(child => {
            const childWidth = getWidth(child);
            offset += childWidth / 2;
            verticies[child].pos =
                p5.Vector.add(parentVertex.pos, createVector(-width / 2 + offset, 1).mult(2 * diameter));
            restructureTree(child, childWidth);
            offset += childWidth / 2;
        });
    };

    //adds new vertex with specified params to the end of verticies list
    const addVertex = (parentIndex = -1, tag, color = createVector(0), pos = createVector(0)) => {
        const findRoot = (v, depth = 0) => {
            let pI = { i: v };
            while (pI) {
                depth++;
                const k = edges.find(v => v.j === pI.i);
                if (!k) return { i: pI.i, depth };
                else pI = k;
            }
            // const parent = edges.find(e => e.j === v);
            // if (parent) return findRoot(parent.i, ++depth);
            // else return { v, depth };
        }
        const roots = verticies.map((v, i) => findRoot(i).i).filter((v, i, a) => a.indexOf(v) === i);

        if (parentIndex >= 0) {
            const root = findRoot(parentIndex);
            if (!verticies.filter((v, i) => root.i === findRoot(i).i)
                          .find((v, i) => findRoot(i).depth > root.depth))
                height++;
            edges.push({ i: parentIndex, j: verticies.length });
        } else {
            height++;
            pos = createVector(0, height * diameter * 2);
        }
        verticies.push({ tag, color, pos });

        roots.forEach(root => restructureTree(root));
        recreateGraph();
    }

    const visitVertex = (vertexIndex, from = -1) => {
        visited.push(vertexIndex);
        addVertex(verticies.findIndex(v => v.tag === graph.getTags()[from]), graph.getTags()[vertexIndex]);
    };

    switch (type) {
        case graphTraversalTypes.BREADTH: {
            const breadthQueue = [];
            breadthQueue.push({ index: startingIndex, parent: -1 });

            stepForwardFunc = () => {
                if (breadthQueue.length > 0) {
                    const current = breadthQueue.shift();
                    currentIndex = current.index;
                    if (!visited.includes(currentIndex)) {
                        let adjacentVerticies = graph.getEdges()
                            .map(({ i, j }) => graph.isDirected() ? { i, j } : [{ i, j }, { i: j, j: i }])
                            .flat()
                            .filter(({ i, j }) => i === currentIndex && i !== j)
                            .map(({ i, j }) => j)
                            .filter(j => !visited.includes(j))
                            .map(v => ({ index: v, parent: currentIndex }));

                        visitVertex(current.index, current.parent);
                        breadthQueue.push(...adjacentVerticies);
                    }
                    recreateGraph();
                } else {
                    const index = graph.getVertInfo().findIndex((v, i) => !visited.includes(i));
                    if (index !== -1) breadthQueue.push({ index: index, parent: -1 });
                    else return 'done';
                }
            };
            break;
        }
        case graphTraversalTypes.DEPTH: {
            const depthStack = [];
            depthStack.push(startingIndex);
            visitVertex(startingIndex);

            stepForwardFunc = () => {
                if (depthStack.length > 0) {
                    currentIndex = depthStack[depthStack.length - 1];
                    let notVisited = graph.getEdges()
                        .map(({ i, j }) => graph.isDirected() ? { i, j } : [{ i, j }, { i: j, j: i }])
                        .flat()
                        .filter(({ i, j }) => i === currentIndex)
                        .map(({ i, j }) => j)
                        .filter(j => !visited.includes(j));
                    if (notVisited.length > 0) {
                        let q = notVisited.pop();
                        visitVertex(q, currentIndex);
                        depthStack.push(q);
                    } else {
                        depthStack.pop();
                        recreateGraph();
                    }
                } else {
                    const index = graph.getVertInfo().findIndex((v, i) => !visited.includes(i));
                    if (index !== -1) {
                        depthStack.push(index);
                        visitVertex(index);
                    } else return 'done';
                }
            };
            break;
        }
    }
    let prevTags;

    return {
        getTraversalTree() {
            return traversalTreeGraph;
        },
        getInOriginalForm() {
            return inOriginalForm;
        },
        getIndiciesMappingMatrix() {
            const res = new Array(graph.getTags().length).fill(new Array(graph.getTags().length).fill(0))
                .map((row, i) => row.map((item, j) => j === visited[i] ? 1 : 0));
            res1 = res.map((v, i) => i).filter(v => !res[v].reduce((acc, v) => acc || v, false));
            res1.forEach(v => res[v][v] = 1);
            return res;
        },
        changeIndexing() {
            if (visited.length >= graph.getVertInfo().length) {
                if (!prevTags) {
                    prevTags = graph.getTags();
                    graph.setTags(prevTags.map((tag, i, tags) => tags[visited.indexOf(i)]));
                    console.log(visited);
                } else {
                    graph.setTags(prevTags);
                    prevTags = undefined;
                }
            } else console.log('not done yet');
        },
        traverse: () => {
            stepForwardFunc();
            graph.setVColors(graph.getVColors()
                .map((v, i) => visited.includes(i) ?
                    i === currentIndex ? createVector(255, 120, 10) : createVector(150, 75, 0) : v));
            const e = edges.map(({ i, j }) => ({ i: visited[i], j: visited[j] }));
            graph.setEColors(graph.getEdges()
                .map((edge, i) => e.find(({ i, j }) => i === edge.i && j === edge.j) ? createVector(255, 120, 10) : graph.getEColors()[i]));
        },
    }
};