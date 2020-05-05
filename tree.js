var tree = (directed, weighted) => {
    let verticies = [];
    let edges = [];
    let tree = window.graph(verticies, edges, directed, weighted);
    let height = 0;

    //gives how many space is needed for all children below
    const getWidth = parentIndex => {
        const children = weighted ? edges.filter(({ e }) => e.i === parentIndex).map(({ e }) => e.j) : edges.filter(({ i, j }) => i === parentIndex).map(({ i, j }) => j);

        if (children.length === 0) return 1;
        else return children.reduce((acc, v) => acc + getWidth(v), 0);
    };

    return {
        get verticies() {
            return verticies;
        },
        get edges() {
            return edges;
        },
        get tree() {
            return tree;
        },
        recreateGraph(i) {
            const input = verticies.map(v =>
                ({
                    tag: v.tag,
                    color: (v.tag === i ? createVector(255, 120, 10) : createVector(0)),
                    pos: v.pos
                }));

            tree = window.graph(input, weighted ? edges.map(v => ({ e: v.e, color: createVector(0), w: v.w })) : edges.map(v => ({ e: v, color: createVector(0) })), directed);
        },
        //places verticies of treversal tree in a correct tree shape starting from parent
        restructureTree(parentIndex = 0, width = getWidth(parentIndex)) {
            const parentVertex = verticies[parentIndex];
            const children = weighted ? edges.filter(({ e }) => e.i === parentIndex).map(({ e }) => e.j) : edges.filter(({ i, j }) => i === parentIndex).map(({ i, j }) => j);
            let offset = 0;
            children.forEach(child => {
                const childWidth = getWidth(child);
                offset += childWidth / 2;
                verticies[child].pos =
                    p5.Vector.add(parentVertex.pos, createVector(-width / 2 + offset, 1).mult(2 * diameter));
                this.restructureTree(child, childWidth);
                offset += childWidth / 2;
            });
        },
        //adds new vertex with specified params to the end of verticies list
        addVertex(parentIndex = -1, tag, color = createVector(0), pos = createVector(0), edgeWeight = 0) {
            const findRoot = (v, depth = 0) => {
                let pI = { i: v };
                while (pI) {
                    depth++;
                    const k = weighted ? edges.find(v => v.e.j === pI.i) : edges.find(v => v.j === pI.i);
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

                edges.push(weighted ? { e: { i: parentIndex, j: verticies.length }, w: edgeWeight } : { i: parentIndex, j: verticies.length });
            } else {
                height++;
                pos = createVector(0, height * diameter * 2);
            }
            verticies.push({ tag, color, pos });

            roots.forEach(root => this.restructureTree(root));
            this.recreateGraph();
        },
    };
};