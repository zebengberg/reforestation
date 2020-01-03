let forestCanvas = document.getElementById('forestCanvas');
forestCanvas.width = window.innerWidth;
forestCanvas.height = window.innerHeight - 210;  // saving room at bottom
let c = forestCanvas.getContext('2d');
// Fill the background white so we can paint over dead trees with background color.
c.fillStyle = 'rgba(255, 255, 255, 255)';
c.fillRect(0, 0, forestCanvas.width, forestCanvas.height);

let userCanvas = document.getElementById('userCanvas');
userCanvas.width = .6 * window.innerWidth;
userCanvas.height = 200;
userCanvas.style.position = 'absolute';
userCanvas.style.left = '5px';
userCanvas.style.top = forestCanvas.height;
let c2 = userCanvas.getContext('2d');


let birthLabel = document.getElementById('birthLabel');
birthLabel.style.position = 'absolute';
birthLabel.style.left = userCanvas.width + 150 + 'px';
birthLabel.style.top = forestCanvas.height + 10 +  'px';
let birthSlider = document.getElementById('birthSlider');
birthSlider.style.position = 'absolute';
birthSlider.style.left = userCanvas.width + 10 + 'px';
birthSlider.style.top = forestCanvas.height + 10 + 'px';
birthSlider.min = 0;
birthSlider.max = 20;
birthSlider.value = 3;

let deathLabel = document.getElementById('deathLabel');
deathLabel.style.position = 'absolute';
deathLabel.style.left = userCanvas.width + 150 + 'px';
deathLabel.style.top = 1.1 * forestCanvas.height + 10 +  'px';
let deathSlider = document.getElementById('deathSlider');
deathSlider.style.position = 'absolute';
deathSlider.style.left = userCanvas.width + 10 + 'px';
deathSlider.style.top = 1.1 * forestCanvas.height + 10 + 'px';
deathSlider.min = 0;
deathSlider.max = 100;
deathSlider.value = 10;


let speciesLabel = document.getElementById('speciesLabel');
speciesLabel.style.position = 'absolute';
speciesLabel.style.left = userCanvas.width + 150 + 'px';
speciesLabel.style.top = 1.2 * forestCanvas.height + 10 +  'px';
let speciesSlider = document.getElementById('speciesSlider');
speciesSlider.style.position = 'absolute';
speciesSlider.style.left = userCanvas.width + 10 + 'px';
speciesSlider.style.top = 1.2 * forestCanvas.height + 10 + 'px';

let seedLabel = document.getElementById('seedLabel');
seedLabel.style.position = 'absolute';
seedLabel.style.left = userCanvas.width + 150 + 'px';
seedLabel.style.top = 1.3 * forestCanvas.height + 10 +  'px';
let seedSlider = document.getElementById('seedSlider');
seedSlider.style.position = 'absolute';
seedSlider.style.left = userCanvas.width + 10 + 'px';
seedSlider.style.top = 1.3 * forestCanvas.height + 10 + 'px';


// Keeps track of all trees and forest-wide parameters.
class Forest {
  constructor() {
    this.nTrees = 5;
    this.treeGrowths = [.1, .3, .5, .7, .9];
    this.treeColors = ['Turquoise', 'SeaGreen', 'Gold',
                       'DarkOrange', 'DeepPink'];
    this.treeArray = [];  // will populate with all trees
    this.maxRadius = 50;
    this.boxDict = {};  // boxDict[u, v] will hold trees near (u, v) box-coord

    // Keeping track of summary statistics over time.
    // Each colorDict will hold the total area of trees of a given color.
    this.stats = [];
    for (let i = 0; i < userCanvas.width; i++) {
      let colorDict = {};
      for (let color of this.treeColors) {
        colorDict[color] = 0;
      }
      this.stats.push(colorDict);
    }
  }

  // Build the boxes needed to calculated all nearest neighbors.
  buildBoxDict() {
    // Reset boxDict.
    this.boxDict = {};
    // A given tree goes into 9 different boxes in total.
    for (let tree of this.treeArray) {
      let u = tree.u;
      let v = tree.v;
      // Not a problem if any of these keys are actually out of bounds.
      let keys = [[u - 1, v - 1],
                  [u - 1, v],
                  [u - 1, v + 1],
                  [u, v - 1],
                  [u, v],
                  [u, v + 1],
                  [u + 1, v - 1],
                  [u + 1, v],
                  [u + 1, v + 1]]
      for (let key of keys) {
        if (key in this.boxDict) {
          this.boxDict[key].push(tree);  // key will be converted to string
        } else {
          this.boxDict[key] = [tree];  // key will be converted to string
        }
      }
    }
  }

  // Get all nearest neighbors by exploiting that trees have a maxRadius.
  setClosestNeighborDist() {
    // For each tree, compare with all other trees in box containing tree.
    for (let tree of this.treeArray) {
      let key = [tree.u, tree.v];
      tree.closestNeighborDist = Infinity;
      for (let closeTree of this.boxDict[key]) {
        let candidate = tree.distance(closeTree, true);
        // Need candidate > 0 in order to exclude tree iteself
        if (candidate < tree.closestNeighborDist & candidate > 0) {
          tree.closestNeighborDist = candidate;
        }
      }
    }
  }

  // Give birth to n new trees if space is available.
  birthTree(n = 1) {
    for (let i = 0; i < n; i++) {
      let x = Math.random() * forestCanvas.width;
      let y = Math.random() * forestCanvas.height;
      // Determining if there is a tree at (x, y)
      let pixelRGBA = c.getImageData(x, y, 1, 1);
      let colorValue = pixelRGBA.data[0] + pixelRGBA.data[1]
                       + pixelRGBA.data[2];
      if (colorValue > 750) {  // no tree at (x, y)
        let index = Math.floor(Math.random() * this.nTrees);
        let growthRate = this.treeGrowths[index];
        let color = this.treeColors[index];
        let tree = new Tree(x, y, growthRate, color, this.maxRadius);
        this.treeArray.push(tree);  // putting tree into treeArray
        tree.draw();
      }
    }
  }

  // Grow and draw every tree in the forest.
  grow() {
    // Using a traditional for loop in order to splice out dead trees.
    for (let i = 0; i < this.treeArray.length; i++) {
      let tree = this.treeArray[i];
      if (tree.isAlive) {
        tree.grow();
        tree.draw();  // will remove pixels from dead trees
      } else {  // remove dead trees from treeArray
        this.treeArray.splice(i, 1);
      }
    }
  }

  // Kill all trees in some big region centered at (x, y)
  clearCut(x, y) {
    let threshold = Math.min(forestCanvas.width, forestCanvas.height) / 4;
    for (let tree of this.treeArray) {
      let dist = Math.sqrt(Math.pow(tree.x - x, 2) + Math.pow(tree.y - y, 2));
      if (dist < threshold) {
        tree.isAlive = false;
        tree.draw();  // remove the dead tree pixels
      }
    }
  }

  // Update statistics.
  updateStats() {
    this.stats.shift();  // remove first element from this.stats
    let colorDict = {};  // creating new colorDict to push to this.stats
    for (let color of this.treeColors) {
      colorDict[color] = 0;
    }
    for (let tree of this.treeArray) {
      let area = Math.PI * Math.pow(tree.r, 2);
      colorDict[tree.color] += area;
    }
    // Converting the areas to proportions of canvas area.
    for (let color in colorDict) {
      colorDict[color] /= forestCanvas.width * forestCanvas.height;
    }
    this.stats.push(colorDict);
  }

  // Graph the stats over time.
  graphStats() {
    c2.clearRect(0, 0, this.stats.length + 1, userCanvas.height + 1);
    for (let color of this.treeColors) {
      let t = 0;
      for (let colorDict of this.stats) {
        if (t == 0) {
          c2.beginPath();  // starting path
          // Arbitrary constant 1500 used to scale the y-values appropriately.
          // Using max with 0 to prevent graph from going off the canvas.
          c2.moveTo(t, Math.max(userCanvas.height - 1500 * colorDict[color], 0));
          t++;
        } else {
          c2.lineTo(t, Math.max(userCanvas.height - 1500 * colorDict[color], 0));
          t++;
        }
      }
      c2.lineWidth = 2;
      c2.strokeStyle = color;
      c2.stroke();
    }
  }
}


// Keeps track of individual trees.
class Tree {
  constructor(x, y, growthRate, color, maxRadius) {
    this.x = x;
    this.y = y;
    this.r = 1;
    this.growthRate = growthRate;
    this.maxRadius = maxRadius;
    // box coordinates
    this.u = Math.floor(x / (2 * maxRadius));
    this.v = Math.floor(y / (2 * maxRadius));
    this.color = color;
    this.deathProb = 0;
    this.closestNeighborDist = Infinity;
    this.isAlive = true;
  }

  // Grow the tree and determine if still alive.
  grow() {
    // Growing r with some random noise.
    // Don't grow beyond edge of canvas. Don't grow into neighbors.

    let growBool = this.r < this.maxRadius
                   && this.r < this.closestNeighborDist
                   && this.x - this.r >= 0
                   && this.y - this.r >= 0
                   && this.x + this.r <= forestCanvas.width
                   && this.y + this.r <= forestCanvas.height;

    if (growBool) {
      this.r += this.growthRate * Math.random() / 5;
    }
    // Raise the growthRate to small power to bring it even closer to 0.
    this.deathProb += deathSlider.value * Math.pow(this.growthRate, 1.3) / Math.pow(10, 6);
    if (Math.random() < this.deathProb) {  // tree dies
      this.isAlive = false;
    }
  }

  // Draw a tree if alive; draw a blank circle if dead.
  draw() {
    c.beginPath();
    if (this.isAlive) {
      c.fillStyle = this.color;
    } else {
      this.r += 2  // pad the blank circle so no leftovers after filled white
      c.fillStyle = 'rgba(255, 255, 255, 255)';
    }
    c.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    if (this.isAlive) {  // give the trees a black outline
      c.lineWidth = 2;
      c.strokeStyle = 'black';
      c.stroke();
    }
    c.closePath();
    c.fill();
  }

  // Get distance between this tree and another tree.
  distance(tree, toEdge = false) {
    let distance = Math.sqrt(Math.pow(this.x - tree.x, 2)
                             + Math.pow(this.y - tree.y, 2));
    if (toEdge) {  // get distance to edge of circle
      return distance - tree.r;  // subtract off the radius of second tree
    } else {  // get distance to center of tree
      return distance;
    }
  }
}


let forest = new Forest;

// Clear cut after user click.
let doOnClick = function(event) {
  let x = event.clientX;
  let y = event.clientY;
  forest.clearCut(x, y);
}
forestCanvas.addEventListener('click', doOnClick);

// Animate the forest.
let update = function() {
  // Increasing the number of births will result in smaller trees. The number
  // of births and the constant in front of the deathProb should be inverse.
  forest.birthTree(birthSlider.value);
  forest.buildBoxDict();
  forest.setClosestNeighborDist();
  forest.grow();
  forest.updateStats();
  forest.graphStats();
};

// Applying function update after every n milliseconds.
setInterval(update, 20);
