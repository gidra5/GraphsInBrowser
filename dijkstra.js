var dijkstra = (graph, startingIndex) => {
    const marking = [];
    const permanent = [];
    const P = [];
    let currIndex = startingIndex;

    return {
        traverse() {
            if (permanent.length === 0) {
                marking[startingIndex] = 0;
                permanent.push(startingIndex);
                graph.verticiesInfo[startingIndex].color = createVector(20, 20, 200);
            }
            if (permanent.length === graph.verticiesInfo.length)
                return 'done';
            let adjacentVerticies = graph.edgesInfo
                .map(({ e, w }) => graph.directed ? { e, w } : [{ e, w }, { e: { i: e.j, j: e.i }, w }])
                .flat()
                .filter(({ e }) => e.i === currIndex && e.i !== e.j)
                .map(({ e, w }) => ({ j: e.j, w }))
                .filter(v => !permanent.includes(v.j));

            adjacentVerticies.forEach(v => {
				console.log(marking[currIndex], marking[v.j], v);
                if (marking[v.j] === undefined) {
                    P[v.j] = currIndex;
                    marking[v.j] = marking[currIndex] + v.w;
                }
                else if (marking[v.j] > marking[currIndex] + v.w) {
                    marking[v.j] = marking[currIndex] + v.w;
                    P[v.j] = currIndex;
                }
				console.log(marking[currIndex], marking[v.j], v);
            });

            graph.verticiesInfo[currIndex].color = createVector(20, 20, 200);
            currIndex = marking.indexOf(marking.filter((v, i) => !permanent.includes(i)).reduce((acc, v, i) => (acc && v) ? min(acc, v) : v));
            permanent.push(currIndex);
            graph.verticiesInfo[currIndex].color = createVector(200, 200, 20);
			console.log(P);
			console.log(marking);
        },
        draw() {
            push();
            noStroke();
            textSize(8);
            for (let i = 0; i < graph.verticiesInfo.length; ++i) {
                text(marking[i], graph.verticies[i].x, graph.verticies[i].y + 10);
            }
            pop();
        },
        get paths() {
            const paths = [];

            for (let i = 0; i < P.length; ++i) {
                if (i === startingIndex) continue;
                const path = [i];
                while (path[0] !== startingIndex) {
                    path.unshift(P[path[0]]);
                }
                paths.push(path.map(v => v+1));
            }
            return paths;
        },
        get marking() { return marking; }
    };
}