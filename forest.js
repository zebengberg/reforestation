class Forest{
  constructor(args) {
    // Forest and stat canvas.
    this.canvas = args.forestCanvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.context = this.canvas.getContext('2d');
    this.statsCanvas = args.statsCanvas;

    // Properties taken from HTML sliders.
    this.birthRate = args.birthRate;
    this.deathRate = args.deathRate;
    this.parentSelection = args.parentSelection;
    this.numberSpecies = args.numberSpecies;

    // Some constant
    this.maxTreeRadius = 50;

    // Containers holding tree data
    this.treeArray = [];  // will be populated when trees are born
    this.treeGrid = null;  // will be built on each this.update()
    this.stats = Array(this.statsCanvas.width).fill().map(() =>
      Array(this.numberSpecies).fill(0));  // 2d-array holding forest stats
  }

  // Get the color of a species.
  color(species) {
    const rate = growthRate(species);
    // brighter colors (reds, oranges) grow faster
    return 'hsl(' + (280 * (1 - rate)).toString() + ', 100%, 50%)'
  }

  // Get growth rate of a species.
  growthRate(species) {
    return (2 * species + 1) / (2 * this.numberSpecies);
  }

  // Pushing each tree onto (at most) 9 distinct entries in treeGrid.
  buildTreeGrid() {
    const gridWidth = Math.floor(this.width / (2 * this.maxTreeRadius));
    const gridHeight = Math.floor(this.height / (2 * this.maxTreeRadius));
    this.treeGrid = Array(gridWidth).fill().map(() => Array(gridHeight).fill([]));

    this.treeArray.forEach(tree => {
      // Ensuring grid indices remain in bounds.
      const uLower = Math.max(tree.u - 1, 0);
      const uUpper = Math.min(tree.u + 1, gridWidth);
      const vLower = Math.max(tree.v - 1, 0);
      const vUpper = Math.min(tree.v + 1, gridHeight);
      
      for (let u = uLower; u <= uUpper; u++) {
        for (let v = vLower; v <= vUpper; v++) {
          this.treeGrid[u][v].push(tree);
        }
      }
    });
  }

  // Birth up to n new trees if space is available.
  birthTree(n = 1) {
    for (let i = 0; i < n; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const u = Math.floor(x / (2 * maxRadius));
      const v = Math.floor(y / (2 * maxRadius));

      // Determining if there is already a tree at (x, y)
      const pixel = this.context.getImageData(x, y, 1, 1);
      const colorSum = pixel.data[0] + pixel.data[1] + pixel.data[2];
      if (colorSum > 750) {  // no currently existing tree at (x, y)
        const species = this.getTreeParent(u, v);
        const tree = new Tree(x, y, u, v, species);
        this.treeArray.push(tree);
        tree.draw();
      }
    }
  }


  // Get all nearest neighbors by exploiting that trees have a maxRadius.
  setClosestNeighborDist() {
    // For each tree, compare with all other trees in treeGrid.
    this.treeArray.forEach(tree => {
      const distance = other => {
        dist = tree.getDistance(other, true);
        // Want ot avoid comparing the tree to itself.
        return dist > 0 ? dist : Infinity;
      }
      const distances = treeGrid[tree.u][tree.v].map(distance);
      return Math.min(...distances);
    });
  }


  // Grow, draw, and kill every tree in the forest.
  growTreesInForest() {
    // Removing dead trees
    this.treeArray = this.treeArray.filter(tree => tree.isAlive);
    // Growing and drawing the living trees
    this.treeArray.forEach(tree => tree.grow());
    this.treeArray.forEach(tree => tree.draw());
  }

  // Determine a new tree's species based on neighboring tree's species.
  getTreeParent(u, v) {
    if (this.parentSelection === 0) {
      // Equal weighting of all possible species.
      return Math.floor(Math.random() * this.numberSpecies);
    } else {
      // Weighting according to area.
      // Giving all trees a non-zero probability by filling with 1.
      let weights = new Array(this.numberSpecies).fill(1)
      const reducer = (w, tree) => w[tree.species] += tree.area();
      weights = this.treeGrid.reduce(reducer, weights);

      const cumulativeSum = (sum => value => sum += value)(0);
      weights = weights.map(cumulativeSum);

      const random = Math.random() * weights[weights.length - 1];
      return weights.findIndex(w => w > random);
    }
  }

  // Reset forest canvas; call before letting this be garbage collected.
  reset() {
    this.context.fillStyle = 'rgba(255, 255, 255, 255)';
    this.context.fillRect(0, 0, this.width, this.height);
  }

  // Kill all trees in some big circle centered at (x, y)
  clearCut(x, y) {
    const radius = Math.min(this.width, this.height) / 4;
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
    // TODO: need new keyword?
    let areas = Array(this.numberSpecies).fill(0);
    const reducer = (a, tree) => a[tree.species] += tree.area();
    areas = this.treeArray.reduce(reducer, areas);

    // Converting to proportions
    areas = areas.map(area => area / (this.width * this.height));
    this.stats.push(areas);
  }

  // Graph the time-series forest statistics on the statCanvas.
  graphStats() {
    const c = this.statsCanvas.getContext('2d');
    c.clearRect(0, 0, this.statsCanvas.width, this.statsCanvas.height);
    for (let species = 0; species < this.numberSpecies; species++) {
      // Arbitrary constant 300 * nTrees to scale the y-values appropriately.
      // Using max with 1 to prevent graph from going off the canvas.
      const yValue = t => Math.max(this.statsCanvas.height -
        300 * this.numberSpecies * this.stats[t][species]);

      c.beginPath();
      c.moveTo(t, yValue(t));
      for (let t = 0; t < this.statsCanvas.width; t++) {
        c.LineTo(t, yValue(t))
      }
      c.lineWidth = 3;
      c.strokeStyle = treeColors[species];
      c.stroke();
    }
  }

  // Update all aspects of the forest.
  update() {
    this.birthTree();
    this.buildTreeGrid();
    this.setClosestNeighborDist();
    this.growTreesInForest();
    this.updateStats();
    this.graphStats();
  };
}