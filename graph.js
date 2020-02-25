const diameter = 40;
const arrowSharpness = 30; //angle at the arrow's head in degrees
const arrowLength = diameter/6;
const minDist = diameter;
const fraction = 0.5;
const offsetAmount = 10;

window.graph = (verticies, edges, directed = true) => {
    const inDegrees = [];
    const outDegrees = [];

    //Arrow - array of points that arrow consist of
    const arrows = [];
    const inc = 5; //inc - increment of distance

    //Specific to the vertex offset so that if one arrow passed near vertex
    //next arrow that will pass will be (inc) px further away than it was previously
    const arrowVertex_offset = [];

    //calculating semipowers for verticies in graph
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
        
        //if arrow doesn't point to itself search for a way to the end vertex
        if (i !== j) {
            //check whether there is a vertex on the way
            let blockingVertex = isIntersecting(points[points.length - 1], verticies[j], edge, minDist);
            //get its index to increase offset before processing more
            let blockingIndex = verticies.indexOf(blockingVertex);
            if (blockingVertex) 
                arrowVertex_offset[blockingIndex] = arrowVertex_offset[blockingIndex] + inc | .01;

            while (blockingVertex) {
                //geometry stuff
                //basically finds next point such that segment will be tangent and
                //given distance away from the blocking vertex
                //and checks again if there are still verticies that block arrow
                const dist = minDist + arrowVertex_offset[blockingIndex];
                const point = p5.Vector.lerp(points[points.length - 1], verticies[j], fraction);

                const c = p5.Vector.sub(point, points[points.length - 1]).normalize();
                const b = p5.Vector.sub(blockingVertex, points[points.length - 1]);
                const angle = Math.asin((c.y * b.x - c.x * b.y)/b.mag()); 
                let angleSign = Math.sign(angle); if(!angleSign) angleSign = 1;
                
                const correctionAngle = angleSign * Math.asin( dist / b.mag()) - angle;

                point.sub(points[points.length - 1])
                     .rotate(correctionAngle)
                     .add(points[points.length - 1]);
                
                //geometry stuff ends
                points.push(point);

                blockingVertex = isIntersecting(points[points.length - 1], verticies[j], edge, dist);
                //if still have blocking vertex that is different from previous
                if (blockingIndex !== verticies.indexOf(blockingVertex)) {
                    //we change index and increase offset for new vertex
                    blockingIndex   = verticies.indexOf(blockingVertex);

                    arrowVertex_offset[blockingIndex] = arrowVertex_offset[blockingIndex] + inc | .01;
                }
            }
            if (points.length < 2 && edges.find(({i, j}) => i === edge.j && j === edge.i)) {
                //if its straight line and we have arrow in the opposite direction
                //then compute direction in which current arrow is facing
                const vec = p5.Vector.sub(points[points.length - 1], verticies[j]).normalize();

                //and move middle point of the resulting arrow offsetAmount away
                //perpendicular to the direction in which it points
                points.push(p5.Vector.lerp(points[points.length - 1], verticies[j], 0.5)
                                     .add(createVector(vec.y, -vec.x).mult(offsetAmount)));
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
        arrow[0] = vec.mult(diameter/2).add(arrow[0]);  

        vec = p5.Vector.sub(arrow[arrow.length - 1], arrow[arrow.length - 2]).normalize();
        arrow[arrow.length - 1] = vec.mult(-diameter/2).add(arrow[arrow.length - 1]);

        arrows.push(arrow);
    }

    const drawArrow = (arrow) => {
        lastIndex = arrow.length - 1;

        strokeWeight(1);
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
            push();                         //change of parameters like fill() will be discarded after pop()
                angleMode(DEGREES);
                for (const arrow of arrows)
                    drawArrow(arrow);
            pop();

            for (let i = 0; i < verticies.length; ++i) {
                ellipse(verticies[i].x, verticies[i].y, diameter, diameter);
                text(i, verticies[i].x, verticies[i].y);
                const width = textWidth(i) + 2;
                textSize(diameter/5); //a bit less than half smaller
                textAlign(LEFT, CENTER);
                if (directed) {
                    text(outDegrees[i], verticies[i].x + width/2, verticies[i].y - 5);
                    text(inDegrees[i], verticies[i].x + width/2, verticies[i].y + 4);
                } else 
                    text(outDegrees[i] + inDegrees[i], verticies[i].x + width/2, verticies[i].y - 5);
                textSize(diameter/3);
                textAlign(CENTER, CENTER);
            }
        },
        getMatrix() {
            const matrix = [];

            for (let n = 0; n < verticies.length; ++n) {
                const row = [];
 
                for (let m = 0; m < verticies.length; ++m)
                     row[m] = edges.find( ({i, j}) => i === n && j === m ) ? 1 : 0;

                matrix.push(row);     
            }
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
