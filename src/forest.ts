import Tree from './tree.js';

export default class Forest{
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  statsCanvas: HTMLCanvasElement;
  birthRate: number;
  deathRate: number;
  parentCheck: boolean;
  numberSpecies: number;
  maxTreeRadius: number;
  treeArray: Tree[];
  treeGrid: Tree[][][];
  stats: number[][];

  constructor({forestCanvas, statsCanvas, birthRate, deathRate, parentCheck,
    numberSpecies}: {forestCanvas: HTMLCanvasElement,
    statsCanvas: HTMLCanvasElement, birthRate: number, deathRate: number,
    parentCheck: boolean, numberSpecies: number}) {
    // Forest and stat canvas.
    this.canvas = forestCanvas;
    this.context = this.canvas.getContext('2d');
    this.resetContext();
    this.statsCanvas = statsCanvas;

    // Properties taken from HTML sliders.
    this.birthRate = birthRate;
    this.deathRate = deathRate;
    this.parentCheck = parentCheck;
    this.numberSpecies = numberSpecies;

    // Some constant
    this.maxTreeRadius = 50;

    // Containers holding tree data
    this.treeArray = [];  // will be populated when trees are born
    this.treeGrid = [];  // will be built on each this.update()
    this.stats = Array(this.statsCanvas.width).fill(null).map(() =>
      Array(this.numberSpecies).fill(0));  // 2d-array holding forest stats
  }

  // Get the color of a species.
  getColor(species: number) {
    const colors = [
      ['DarkOrange'],
      ['DarkTurquoise', 'DarkOrange'],
      ['DarkTurquoise', 'PaleGreen', 'DarkOrange'],
      ['BlueViolet', 'Turquoise', 'PaleGreen', 'DarkOrange'],
      ['BlueViolet', 'Turquoise', 'Green', 'Gold', 'DarkOrange'],
      ['BlueViolet', 'Turquoise', 'Green', 'Gold', 'DarkOrange', 'Firebrick']
    ];
    return colors[this.numberSpecies - 1][species];
    //return 'hsl(' + (280 * (1 - rate)).toString() + ', 100%, 50%)';
  }

  // Get growth rate of a species.
  getGrowthRate(species: number) {
    return (2 * species + 1) / (2 * this.numberSpecies);
  }

  // Pushing each tree onto (at most) 9 distinct entries in treeGrid.
  buildTreeGrid() {
    const gridWidth = Math.ceil(this.canvas.width / (2 * this.maxTreeRadius));
    const gridHeight = Math.ceil(this.canvas.height / (2 * this.maxTreeRadius));
    this.treeGrid = Array(gridWidth).fill(null).map(() => Array(gridHeight).fill([]));

    this.treeArray.forEach(tree => {
      // Ensuring grid indices remain in bounds.
      const uLower = Math.max(tree.u - 1, 0);
      const uUpper = Math.min(tree.u + 1, gridWidth - 1);
      const vLower = Math.max(tree.v - 1, 0);
      const vUpper = Math.min(tree.v + 1, gridHeight - 1);
      
      for (let u = uLower; u <= uUpper; u++) {
        for (let v = vLower; v <= vUpper; v++) {
          this.treeGrid[u][v].push(tree);
        }
      }
    });
  }

  // Birth up to n new trees if space is available.
  birthTree(n: number = 1) {
    for (let i = 0; i < n; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      const u = Math.floor(x / (2 * this.maxTreeRadius));
      const v = Math.floor(y / (2 * this.maxTreeRadius));

      // Determining if there is already a tree at (x, y)
      const pixel = this.context.getImageData(x, y, 1, 1);
      const colorSum = pixel.data[0] + pixel.data[1] + pixel.data[2];
      if (colorSum > 750) {  // no currently existing tree at (x, y)
        const species = this.getTreeParent(u, v);
        const growthRate = this.getGrowthRate(species);
        const deathRate = this.deathRate;
        const color = this.getColor(species);
        const canvas = this.canvas;
        const maxRadius = this.maxTreeRadius;
        const treeArgs = {x, y, u, v, species, growthRate, deathRate, color,
          canvas, maxRadius};
        const tree = new Tree(treeArgs);
        this.treeArray.push(tree);
        tree.draw();
      }
    }
  }

  // Get all nearest neighbors by exploiting that trees have a maxRadius.
  setClosestNeighborDistance() {
    // For each tree still growing, compare with all other trees in treeGrid.
    this.treeArray.filter(tree => tree.isGrowing).forEach(tree => {
      const distance = (other: Tree) => {
        const dist = tree.getDistance(other.x, other.y, other.r);
        // Want to avoid comparing the tree to itself.
        return dist > 0 ? dist : Infinity;
      };
      const distances = this.treeGrid[tree.u][tree.v].map(distance);
      tree.closestNeighborDistance = Math.min(...distances);
    });
  }

  // Grow, draw, and kill every tree in the forest.
  growTreesInForest() {
    // Removing dead trees
    this.treeArray = this.treeArray.filter(tree => tree.isAlive);
    // Growing and drawing the trees still growing
    this.treeArray.filter(tree => tree.isGrowing).forEach(tree => tree.grow());
    // Updating each tree's isAlive property then drawing the trees.
    this.treeArray.forEach(tree => {
      tree.alive();
      tree.draw();
    });
  }

  // Determine a new tree's species based on neighboring tree's species.
  getTreeParent(u: number, v: number) {
    if (!this.parentCheck) {
      // Equal weighting of all possible species.
      return Math.floor(Math.random() * this.numberSpecies);
    }
    // Weighting according to area.
    // Giving all trees a non-zero probability by filling with 1.
    let weights = Array(this.numberSpecies).fill(10);
    const reducer = (w: number[], tree: Tree) => {
      w[tree.species] += tree.area;
      return w;
    };
    weights = this.treeGrid[u][v].reduce(reducer, weights);

    const cumulativeSum = (sum => (value: number) => sum += value)(0);
    weights = weights.map(cumulativeSum);

    const random = Math.random() * weights[weights.length - 1];
    return weights.findIndex(w => w > random);
  }

  // Reset forest canvas; call before letting this forest be garbage collected.
  resetContext() {
    this.context.fillStyle = 'rgba(255, 255, 255, 255)';
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // Kill all trees in some big circle centered at (x, y)
  clearCut(x: number, y: number) {
    const radius = Math.min(this.canvas.width, this.canvas.height) / 4;
    this.treeArray.forEach(tree => {
      if (tree.getDistance(x, y) < radius) {
        tree.isAlive = false;
        tree.draw();  // removing the dead tree pixels
      }
    });
  }

  // Update statistics.
  updateStats() {
    this.stats.shift();  // remove first element from stats
    let areas = Array(this.numberSpecies).fill(0);
    const reducer = (a: number[], tree: Tree) => {
      a[tree.species] += tree.area;
      return a;
    };
    areas = this.treeArray.reduce(reducer, areas);

    // Converting to proportions
    areas = areas.map(area => area / (this.canvas.width * this.canvas.height));
    this.stats.push(areas);
  }

  // Graph the time-series forest statistics on the statCanvas.
  graphStats() {
    const c = this.statsCanvas.getContext('2d');
    c.clearRect(0, 0, this.statsCanvas.width, this.statsCanvas.height);
    for (let species = 0; species < this.numberSpecies; species++) {
      // Arbitrary constant 300 * nTrees to scale the y-values appropriately.
      // Using max with 1 to prevent graph from going off the canvas.
      const yValue = (t: number) => Math.max(this.statsCanvas.height -
        200 * this.numberSpecies * this.stats[t][species], 1);

      c.beginPath();
      let t = 0;
      c.moveTo(t, yValue(t));
      for (; t < this.statsCanvas.width; t++) {
        c.lineTo(t, yValue(t));
      }
      c.lineWidth = 3;
      c.strokeStyle = this.getColor(species);
      c.stroke();
    }
  }

  // Update all aspects of the forest.
  update() {
    this.buildTreeGrid();
    this.birthTree(this.birthRate);
    this.setClosestNeighborDistance();
    this.growTreesInForest();
    this.updateStats();
    this.graphStats();
  }
}


