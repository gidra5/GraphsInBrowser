let scaling = 1;
let screenPos;
const sensativity = 0.1;
let myGraph;

const figureTypes = {
  CIRCLE: 'circle',
  SQUARE: 'square',
  TRIANGLE: 'triangle',
  CIRCLE_WITH_CENTER: 'circle with center',
  SQUARE_WITH_CENTER: 'square with center',
};

function setup() {
  screenPos = createVector(0, 0);

  myGraph = generateGraph('9525'); 

  resizeCanvas(windowWidth, windowHeight);

  textAlign(CENTER, CENTER);
  textSize(diameter/2);
  strokeWeight(diameter/20);
}

let x = 50;

function draw() {
  translate(windowWidth/2, windowHeight/2); //to scale relative
  scale(scaling);                           //to the center of window

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
  const k = 1.0 - Number(myNumber.charAt(2)) * 0.02 - Number(myNumber.charAt(3)) * 0.005 - 0.25;
  const matrix = [];

  switch (Math.floor(Number(myNumber.charAt(3)/2))) {
    case 0: figureType = figureTypes.CIRCLE; break;
    case 1: figureType = figureTypes.SQUARE; break;
    case 2: figureType = figureTypes.TRIANGLE; break;
    case 3: figureType = figureTypes.CIRCLE_WITH_CENTER; break;
    case 4: figureType = figureTypes.SQUARE_WITH_CENTER; break;
  }

  for (let i = 0; i < verticiesN; ++i) {
    const row = [];

    for (let j = 0; j < verticiesN; ++j) 
      row.push( Math.floor( k * ( Math.random() + Math.random() ) ) );

    matrix.push(row);
  }

  return createGraph(verticiesN, figureType, matrix);
}

function createGraph(verticiesN, figureType, matrix) {
  const edges = [];

  for (let n = 0; n < verticiesN; ++n) {
    for (let m = 0; m < verticiesN; ++m)
      if (matrix[n][m] === 1)
        edges.push({i: n, j: m});     
  }

  let verticiesPerSide = 0; //invalid value for the case of circle
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
          verticies.push(p5.Vector.lerp(verticies[i % 4], verticies[(i + 1)%4], j / N));
      }

     break;
    case figureTypes.CIRCLE_WITH_CENTER :
      verticiesN--;
      verticies.push(createVector(0, 0));
    case figureTypes.CIRCLE : 
      circleRadius = 0;
      
      for (let i = 0; i < verticiesN; ++i) 
        vertex = createVector(circleRadius, 0).rotate(Math.PI * 2 * i / verticiesN);
    
      break;
  }

  console.log(verticies);

  return graph(verticies, edges);
}