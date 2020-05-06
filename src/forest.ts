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
  gridWidth: number;
  gridHeight: number;
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
    this.treeGrid;  // will be built on each this.update()
    this.gridWidth = Math.ceil(this.canvas.width / (2 * this.maxTreeRadius));
    this.gridHeight = Math.ceil(this.canvas.height / (2 * this.maxTreeRadius));
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

  // Get the u, v coordinates of a point x, y
  getGridCoordinates(x: number, y: number) {
    return [Math.floor(x / (2 * this.maxTreeRadius)),
      Math.floor(y / (2 * this.maxTreeRadius))];
  }

  // Pushing each tree onto (at most) 9 distinct entries in treeGrid.
  buildTreeGrid() {
    this.treeGrid = Array(this.gridWidth).fill(null).map(() => Array(this.gridHeight).fill([]));
    this.treeArray.forEach(tree => {
      // First get indices of 3 x 3 (or smaller) sub-grid centered at x, y
      let [u, v] = this.getGridCoordinates(tree.x, tree.y);
      const uLower = Math.max(u - 1, 0);
      const uUpper = Math.min(u + 1, this.gridWidth - 1);
      const vLower = Math.max(v - 1, 0);
      const vUpper = Math.min(v + 1, this.gridHeight - 1);

      // Now push tree into all 9 boxes.
      for (u = uLower; u <= uUpper; u++) {
        for (v = vLower; v <= vUpper; v++) {
          this.treeGrid[u][v].push(tree);
        }
      }
    });
  }

  isContainedInCanvas(x: number, y: number) {
    return x >= 0 && x <= this.canvas.width && y >= 0 && y <= this.canvas.height;
  }

  // Checking if a tree is present at (x, y)
  noTreePresent(x: number, y: number) {
    const pixel = this.context.getImageData(x, y, 1, 1);
    return pixel.data[0] + pixel.data[1] + pixel.data[2] > 750;
  }

  // Placing a random seed on the forest floor
  placeRandomSeed() {
    if (Math.random() < 0.05) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      if (this.noTreePresent(x, y)) {
        const species = Math.floor(Math.random() * this.numberSpecies);
        const tree = new Tree(this.getTreeArgs(x, y, species));
        this.treeArray.push(tree);
        tree.draw();
      }
    }
  }

  // Let each tree birth new trees
  birthTrees(birthRate: number) {
    this.treeArray.forEach(tree => {
      if (Math.random() < birthRate * tree.area / Math.pow(10, 5)) {
        const r = Math.random() * this.maxTreeRadius;
        const theta = Math.random() * 2 * Math.PI;
        const x = tree.x + r * Math.cos(theta);
        const y = tree.y + r * Math.sin(theta);
        if (this.noTreePresent(x, y) && this.isContainedInCanvas(x, y)) {
          const baby = new Tree(this.getTreeArgs(x, y, tree.species, tree));
          this.treeArray.push(baby);
          baby.draw();
        }
      }
    })
  }

  // Get arguments passed to Tree. Optional argument for subclass override.
  getTreeArgs(x: number, y: number, species: number, parent: Tree = null) {
    const growthRate = this.getGrowthRate(species);
    const deathRate = this.deathRate;
    const color = this.getColor(species);
    const canvas = this.canvas;
    const maxRadius = this.maxTreeRadius;
    return {x, y, species, growthRate, deathRate, color, canvas, maxRadius}
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
      const [u, v] = this.getGridCoordinates(tree.x, tree.y);
      const distances = this.treeGrid[u][v].map(distance);
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
    this.placeRandomSeed();
    this.birthTrees(this.birthRate);
    this.buildTreeGrid();
    this.setClosestNeighborDistance();
    this.growTreesInForest();
    this.updateStats();
    this.graphStats();
  }
}