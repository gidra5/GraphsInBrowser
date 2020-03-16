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

window.graph = (verticies, edges, directed) => {
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

    //Adjacency matrix of this graph
    const matrix = [];

    for (let n = 0; n < verticies.length; ++n) {
        const row = [];

        for (let m = 0; m < verticies.length; ++m)
             row[m] = edges.find( ({i, j}) => (i === n && j === m) || (!directed && i === m && j === n) ) ? 1 : 0;

        matrix.push(row);
    }

    let reachabilityMatrix = Array.from(matrix);

    for (let i = 0; i < verticies.length; ++i)
        reachabilityMatrix = mult(reachabilityMatrix, matrix)
                            .map((value, index1) => value
                            .map((value, index2) => min(value + (index1 === index2 ? 1 : 0), 1)));

    const condensated = [[0]];

    // if vertex have paths from and to least one of verticies in condensation
    // then it should also be in that condensation
    // else if there is no such condensation it'll be in new condensation
    for (let i = 1; i < reachabilityMatrix.length; ++i) {
        let found = false;
        for (let j = 0; j < condensated.length; ++j) {
            let foundIn = false;
            let foundOut = false;
            for (let k = 0; k < condensated[j].length; ++k) {
                foundOut |= reachabilityMatrix[i][condensated[j][k]];
                foundIn  |= reachabilityMatrix[condensated[j][k]][i];

                if (foundIn && foundOut) {
                    condensated[j].push(i);
                    found = true;
                    break;
                }
            }
            if (foundIn && foundOut) break;
        }
        if (!found) condensated.push([i]);
    }

    //setting up condensated graph

    //verticies that represent verticies in condensated graph
    //are chosen by first vertex in condensation
    const condensatedVert = condensated.map(value => verticies[value[0]]);

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

                    if (matrix[p][s] === 1 && i !== j) {
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
    let condensationGraph = () => graph(condensatedVert, condensatedEdges, directed);

    //calculating degrees for verticies in graph
    for (let i = 0; i < verticies.length; ++i) {
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

        for (const vertex of verticies) {
            if(vertex === verticies[i] || vertex === verticies[j])
                continue;

            const a = p5.Vector.sub(vertex, point2);
            const b = p5.Vector.sub(vertex, point1);
            const c = p5.Vector.sub(point2, point1).normalize();
            const dist = (a.dot(c) > 0) ? a.mag() :
                         (b.dot(c) < 0) ? b.mag() :
                         abs(c.y * b.x - c.x * b.y);
            if (dist > minDist) continue;

            if (!closestVertex) closestVertex = {vertex, dist: b.mag()};

            if (b.mag() < closestVertex.dist) closestVertex = {vertex, dist: b.mag()};
        }

        if (closestVertex)
            return closestVertex.vertex;
    }

    const constructArrow = (edge) => {
        const {i, j} = edge;
        const points = []; //points that arrow will consist of

        points.push(verticies[i]);

        angleMode(RADIANS);

        //if arrow doesn't point to itself search for a way to the end vertex
        if (i !== j) {
            //check whether there is a vertex on the way
            let blockingVertex = isIntersecting(points[points.length - 1], verticies[j], edge, minDist);

            //get its index to increase offset before processing more
            let blockingIndex = verticies.indexOf(blockingVertex);

            if (blockingVertex)
                arrowVertex_offset[blockingIndex] = arrowVertex_offset[blockingIndex] + parameters.distanceInc | .01;
            else if (edges.find(({i, j}) => i === edge.j && j === edge.i)) {
                //if its straight line and we have arrow in the opposite direction
                //then compute direction in which current arrow is facing
                const vec = p5.Vector.sub(verticies[i], verticies[j]).normalize();

                //and move middle point of the resulting arrow some amount away
                //perpendicular to the direction in which it points
                points.push(p5.Vector.lerp(verticies[i], verticies[j], 0.5)
                                     .add(createVector(vec.y, -vec.x).mult(diameter / 4)));
            }

            while (blockingVertex) {
                //geometry stuff
                //basically finds point such that next segment will be tangent and
                //given distance away from the blocking vertex
                //and checks again if there are still verticies that block arrow
                const dist = minDist + arrowVertex_offset[blockingIndex];
                const point = p5.Vector.lerp(points[points.length - 1], verticies[j], parameters.fraction);

                const c = p5.Vector.sub(point, points[points.length - 1]).normalize();
                const b = p5.Vector.sub(blockingVertex, points[points.length - 1]);
                const angle = Math.asin((c.y * b.x - c.x * b.y)/b.mag());
                let angleSign = Math.sign(angle); if(!angleSign) angleSign = 1;

                const correctionAngle = angleSign * Math.asin( min(dist / b.mag(), 1)) - angle;

                point.sub(points[points.length - 1]);
                point.rotate(correctionAngle)
                     .add(points[points.length - 1]);

                //geometry stuff ends
                points.push(point);

                blockingVertex = isIntersecting(points[points.length - 1], verticies[j], edge, dist);
                //if still have blocking vertex that is different from previous
                if (blockingIndex !== verticies.indexOf(blockingVertex)) {
                    //we change index and increase offset for new vertex
                    blockingIndex   = verticies.indexOf(blockingVertex);

                    arrowVertex_offset[blockingIndex] = arrowVertex_offset[blockingIndex] + parameters.distanceInc | .01;
                }
            }
        } else {
            //if arrow is pointing to itself, then just generate two points to make a loop
            const vec1 = verticies[i].copy().add(createVector(minDist, 0).rotate( Math.PI / 6));
            const vec2 = verticies[i].copy().add(createVector(minDist, 0).rotate(-Math.PI / 6));

            points.push(vec1);
            points.push(vec2);
        }

        //end of the arrow
        points.push(verticies[j]);

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

    const drawArrow = (arrow) => {
        lastIndex = arrow.length - 1;

        for (let i = 0; i < lastIndex; ++i) {
            line(arrow[i].x, arrow[i].y,
                 arrow[i + 1].x, arrow[i + 1].y);
        }

        if (directed) {
            //if graph is directed, then alse draw head for the arrow
            const p1 = p5.Vector.sub(arrow[lastIndex - 1], arrow[lastIndex])
                                .normalize()
                                .mult(arrowLength)
                                .rotate(arrowSharpness)
                                .add(arrow[lastIndex]);
            const p2 = p5.Vector.sub(arrow[lastIndex - 1], arrow[lastIndex])
                                .normalize()
                                .mult(arrowLength)
                                .rotate(-arrowSharpness)
                                .add(arrow[lastIndex]);

            line(arrow[lastIndex].x, arrow[lastIndex].y, p1.x, p1.y);
            line(arrow[lastIndex].x, arrow[lastIndex].y, p2.x, p2.y);
        }
    };

    return {
        draw() {
            strokeWeight(parameters.arrowThickness);
            for (const arrow of arrows)
                drawArrow(arrow);

            strokeWeight(diameter/20);
            for (let i = 0; i < verticies.length; ++i) {
                ellipse(verticies[i].x, verticies[i].y, diameter, diameter);

                textSize(diameter/5); //a bit less than half smaller
                let width = textWidth(i+1) + 2;
                textAlign(LEFT, CENTER);
                if (directed) {
                    width += max(textWidth(outDegrees[i]), textWidth(inDegrees[i]));
                    text(outDegrees[i], verticies[i].x + width/4 + 2, verticies[i].y - 5);
                    text(inDegrees[i], verticies[i].x + width/4 + 2, verticies[i].y + 4);
                } else {
                    width += textWidth(outDegrees[i] + inDegrees[i]);
                    text(outDegrees[i] + inDegrees[i], verticies[i].x + width/4 + 2, verticies[i].y - 5);
                }

                textAlign(CENTER, CENTER);
                textSize(diameter/3);
                text(i+1, verticies[i].x - width/4 + 2, verticies[i].y);
            }
        },
        drawCondensated() {
            if (condensationGraph instanceof Function)
                condensationGraph = condensationGraph();

            condensationGraph.draw();

            let vert; //vertex over which cursor is standing
            for (const item of condensated) {
                const vertI = item[0];

                if(p5.Vector.dist(verticies[vertI], new p5.Vector((mouseX - windowWidth / 2) / scaling - screenPos.x
                    , (mouseY - windowHeight / 2) / scaling - screenPos.y)) < diameter / 2 ) {
                    vert = item;
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
                text(vert,
                    (mouseX - windowWidth / 2) / scaling - screenPos.x + 10,
                    (mouseY - windowHeight / 2) / scaling - screenPos.y + 10);
                pop();
            }
        },
        getCondensated() {
            return condensated;
        },
        getPaths(length) {
            const paths = [];
            // const AdjMatPowers = [Array.from(matrix)];

            // for (let i = 1; i < length; ++i)
            //     AdjMatPowers.push(mult(matrix, AdjMatPowers[i - 1]));

            // const f = (n, i, j) => {
            //     const pathss = [];
            //     if (n > 1 && AdjMatPowers[n - 1][i][j]) {
            //         for (let p = 0; p < verticies.length; ++p)
            //             if (AdjMatPowers[0][i][p] * AdjMatPowers[n - 2][p][j]) {
            //                 const b = f(n - 1, p, j);

            //                 for (const edge of f(1, i, p)) {
            //                     for (const path of b) {
            //                         console.log([edge[0], ...path], paths);
            //                         pathss.push([edge[0], ...path]);
            //                         console.log(paths);
            //                     }
            //                 }
            //             }
            //     } else if (AdjMatPowers[0][i][j]) pathss.push([i, j]);
            //     return pathss;
            // }

            // for (let i = 0; i < verticies.length; ++i) {
            //     for (let j = 0; j < verticies.length; ++j) {
            //         paths.push(...f(length, i, j));
            //     }
            // }

            // my way
            if (length <= 1) {
                edges.forEach(({ i, j }) => directed ? paths.push([i, j]) : paths.push([i, j], [j, i]));
            } else {
                pathsPrev = this.getPaths(length - 1);
                pathsPrev.forEach(path => {
                    edges.filter(edge => edge.i === path[length - 1])
                         .forEach(edge => paths.push([...path, edge.j]));
                });
            }
            return paths;
        },
        getMatrix() {
            return matrix;
        },
        isRegular() {
            //checks if this graph is regular
            //and returns its degree
            let degree = outDegrees[0] + inDegrees[0];

            for (let i = 1; i < verticies.length; ++i)
                if (degree !== outDegrees[i] + inDegrees[i]) return 0;
        },
        getPendant() {
            //returns array with indexes of pendant verticies
            const pendant = [];

            for (let i = 0; i < verticies.length; ++i)
                if (outDegrees[i] + inDegrees[i] === 1) pendant.push(i);

            return pendant;
        },
        getIsolated() {
            //returns array with indexes of isolated verticies
            const isolated = [];

            for (let i = 0; i < verticies.length; ++i)
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
            return Array.from({ length: verticies.length }, (v, i) => inDegrees[i] + outDegrees[i]);
        }
    };
};
