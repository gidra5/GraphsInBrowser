const sensativity = 0.1;

const figureTypes = {
  CIRCLE: 0,
  SQUARE: 1,
  TRIANGLE: 2,
  CIRCLE_WITH_CENTER: 3,
  SQUARE_WITH_CENTER: 4,
};
const TGForm = {
  Original: 'Original',
  Tree: 'Tree'
}

var options = {
  directed: true,
  showCondensationGraph: false,
  showTraversalGraph: true,
  traversalStartVertex: '1',
  traversalType: [graphTraversalTypes.DEPTH, graphTraversalTypes.BREADTH],
  traversalGraphForm: [TGForm.Tree, TGForm.Original],
  studentBook: '9525',
  labNumber: [1, 2, 3, 4, 5, 6],
};

let scaling = 1;
let screenPos;
let myGraph;
let myGraphTraversal;
let traverseButton;
let changeIndexingButton;

function setup() {
  screenPos = createVector(0, 0);

  const guiOptions = createGui('Options');
  guiOptions.addObject(new Proxy(options, {
    set: (obj, prop, value) => {
      obj[prop] = value;
      if (options.studentBook.length === 4)
        myGraph = generateGraph(options.studentBook, options.labNumber, options.directed);

      if (['labNumber', 'studentBook', 'traversalStartVertex', 'traversalType', 'directed'].includes(prop)) {
        console.clear();

        switch (options.labNumber) {
          case 4: {
            console.log(myGraphTraversal.getTraversalTree().getMatrix());
            console.log(myGraphTraversal.getIndiciesMappingMatrix());
            console.log(myGraph.getMatrix());
            break;
          }
          case 5: {

          }
          case 6: {

          }
          case 3: {
            console.log(myGraph.getPaths(2).map(item => item.toString().replace(/,/gi, ' -> ')));
            console.log(myGraph.getPaths(3).map(item => item.toString().replace(/,/gi, ' -> ')));

            console.log(myGraph.getCondensated());
            console.log(myGraph.getCondensatedMatrix());
            console.log(myGraph.getReachabilityMatrix());
            console.log(myGraph.getConnectivityMatrix());

            if (options.directed) {
              console.group('Indegrees');
              console.table(myGraph.getInDegrees());
              console.groupEnd();
              console.group('Outdegrees');
              console.table(myGraph.getOutDegrees());
              console.groupEnd();
            } else {
              console.group('Degrees');
              console.table(myGraph.getDegrees());
              console.groupEnd();
            }

            console.log(myGraph.getMatrix());
            console.log(myGraph.getMatrix(2));
            console.log(myGraph.getMatrix(3));
            break;
          }
          case 2: {
            if (options.directed) {
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

            if (myGraph.getPendant().length !== 0)
              console.log("Pendant verticies: " + myGraph.getPendant());
            else
              console.log("Pendant verticies: none");

            if (myGraph.getIsolated() !== 0)
              console.log("Isolated verticies: " + myGraph.getIsolated());
            else
              console.log("Isolated verticies: none");

            if (myGraph.isRegular())
              console.log("Graph is regular\nDegree" + myGraph.isRegular());
            else
              console.log('Graph is irregular');
          }
          case 1: {
            console.log(myGraph.getMatrix());
            break;
          }
        }

        if (myGraph.getTags().includes(options.traversalStartVertex))
          myGraphTraversal = graphTraversal(myGraph, Number(options.traversalStartVertex) - 1, options.traversalType);
      }
  }}));

  const guiParameters = createGui('Graph Parameters');
  guiParameters.addObject(new Proxy(parameters, {
    set: (obj, prop, value) => {
    obj[prop] = value;

    arrowLength = diameter * parameters.arrowThickness / 6;
    minDist = diameter * parameters.minDist;

    myGraph = generateGraph(options.studentBook, options.labNumber, options.directed);
    }
  }));

  traverseButton = createButton('Traverse');
  traverseButton.mousePressed(() => myGraphTraversal.traverse() ? (console.log(myGraphTraversal.getIndiciesMappingMatrix()),
            console.log(myGraphTraversal.getTraversalTree().getMatrix())) : 0);
  traverseButton.position(30, Object.keys(guiOptions).length * 40 + 80);
  traverseButton.size(180, 25);

  changeIndexingButton = createButton('Change Indexing');
  changeIndexingButton.mousePressed(() => myGraphTraversal.changeIndexing());
  changeIndexingButton.position(30, (Object.keys(guiOptions).length + 1) * 40 + 80);
  changeIndexingButton.size(180, 25);

  guiParameters.setPosition(20, (Object.keys(guiOptions).length + 2) * 40 + 80);

  resizeCanvas(windowWidth, windowHeight);

  textAlign(CENTER, CENTER);
}

function draw() {
  translate(windowWidth/2, windowHeight/2); //to scale relative to the center of window
  scale(scaling);

  translate(screenPos.x, screenPos.y);
  background(110);

  if (options.showCondensationGraph)
    myGraph.drawCondensated(createVector(800, 0));
  if (options.showTraversalGraph)
    switch (options.traversalGraphForm) {
      case TGForm.Tree:
        myGraphTraversal.getTraversalTree().draw(createVector(0, 400));
        break;
      case TGForm.Original:
        myGraphTraversal.getInOriginalForm().draw(createVector(0, 600));
        break;
    }
  myGraph.draw();
}

function mouseWheel(event) {
  scaling *= 1 - event.delta / abs(event.delta) * sensativity;
}

function mouseDragged() {
  screenPos.x += movedX / scaling;
  screenPos.y += movedY / scaling;
}

function generateGraph(bookNumber, labNumber, directed) {
  const verticiesN = 10 + Number(bookNumber.charAt(2));
  const figureType = Math.floor(bookNumber.charAt(3)/2);
  let k;

  switch (labNumber) {
    case 1:
      k = 1.0 - bookNumber.charAt(2) * 0.02 - bookNumber.charAt(3) * 0.005 - 0.25;
      break;
    case 2:
      k = 1.0 - bookNumber.charAt(2) * 0.01 - bookNumber.charAt(3) * 0.01 - 0.3;
      break;
    case 3:
      k = 1.0 - bookNumber.charAt(2) * 0.005 - bookNumber.charAt(3) *0.005 - 0.27;
      break;
    case 4:
      k = 1.0 - bookNumber.charAt(2)* 0.01 - bookNumber.charAt(3) *0.005 - 0.15;
      break;
    case 5:
    case 6:
      k = 1.0 - bookNumber.charAt(3) * 0.01 - bookNumber.charAt(4) *0.005 - 0.05;
      break;
  }

  randomSeed(Number(bookNumber));

  const matrix = Array.from({ length: verticiesN }, () =>
    Array.from({ length: verticiesN }, () =>
      Math.floor( k * ( random() + random() ) )
    )
  );

  if (!directed) {
    for (let i = 0; i < verticiesN; ++i) {
      for (let j = 0; j < verticiesN; ++j)
        matrix[i][j] = Math.min(matrix[i][j] + matrix[j][i], 1);
    }
  }

    return createGraph(verticiesN, figureType, matrix, directed);
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
          verticies.unshift(p5.Vector.lerp(verticies[verticies.length - 1 - i % 4],
            verticies[verticies.length - 1 - (i + 1) % 4], j / N));
      }

     break;
    case figureTypes.CIRCLE_WITH_CENTER :
      verticiesN--;
      verticies.push(createVector(0, 0));
    case figureTypes.CIRCLE :
      const angle = Math.PI / verticiesN;
      circleRadius = 1.5 * diameter / Math.tan(angle);

      for (let i = 0; i < verticiesN; ++i)
        verticies.unshift(createVector(circleRadius, 0).rotate(2 * i * angle));

      break;
  }

  return graph(verticies.map((v, i) => ({ tag: `${i + 1}`, color: createVector(0), pos: v })), edges, directed);
}