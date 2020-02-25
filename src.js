const sensativity = 0.1;
let studentBook = '9525';
let directed = false;
let labNumber = 2;
let scaling = 1;
let screenPos;
let myGraph;
//let gui;

const figureTypes = {
  CIRCLE: 'circle',
  SQUARE: 'square',
  TRIANGLE: 'triangle',
  CIRCLE_WITH_CENTER: 'circle with center',
  SQUARE_WITH_CENTER: 'square with center',
};

function setup() {
  screenPos = createVector(0, 0);

  //gui = createGui('Options');

  myGraph = generateGraph(studentBook); 

  if (myGraph.getPendant().length !== 0)
    console.log("Pendant verticies: " + myGraph.getPendant());
  else 
    console.log("Pendant verticies: none");
  if (myGraph.getIsolated() !== 0)
    console.log("Isolated verticies: " + myGraph.getIsolated());
  else
    console.log("Isolated verticies: none");

  console.log("Regular? " + !!myGraph.isRegular());
  if (myGraph.isRegular())
    console.log("Degree" + myGraph.isRegular());
  
  if (directed) {
    console.group('Indegrees');
    console.table(myGraph.getInDegrees());
    console.groupEnd();
    console.group('Outdegrees');
    console.table(myGraph.getOutDegrees());
    console.groupEnd();
  }
  console.group('Degrees');
  console.table(myGraph.getDegrees());
  console.groupEnd();

  resizeCanvas(windowWidth, windowHeight);

  textAlign(CENTER, CENTER);
  textSize(diameter/3);
  strokeWeight(diameter/20);
}

function draw() {
  translate(windowWidth/2, windowHeight/2); //to scale relative to the center of window
  scale(scaling);                           

  translate(screenPos.x, screenPos.y);   
  background(110);

  myGraph.draw();
}

function mouseWheel(event) {
  scaling *= 1 - event.delta / abs(event.delta) * sensativity;
}

function mouseDragged() {
  screenPos.x += movedX / scaling;
  screenPos.y += movedY / scaling;
}

function generateGraph(myNumber) {
  const verticiesN = 10 + Number(myNumber.charAt(2));
  let figureType;
  let k;

  switch (labNumber) {
    case 1: 
      k = 1.0 - myNumber.charAt(2) * 0.02 - myNumber.charAt(3) * 0.005 - 0.25;
      break;
    case 2:  
      k = 1.0 - myNumber.charAt(2) * 0.01 - myNumber.charAt(3) * 0.01 - 0.3;
      break;
    case 3:  
      k = 1.0 - myNumber.charAt(2) * 0.005 - myNumber.charAt(3) *0.005 - 0.27;
      break;
    case 4:  
      k = 1.0 - myNumber.charAt(2)* 0.01 - myNumber.charAt(3) *0.005 - 0.15;
      break;
    case 5:  
    case 6:
      k = 1.0 - myNumber.charAt(3) * 0.01 - myNumber.charAt(4) *0.005 - 0.05;
      break;
  }

  switch (Math.floor(Number(myNumber.charAt(3)/2))) {
    case 0: figureType = figureTypes.CIRCLE; break;
    case 1: figureType = figureTypes.SQUARE; break;
    case 2: figureType = figureTypes.TRIANGLE; break;
    case 3: figureType = figureTypes.CIRCLE_WITH_CENTER; break;
    case 4: figureType = figureTypes.SQUARE_WITH_CENTER; break;
  }

  randomSeed("seed");

  const matrix = Array.from({ length: verticiesN }, () =>
    Array.from({ length: verticiesN }, () =>
      Math.floor( k * ( random() + random() ) )
    )
  );

  const symmetricMatrix = [];
  for (let i = 0; i < verticiesN; ++i) {
    const row = [];

    for (let j = 0; j < verticiesN; ++j) 
      row.push(Math.min(matrix[i][j] + matrix[j][i], 1));

    symmetricMatrix.push(row);
  }

  console.log(matrix);
  console.log(symmetricMatrix);

  if (directed)
    return createGraph(verticiesN, figureType, matrix, directed);
  else
    return createGraph(verticiesN, figureType, symmetricMatrix, directed);
}

function createGraph(verticiesN, figureType, matrix, directed) {
  const edges = [];

  if (directed) {
    for (let n = 0; n < verticiesN; ++n) {
      for (let m = 0; m < verticiesN; ++m)
        if (matrix[n][m] === 1)
          edges.push({i: n, j: m});     
    }
  } else {
    for (let n = 0; n < verticiesN; ++n) {
      for (let m = 0; m < n + 1; ++m)
        if (matrix[n][m] === 1)
          edges.push({i: n, j: m});     
    }
  }

  let verticiesPerSide = 0; 
  let remainingVerticies = 0;
  let circleRadius = 0;
  const verticies = [];

  switch (figureType) {
    case figureTypes.TRIANGLE : 
      remainingVerticies = verticiesN % 3;
      verticiesPerSide = (verticiesN - remainingVerticies) / 3;

      verticies.push(createVector( 0                        ,-diameter / 2 * verticiesN),
                     createVector(-diameter / 2 * verticiesN, diameter / 2 * verticiesN),
                     createVector( diameter / 2 * verticiesN, diameter / 2 * verticiesN));

      for(let i = 0; i < 3; ++i) {
        const N = verticiesPerSide + (--remainingVerticies >= 0 ? 1 : 0);
        for (let j = 1; j < N; ++j) 
          verticies.push(p5.Vector.lerp(verticies[i % 3], verticies[(i + 1) % 3], j / N));
      }

      break;
    case figureTypes.SQUARE_WITH_CENTER :
      const offset = 1;
      verticiesN--;
      verticies.push(createVector(0, 0));
    case figureTypes.SQUARE : 
      remainingVerticies = verticiesN % 4;
      verticiesPerSide = (verticiesN - remainingVerticies) / 4;

      verticies.push(createVector( diameter / 2 * verticiesN, diameter / 2 * verticiesN),
                     createVector(-diameter / 2 * verticiesN, diameter / 2 * verticiesN),
                     createVector(-diameter / 2 * verticiesN,-diameter / 2 * verticiesN),
                     createVector( diameter / 2 * verticiesN,-diameter / 2 * verticiesN));

      for(let i = 0; i < 4; ++i) {
        const N = verticiesPerSide + (--remainingVerticies >= 0 ? 1 : 0);
        for (let j = 1; j < N; ++j) 
          verticies.push(p5.Vector.lerp(verticies[i % 4 + offset | 0], verticies[(i + 1) % 4 + offset | 0], j / N));
      }

     break;
    case figureTypes.CIRCLE_WITH_CENTER :
      verticiesN--;
      verticies.push(createVector(0, 0));
    case figureTypes.CIRCLE : 
      circleRadius = 0;

      //TODO: evaluate suitable radius
      
      for (let i = 0; i < verticiesN; ++i) 
        vertex = createVector(circleRadius, 0).rotate(Math.PI * 2 * i / verticiesN);
    
      break;
  }

  return graph(verticies, edges, directed);
}