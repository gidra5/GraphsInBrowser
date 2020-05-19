var spanningTreeTypes = {
  KRUSKAL: 'Kruskal',
  PRIM: 'Prim',
}

var spanningTree = (graph, startingIndex, type) => {
    let spanningTreeGraph = tree(graph.directed, true);
    const visited = [startingIndex];
    let traverseFunc = () => { };

    switch (type) {
        case spanningTreeTypes.KRUSKAL: {
            traverseFunc = () => {

            }
            break;
        }
        case spanningTreeTypes.PRIM: {
            spanningTreeGraph.addVertex(-1, graph.tags[startingIndex]);
            spanningTreeGraph.restructureTree();

            traverseFunc = () => {
                if (visited.length < graph.verticies.length) {
                    const adjacent = graph.edgesInfo
                        .map(({ e, w }) => graph.directed ? { e, w } : [{ e, w }, { e: { i: e.j, j: e.i }, w }])
                        .flat()
                        .filter(({ e, w }) => visited.includes(e.i) && !visited.includes(e.j));

                    const p = adjacent.reduce((acc, v) => acc.w > v.w ? v : acc, adjacent[0]);

                    spanningTreeGraph.addVertex(spanningTreeGraph.verticies.findIndex(v => v.tag === graph.tags[p.e.i]), graph.tags[p.e.j], undefined, undefined, p.w);
                    visited.push(p.e.j);
                    spanningTreeGraph.restructureTree();
                    console.log('kek');
                } else return 'done';
            }
            break;
        }
    }

    return {
        get spanningTree() {
            return spanningTreeGraph;
        },
        traverse() {
            return traverseFunc();
        }
    };
}