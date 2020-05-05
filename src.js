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
  directed: false,
  weighted: true,
  showAllWeights: true,
  showCondensationGraph: false,
  showTraversalGraph: false,
  showSpanningTree: true,
  startingIndex: '1',
  traversalType: [graphTraversalTypes.DEPTH, graphTraversalTypes.BREADTH],
  traversalGraphForm: [TGForm.Tree, TGForm.Original],
  studentBook: '9525',
  labNumber: [1, 2, 3, 4, 5, 6],
};

let scaling = 1;
let screenPos;
let myGraph;
let myGraphTraversal;
let mySpanningTree;
let traverseButton;
let changeIndexingButton;

function setup() {
  screenPos = createVector(0, 0);

  traverseButton = createButton('Traverse');
  traverseButton.position(30, Object.keys(options).length * 40 + 90);
  traverseButton.size(180, 25);

  changeIndexingButton = createButton('Change Indexing');
  changeIndexingButton.mousePressed(() => myGraphTraversal.changeIndexing());
  changeIndexingButton.position(30, (Object.keys(options).length + 1) * 40 + 90);
  changeIndexingButton.size(180, 25);

  const guiOptions = createGui('Options');
  guiOptions.addObject(new Proxy(options, {
    set: (obj, prop, value) => {
      obj[prop] = value;
      if (options.studentBook.length === 4)
        myGraph = generateGraph(options.studentBook, options.labNumber, options.directed, options.weighted);

      if (['labNumber', 'studentBook', 'startingIndex', 'traversalType', 'directed'].includes(prop)) {
        console.clear();

        switch (options.labNumber) {
          case 4: {
            // console.log(myGraphTraversal.traversalTree.tree.getMatrix());
            // console.log(myGraphTraversal.indiciesMappingMatrix);
            console.log(myGraph.getMatrix());
            break;
          }
          case 5: {
            console.log(myGraph.getMatrix());
            break;
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
        traverseButton.mousePressed(() => {
          mySpanningTree.traverse()   ?  console.log(mySpanningTree.spanningTree.tree.getMatrix()) : 0;
          // myGraphTraversal.traverse() ? (console.log(myGraphTraversal.indiciesMappingMatrix),
          //                                console.log(myGraphTraversal.traversalTree.tree.getMatrix())) : 0;
        })

        if (myGraph.tags.includes(options.startingIndex))
          myGraphTraversal = graphTraversal(myGraph, Number(options.startingIndex) - 1, options.traversalType);

        const spanningTreeAlgorithm = options.studentBook.charAt(3) % 2 ?
          spanningTreeTypes.PRIM : spanningTreeTypes.KRUSKAL;
        mySpanningTree = spanningTree(myGraph, Number(options.startingIndex) - 1, spanningTreeAlgorithm);
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

  guiParameters.setPosition(250, 20);

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
        myGraphTraversal.traversalTree.tree.draw(createVector(0, 400));
        break;
      case TGForm.Original:
        myGraphTraversal.inOriginalForm.draw(createVector(0, 600));
        break;
    }
  if (options.showSpanningTree)
    mySpanningTree.spanningTree.tree.draw(createVector(400, 400));
  myGraph.draw();
}

function mouseWheel(event) {
  scaling *= 1 - event.delta / abs(event.delta) * sensativity;
}

function mouseDragged() {
  screenPos.x += movedX / scaling;
  screenPos.y += movedY / scaling;
}

function generateGraph(bookNumber, labNumber, directed, weighted) {
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

  let Wt;
  if (weighted) {
    const bool2s = x => x !== 0 ? 1 : 0;
    //round(rand(n,n)*100 .* A);
    Wt = //matrix.map(row => row.map(v => random() * 100 * v));
      Array.from({ length: verticiesN }, (v1, k1) =>
      Array.from({ length: verticiesN }, (v2, k2) =>
        Math.round( random() * 100 * matrix[k1][k2])
      )
    );
    //B = Wt & ones(n,n);
    const B = Wt.map(row => row.map(v => v & 1));
    //   Array.from({ length: verticiesN }, (v1, k1) =>
    //   Array.from({ length: verticiesN }, (v2, k2) => Wt[k1][k2] & 1)
    // );
    // Wt = (bool2s(B & ~B') + bool2s(B & B') .* tril(ones(n,n),-1)) .* Wt;
    Wt = Wt.map((row, i) => row.map((v, j) =>
      (bool2s(B[i][j] & ~B[j][i]) + (i < j - 1 ? bool2s(B[i][j] & B[j][i]) : 0)) * v));
    //W = Wt + Wt';
    for (let i = 0; i < verticiesN; ++i) {
      for (let j = 0; j < verticiesN; ++j)
        Wt[i][j] = Wt[i][j] + Wt[j][i];
    }
  }

  console.log(Wt);
  return createGraph(verticiesN, figureType, matrix, directed, Wt);
}

function createGraph(verticiesN, figureType, matrix, directed, weights) {
  const edges = [];

  if (directed) {
    for (let n = 0; n < verticiesN; ++n) {
      for (let m = 0; m < verticiesN; ++m)
        if (matrix[n][m] === 1)
          edges.push({ e: { i: n, j: m } , color : createVector(0), w: weights ? weights[n][m] : 1 });
    }
  } else {
    for (let n = 0; n < verticiesN; ++n) {
      for (let m = 0; m < n + 1; ++m)
        if (matrix[n][m] === 1)
          edges.push({ e: { i: n, j: m } , color : createVector(0), w: weights ? weights[n][m] : 1 });
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

  return graph(verticies.map((v, i) => ({ tag: `${i + 1}`, color: createVector(0), pos: v })), edges, directed, !!weights);
}