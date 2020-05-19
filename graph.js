var parameters = {
    arrowThicknessStep: 0.1,
    arrowThicknessMax: 1,
    arrowThicknessMin: 0.1,
    arrowThickness: 0.8,
    fractionStep: 0.005,
    fractionMax: 0.5,
    fractionMin: 0.005,
    fraction: 0.5,
    distanceIncStep: 0.1,
    distanceIncMax: 10,
    distanceIncMin: 1,
    distanceInc: 5, //distanceInc - increment of distance
    minDistStep: 0.01,
    minDistMax: 1.5,
    minDistMin: 0.75,
    minDist: 1,
};

const diameter = 40;
const arrowSharpness = Math.PI / 6; //angle at the arrow's head in RADIANS
let arrowLength = diameter * parameters.arrowThickness / 6;
let minDist = diameter * parameters.minDist;

window.graph = (verticiesInfo, edgesInfo, directed, weighted) => {
    const edges = edgesInfo.map(v => v.e);
    const inDegrees = [];
    const outDegrees = [];

    //Arrow - array of points that arrow consist of
    const arrows = [];

    //Specific to the vertex offset so that if one arrow passed near vertex
    //next arrow that will pass will be (distanceInc) px further away than previous
    const arrowVertex_offset = [];

    //matrix multiplication
    const mult = (mat1, mat2) => {
        const mat = new Array(mat1.length).fill(0).map(() => new Array(mat2[0].length).fill(0));

        for (let i = 0; i < mat1.length; ++i) {
            for (let j = 0; j < mat2.length; ++j) {
                for (let k = 0; k < mat1[0].length; ++k)
                    mat[i][j] += mat1[i][k] * mat2[k][j];
            }
        }

        return mat;
    }
    const getIdentity = (length) => new Array(length).fill(0).map((v1, i1) =>
                                    new Array(length).fill(0).map((v2, i2) => i1 === i2 ? 1 : 0));

    //Adjacency matrix of this graph
    const matrix = [];

    for (let n = 0; n < verticiesInfo.length; ++n) {
        const row = [];

        for (let m = 0; m < verticiesInfo.length; ++m)
            row[m] = edges.find( ({i, j}) => (i === n && j === m) || (!directed && i === m && j === n) ) ? 1 : 0;

        matrix.push(row);
    }

    let reachabilityMatrix = getIdentity(verticiesInfo.length);

    for (let i = 0; i < verticiesInfo.length; ++i)
        reachabilityMatrix = mult(reachabilityMatrix, matrix)
                            .map((value, index1) => value
                            .map((value, index2) => min(value + (index1 === index2 ? 1 : 0), 1)));

	let connectivityMatrix = reachabilityMatrix.map((item, i1) => item.map((item, i2) => reachabilityMatrix[i1][i2] * reachabilityMatrix[i2][i1]));

	//since we could reorder indexes in such a way that there blocks of 1s on diagonals
	//only rows that are unique represent condensations
	const condensated = [];

	for (let n = 0; n < connectivityMatrix.length; ++n) {
		let row = connectivityMatrix[n];
		let seen = false;

		for(let m = 0; m < row.length; ++m) {
			seen = row[m] && condensated.flat().includes(m);
			if(seen) break;
		}
		if(seen) continue;

		condensated.push(row.map( (v, i) => v ? i + 1 : 0).filter( (v, i) => v !== 0).map( v => v - 1));
    }

    //setting up condensated graph

    //verticies that represent verticies in condensated graph
    //are chosen by first vertex in condensation
    const condensatedVert = condensated.map(value => verticiesInfo[value[0]].pos);

    const condensatedEdges = [];

    // if vert1 in cond1 and vert2 in cond2 have edge then between cond1 and cond2 in condGraph
    // should be an edge
    for (let i = 0; i < condensated.length; ++i) {
        for (let j = 0; j < condensated.length; ++j) {
            let found = false;
            for (let m = 0; m < condensated[i].length; ++m) {
                for (let n = 0; n < condensated[j].length; ++n) {
                    const p = condensated[i][m];
                    const s = condensated[j][n];

                    if (reachabilityMatrix[p][s] === 1 && i !== j) {
                        condensatedEdges.push({i, j});
                        found = true;
                        break;
                    }
                }
                if (found) break;
            }
            if (found) break;
        }
    }

    //making lambda to avoid immediate recurrence
    let condensationGraph = () => graph(condensatedVert.map((v, i) => ({tag: verticiesInfo[i].tag, color: verticiesInfo[i].color, pos: v})), condensatedEdges, directed);

    //calculating degrees for verticies in graph
    for (let i = 0; i < verticiesInfo.length; ++i) {
        outDegrees[i] = edges.filter(item => item.i === i).length;
        inDegrees[i] = edges.filter(item => item.j === i).length;
    }

    const isIntersecting = (point1, point2, edge, minDist) => {
        //Function that checks if given section of line
        //is on at least minDist distance from centers of
        //all but edge's verticies in graph

        //Returns nothing if no vertex is intersected as given
        //else returns vertex that closest to the point1 and being intersected

        const {i, j} = edge;
        let closestVertex;

        for (const vertexInfo of verticiesInfo) {
            if(vertexInfo === verticiesInfo[i] || vertexInfo === verticiesInfo[j])
                continue;

            const a = p5.Vector.sub(vertexInfo.pos, point2);
            const b = p5.Vector.sub(vertexInfo.pos, point1);
            const c = p5.Vector.sub(point2, point1).normalize();
            const dist = (a.dot(c) > 0) ? a.mag() :
                         (b.dot(c) < 0) ? b.mag() :
                         abs(c.y * b.x - c.x * b.y);
            if (dist > minDist) continue;

            if (!closestVertex) closestVertex = {vertex: vertexInfo, dist: b.mag()};

            if (b.mag() < closestVertex.dist) closestVertex = {vertex: vertexInfo, dist: b.mag()};
        }

        if (closestVertex)
            return closestVertex.vertex;
    }

    const constructArrow = (edge) => {
        const {i, j} = edge;
        const points = []; //points that arrow will consist of

        points.push(verticiesInfo[i].pos);

        //if arrow doesn't point to itself search for a way to the end vertex
        if (i !== j) {
            //check whether there is a vertex on the way
            let blockingVertex = isIntersecting(points[points.length - 1], verticiesInfo[j].pos, edge, minDist);

            //get its index to increase offset before processing more
            let blockingIndex = verticiesInfo.indexOf(blockingVertex);

            if (blockingVertex)
                arrowVertex_offset[blockingIndex] = arrowVertex_offset[blockingIndex] + parameters.distanceInc | .01;
            else if(edges.find(({i, j}) => i === edge.j && j === edge.i)) {
                //if its straight line and we have arrow in the opposite direction
                //then compute direction in which current arrow is facing
                const vec = p5.Vector.sub(verticiesInfo[i].pos, verticiesInfo[j].pos).normalize();

                //and move middle point of the resulting arrow some amount away
                //perpendicular to the direction in which it points
                points.push(p5.Vector.lerp(verticiesInfo[i].pos, verticiesInfo[j].pos, 0.5)
                                     .add(createVector(vec.y, -vec.x).mult(diameter / 4)));
            }

            let n = 0;
            while (blockingVertex && n<1000) {
                //geometry stuff
                //basically finds point such that next segment will be tangent and
                //given distance away from the blocking vertex
                //and checks again if there are still verticies that block arrow
                const dist = minDist + arrowVertex_offset[blockingIndex];
                const point = p5.Vector.lerp(points[points.length - 1], verticiesInfo[j].pos, parameters.fraction);

                const c = p5.Vector.sub(point, points[points.length - 1]).normalize();
                const b = p5.Vector.sub(blockingVertex.pos, points[points.length - 1]);
                const angle = Math.asin((c.y * b.x - c.x * b.y)/b.mag());
                let angleSign = Math.sign(angle); if(!angleSign) angleSign = 1;

                const correctionAngle = angleSign * Math.asin( min(dist / b.mag(), 1)) - angle;

                point.sub(points[points.length - 1]);
                point.rotate(correctionAngle)
                     .add(points[points.length - 1]);

                //geometry stuff ends
                points.push(point);

                blockingVertex = isIntersecting(points[points.length - 1], verticiesInfo[j].pos, edge, dist);
                //if still have blocking vertex that is different from previous
                if (blockingIndex !== verticiesInfo.indexOf(blockingVertex)) {
                    //we change index and increase offset for new vertex
                    blockingIndex   = verticiesInfo.indexOf(blockingVertex);

                    arrowVertex_offset[blockingIndex] = arrowVertex_offset[blockingIndex] + parameters.distanceInc | .01;
                }
                n++;
            }
        } else {
            //if arrow is pointing to itself, then just generate two points to make a loop
            const vec1 = verticiesInfo[i].pos.copy().add(createVector(minDist, 0).rotate( Math.PI / 6));
            const vec2 = verticiesInfo[i].pos.copy().add(createVector(minDist, 0).rotate(-Math.PI / 6));

            points.push(vec1);
            points.push(vec2);
        }

        //end of the arrow
        points.push(verticiesInfo[j].pos);

        return points;
    };

    for (const edge of edges) {
        let vec;
        let arrow = [];

        arrow = constructArrow(edge);

        //shift begining and ending of the arrow to the edge of the verticies

        vec = p5.Vector.sub(arrow[1], arrow[0]).normalize();
        arrow[0] = vec.mult(diameter * 0.52).add(arrow[0]);

        vec = p5.Vector.sub(arrow[arrow.length - 1], arrow[arrow.length - 2]).normalize();
        arrow[arrow.length - 1] = vec.mult(-diameter * 0.52).add(arrow[arrow.length - 1]);

        arrows.push(arrow);
    }

    const drawArrow = (arrow, position = createVector(0, 0)) => {
        lastIndex = arrow.length - 1;

        for (let i = 0; i < lastIndex; ++i) {
            const shifted1 = p5.Vector.add(arrow[i], position);
            const shifted2 = p5.Vector.add(arrow[i + 1], position);
            line(shifted1.x, shifted1.y, shifted2.x, shifted2.y);
            if (weighted) {
                if (!options.showAllWeights) {
                    const mp = createVector((mouseX - windowWidth / 2) / scaling - screenPos.x,
                        (mouseY - windowHeight / 2) / scaling - screenPos.y);
                    const a = p5.Vector.sub(mp, shifted2);
                    const b = p5.Vector.sub(mp, shifted1);
                    const c = p5.Vector.sub(arrow[i + 1], arrow[i]).normalize();
                    const dist = (a.dot(c) > 0) ? a.mag() :
                            (b.dot(c) < 0) ? b.mag() :
                            abs(c.y * b.x - c.x * b.y);
                    if (dist < 5 / scaling) {
                        push();
                        textSize(20 / scaling);
                        strokeWeight(3 / scaling);
                        fill(255);
                        text(edgesInfo[arrows.indexOf(arrow)].w, mp.x + 10 / scaling, mp.y - 10 / scaling);
                        pop();
                    }
                } else if (i === Math.floor(lastIndex / 2)) {
                    push();
                    textSize(20 / scaling);
                    strokeWeight(3 / scaling);
                    fill(255);
                    if (lastIndex % 2)
                        text(edgesInfo[arrows.indexOf(arrow)].w,
                            shifted2.x * 0.3 + shifted1.x * 0.7,
                            shifted2.y * 0.3 + shifted1.y * 0.7);
                    else
                        text(edgesInfo[arrows.indexOf(arrow)].w, shifted1.x, shifted1.y);
                    pop();
                }
            }
        }

        if (directed) {
            //if graph is directed, then also draw head for the arrow
            const p1 = p5.Vector.sub(arrow[lastIndex - 1], arrow[lastIndex])
                                .normalize()
                                .mult(arrowLength)
                                .rotate(arrowSharpness)
                                .add(arrow[lastIndex])
                                .add(position);
            const p2 = p5.Vector.sub(arrow[lastIndex - 1], arrow[lastIndex])
                                .normalize()
                                .mult(arrowLength)
                                .rotate(-arrowSharpness)
                                .add(arrow[lastIndex])
                                .add(position);

            line(arrow[lastIndex].x + position.x, arrow[lastIndex].y + position.y, p1.x, p1.y);
            line(arrow[lastIndex].x + position.x, arrow[lastIndex].y + position.y, p2.x, p2.y);
        }
    };

    return {
        draw(position = createVector(0, 0)) {
            strokeWeight(parameters.arrowThickness);
            for (const arrow of arrows) {
                const color = edgesInfo[arrows.indexOf(arrow)].color;
                stroke(color.x, color.y, color.z);
                drawArrow(arrow, position);
            }

            stroke(0);
            strokeWeight(diameter/20);
            for (let i = 0; i < verticiesInfo.length; ++i) {
                const vertPos = p5.Vector.add(verticiesInfo[i].pos, position);
                stroke(verticiesInfo[i].color.x, verticiesInfo[i].color.y, verticiesInfo[i].color.z);
                ellipse(vertPos.x, vertPos.y, diameter, diameter);
                stroke(0);

                textSize(diameter/5); //a bit less than half smaller
                let width = textWidth(verticiesInfo[i].tag) + 2;
                textAlign(LEFT, CENTER);
                noStroke();
                if (directed) {
                    width += max(textWidth(outDegrees[i]), textWidth(inDegrees[i]));
                    text(outDegrees[i], vertPos.x + width/4 + 2, vertPos.y - 5);
                    text(inDegrees[i], vertPos.x + width/4 + 2, vertPos.y + 4);
                } else {
                    width += textWidth(outDegrees[i] + inDegrees[i]);
                    text(outDegrees[i] + inDegrees[i], vertPos.x + width/4 + 2, vertPos.y - 5);
                }

                textAlign(CENTER, CENTER);
                textSize(diameter / 3);
                text(verticiesInfo[i].tag, vertPos.x - width/4 + 2, vertPos.y);
                stroke(0);
            }
        },
        drawCondensated(position = createVector(0, 0)) {
            if (condensationGraph instanceof Function)
                condensationGraph = condensationGraph();

            condensationGraph.draw(position);

            let vert; //vertex over which cursor is standing
            for (const vertex of condensatedVert) {

                if (p5.Vector.dist(p5.Vector.add(vertex, position), new p5.Vector(mouseX - windowWidth / 2, mouseY - windowHeight / 2).div(scaling).sub(screenPos)) < diameter / 2 ) {
                    vert = condensated[condensatedVert.indexOf(vertex)];
                    break;
                }
            }
            if (vert) {
                vert = vert.map(val => ++val);
                push();
                textAlign(LEFT, TOP);
                rect((mouseX - windowWidth / 2) / scaling - screenPos.x + 5,
                    (mouseY - windowHeight / 2) / scaling - screenPos.y + 5,
                    textWidth(vert) + 10,
                    textAscent(vert) + textDescent(vert) + 7);
                noStroke();
                text(vert,
                    (mouseX - windowWidth / 2) / scaling - screenPos.x + 10,
                    (mouseY - windowHeight / 2) / scaling - screenPos.y + 10);
                pop();
            }
        },
        get directed() {
            return directed;
        },
        get verticiesInfo() {
            return verticiesInfo;
        },
        get edgesInfo() {
            return edgesInfo;
        },
        get verticies() {
            return verticiesInfo.map(v => v.pos);
        },
        getEdges() {
            return edges;
        },
        get tags() {
            return verticiesInfo.map(v => v.tag);
        },
        set tags(t) {
            verticiesInfo.forEach((v, i) => v.tag = t[i]);
        },
        getVColors() {
            return verticiesInfo.map(v => v.color);
        },
        setVColors(c) {
            verticiesInfo.forEach((v, i) => v.color = c[i]);
        },
        getEColors() {
            return edgesInfo.map(v => v.color);
        },
        setEColors(c) {
            edgesInfo.forEach((v, i) => v.color = c[i]);
        },
        getPaths(length) {
            const paths = [];

            if (length <= 1)
                edges.forEach(({ i, j }) => directed ? paths.push([i, j]) : paths.push([i, j], [j, i]));
            else {
                pathsPrev = this.getPaths(length - 1);
                pathsPrev.forEach(path => {
                    edges.filter(edge => edge.i === path[length - 1])
                         .forEach(edge => paths.push([...path, edge.j]));
                });
            }
            return paths;
        },
        getMatrix(power = 1) {
            let res = power === 1 ? matrix : mult(matrix, matrix);

            while (power > 2) {
                res = mult(res, matrix);
                --power;
            }

            return res;
        },
        getCondensatedMatrix(power = 1) {
            if (condensationGraph instanceof Function)
                condensationGraph = condensationGraph();

            return condensationGraph.getMatrix(power);
        },
        getCondensated() {
            return condensated;
        },
        getReachabilityMatrix() {
            return reachabilityMatrix;
        },
        getConnectivityMatrix() {
            return connectivityMatrix;
        },
        isRegular() {
            //checks if this graph is regular
            //and returns its degree
            let degree = outDegrees[0] + inDegrees[0];

            for (let i = 1; i < verticiesInfo.length; ++i)
                if (degree !== outDegrees[i] + inDegrees[i]) return 0;
        },
        getPendant() {
            //returns array with indexes of pendant verticies
            const pendant = [];

            for (let i = 0; i < verticiesInfo.length; ++i)
                if (outDegrees[i] + inDegrees[i] === 1) pendant.push(i);

            return pendant;
        },
        getIsolated() {
            //returns array with indexes of isolated verticies
            const isolated = [];

            for (let i = 0; i < verticiesInfo.length; ++i)
                if (outDegrees[i] + inDegrees[i] === 0) isolated.push(i);

            return isolated;
        },
        getInDegrees() {
            return inDegrees;
        },
        getOutDegrees() {
            return outDegrees;
        },
        getDegrees() {
            return Array.from({ length: verticiesInfo.length }, (v, i) => inDegrees[i] + outDegrees[i]);
        }
    };
};
