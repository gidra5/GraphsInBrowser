window.graphTraversalTypes = {
  DEPTH: 'Depth',
  BREADTH: 'Breadth',
}

window.graphTraversal = (graph, startingIndex, type) => {
    const visited = [];
    let traversalTreeGraph = tree(true);
    let inOriginalForm = window.graph(traversalTreeGraph.verticies, traversalTreeGraph.edges, true);

    let currentIndex = startingIndex;
    let stepForwardFunc;

    const recreateGraph = () => {
        inOriginalForm = window.graph(visited.map(i => graph.verticiesInfo[i]).map(v => ({
                tag: v.tag,
                color: (v.tag === graph.tags[currentIndex] ? createVector(255, 120, 10) : createVector(0)),
                pos: v.pos
            })), traversalTreeGraph.edges.map( v => ({ e : v, color: createVector(0) })), true);

        traversalTreeGraph.recreateGraph(graph.tags[currentIndex]);
    }

    const visitVertex = (vertexIndex, from = -1) => {
        visited.push(vertexIndex);
        traversalTreeGraph.addVertex(traversalTreeGraph.verticies.findIndex(v => v.tag === graph.tags[from]), graph.tags[vertexIndex]);
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
                            .map(({ i, j }) => graph.directed ? { i, j } : [{ i, j }, { i: j, j: i }])
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
                    const index = graph.verticiesInfo.findIndex((v, i) => !visited.includes(i));
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
                        .map(({ i, j }) => graph.directed ? { i, j } : [{ i, j }, { i: j, j: i }])
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
                    const index = graph.verticiesInfo.findIndex((v, i) => !visited.includes(i));
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
        get traversalTree() {
            return traversalTreeGraph;
        },
        get inOriginalForm() {
            return inOriginalForm;
        },
        get indiciesMappingMatrix() {
            const res = new Array(graph.tags.length).fill(new Array(graph.tags.length).fill(0))
                .map((row, i) => row.map((item, j) => j === visited[i] ? 1 : 0));
            res1 = res.map((v, i) => i).filter(v => !res[v].reduce((acc, v) => acc || v, false));
            res1.forEach(v => res[v][v] = 1);
            return res;
        },
        changeIndexing() {
            if (visited.length >= graph.verticiesInfo.length) {
                if (!prevTags) {
                    prevTags = graph.tags;
                    graph.tags = prevTags.map((tag, i, tags) => tags[visited.indexOf(i)]);
                    console.log(visited);
                } else {
                    graph.tags = prevTags;
                    prevTags = undefined;
                }
            } else console.log('not done yet');
        },
        traverse() {
            stepForwardFunc();
            graph.setVColors(graph.getVColors()
                .map((v, i) => visited.includes(i) ?
                    i === currentIndex ? createVector(255, 120, 10) : createVector(150, 75, 0) : v));
            const e = traversalTreeGraph.edges.map(({ i, j }) => ({ i: visited[i], j: visited[j] }));
            graph.setEColors(graph.getEdges()
                .map((edge, i) => e.find(({ i, j }) => i === edge.i && j === edge.j) ? createVector(255, 120, 10) : graph.getEColors()[i]));
        },
    }
};