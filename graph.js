const diameter = 40;
const arrowSharpness = 30; //angle at the arrow's head in degrees
const arrowLength = diameter/6;
const minDist = diameter;
const fraction = 0.5;
const offsetAmount = 10;

window.graph = (verticies, edges, directed = true) => {
    const arrows = [];
    const arrowVertex_offset = [];

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
        const points = [];

        points.push(verticies[i]);

        if (i !== j) {
            const inc = 5;
            let blockingVertex = isIntersecting(points[points.length - 1], verticies[j], edge, minDist);
            let blockingIndex = verticies.indexOf(blockingVertex);
            if (blockingVertex) arrowVertex_offset[blockingIndex] = arrowVertex_offset[blockingIndex] ? 
                                arrowVertex_offset[blockingIndex] + inc : .01;

            while (blockingVertex) {
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

                points.push(point);

                blockingVertex = isIntersecting(points[points.length - 1], verticies[j], edge, dist);
                if (blockingIndex !== verticies.indexOf(blockingVertex)) {
                    blockingIndex   = verticies.indexOf(blockingVertex);

                    arrowVertex_offset[blockingIndex] = arrowVertex_offset[blockingIndex] ? 
                    arrowVertex_offset[blockingIndex] + inc : .01;
                }
            }
            if (points.length < 2 && edges.find(({i, j}) => i === edge.j && j === edge.i)) {
                const vec = p5.Vector.sub(points[points.length - 1], verticies[j]).normalize();

                points.push(p5.Vector.lerp(points[points.length - 1], verticies[j], 0.5)
                                     .add(createVector(vec.y, -vec.x).mult(offsetAmount)));
            }
        } else {
            const vec1 = verticies[i].copy().add(createVector(minDist, 0).rotate( Math.PI / 6));
            const vec2 = verticies[i].copy().add(createVector(minDist, 0).rotate(-Math.PI / 6));
         
            points.push(vec1);
            points.push(vec2);
        }

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
        draw: () => {
            push();                         //change of parameters like fill() will be discarded after pop()
                angleMode(DEGREES);
                noFill();
                for (const arrow of arrows)
                    drawArrow(arrow);
            pop();

            for (let i = 0; i < verticies.length; ++i) {
                ellipse(verticies[i].x, verticies[i].y, diameter, diameter);
                text(i, verticies[i].x, verticies[i].y);
            }
        },
        getMatrix: () => {
            const matrix = [];

            for (let n = 0; n < verticies.length; ++n) {
                const row = [];
 
                for (let m = 0; m < verticies.length; ++m)
                     row[m] = edges.find( ({i, j}) => i === n && j === m ) ? 1 : 0;

                matrix.push(row);     
            }
            return matrix;
        }
    };
};