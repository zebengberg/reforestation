let canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let c = canvas.getContext('2d');
// Fill the background white so we can paint over dead trees with background color.
c.fillStyle = 'rgba(255, 255, 255, 255)';
c.fillRect(0, 0, window.innerWidth, window.innerHeight);


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
      let x = Math.random() * window.innerWidth;
      let y = Math.random() * window.innerHeight;
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
    let threshold = Math.min(window.innerWidth, window.innerHeight) / 4;
    for (let tree of this.treeArray) {
      let dist = Math.sqrt(Math.pow(tree.x - x, 2) + Math.pow(tree.y - y, 2));
      if (dist < threshold) {
        tree.isAlive = false;
        tree.draw();  // remove the dead tree pixels
      }
    }
  }

  // Print summary metrics for the forest.
  printMetrics() {
    let colorSummary = {};
    for (let color of this.treeColors) {
      colorSummary[color] = 0;
    }
    for (let tree of this.treeArray) {
      let area = Math.PI * Math.pow(tree.r, 2);
      colorSummary[tree.color] += area;
    }
    // Convert colorSummary dict to array of pairs so we can sort.
    colorSummary = Object.keys(colorSummary).map(function(key) {
      return [key, colorSummary[key]]
    });
    // Sort colorSummary array based on the second element
    colorSummary.sort(function(first, second) {
      return second[1] - first[1];
    });
    c.fillStyle = 'rgba(245, 245, 245, 255)';
    c.fillRect(0, 0, 100, 150);
    let vertPos = 20;
    c.font = 'bold 20px sans-serif'
    for (let pair of colorSummary) {
      let text = Math.floor(pair[1]);
      c.strokeStyle = 'black';
      c.lineWidth = 4;
      c.strokeText(text, 20, vertPos);
      c.fillStyle = pair[0];
      c.fillText(text, 20, vertPos);
      vertPos += 30;
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

  // Grow the tree and determine if stil alive.
  grow() {
    // Growing r with some random noise. Don't grow into neighbors.
    if ((this.r < this.maxRadius) && (this.r < this.closestNeighborDist)) {
      this.r += this.growthRate * Math.random() / 5;
    }
    // Square the growthRate to bring it even closer to 0.
    this.deathProb += Math.pow(this.growthRate, 2) / Math.pow(10, 5);
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
canvas.addEventListener('click', doOnClick);

// Animate the forest.
let update = function() {
  // Increasing the number of births will result in smaller trees. The number
  // of births and the constant in front of the deathProb should be inverse.
  forest.birthTree(2);
  forest.buildBoxDict();
  forest.setClosestNeighborDist();
  forest.grow();
  forest.printMetrics();
};

// Applying function update after every n milliseconds.
setInterval(update, 50);
