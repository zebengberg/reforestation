// Getting, setting, repositioning, and labeling HTML objects.

let forestCanvas = document.getElementById('forestCanvas');
forestCanvas.width = window.innerWidth;
forestCanvas.height = window.innerHeight - 210;  // saving room at bottom
let c = forestCanvas.getContext('2d');

let userCanvas = document.getElementById('userCanvas');
userCanvas.width = .6 * window.innerWidth;
userCanvas.height = 190;
userCanvas.style.position = 'absolute';
userCanvas.style.left = '5px';
userCanvas.style.top = forestCanvas.height;
let c2 = userCanvas.getContext('2d');

let birthLabel = document.getElementById('birthLabel');
birthLabel.style.position = 'absolute';
birthLabel.style.left = userCanvas.width + 150 + 'px';
birthLabel.style.top = forestCanvas.height + 10 + 'px';
birthLabel.innerText = 'BIRTH RATE';

let birthSlider = document.getElementById('birthSlider');
birthSlider.style.position = 'absolute';
birthSlider.style.left = userCanvas.width + 10 + 'px';
birthSlider.style.top = forestCanvas.height + 10 + 'px';
birthSlider.min = 0;
birthSlider.max = 6;
birthSlider.value = 3;

let deathLabel = document.getElementById('deathLabel');
deathLabel.style.position = 'absolute';
deathLabel.style.left = userCanvas.width + 150 + 'px';
deathLabel.style.top = forestCanvas.height + 50 + 'px';
deathLabel.innerText = 'DEATH RATE';

let deathSlider = document.getElementById('deathSlider');
deathSlider.style.position = 'absolute';
deathSlider.style.left = userCanvas.width + 10 + 'px';
deathSlider.style.top = forestCanvas.height + 50 + 'px';
deathSlider.min = 0;
deathSlider.max = 6;
deathSlider.value = 3;

let speciesLabel = document.getElementById('speciesLabel');
speciesLabel.style.position = 'absolute';
speciesLabel.style.left = userCanvas.width + 150 + 'px';
speciesLabel.style.top = forestCanvas.height + 90 + 'px';
speciesLabel.innerText = 'NUMBER OF SPECIES: moving this will reset forest';

let speciesSlider = document.getElementById('speciesSlider');
speciesSlider.style.position = 'absolute';
speciesSlider.style.left = userCanvas.width + 10 + 'px';
speciesSlider.style.top = forestCanvas.height + 90 + 'px';
speciesSlider.min = 1;
speciesSlider.max = 6;
speciesSlider.value = 2;

let seedLabel = document.getElementById('seedLabel');
seedLabel.style.position = 'absolute';
seedLabel.style.left = userCanvas.width + 150 + 'px';
seedLabel.style.top = forestCanvas.height + 130 + 'px';
seedLabel.innerText = 'SEEDLING BIRTH: To what extent should a '
                      + 'new seed depend on its parent neighbors?';

let seedSlider = document.getElementById('seedSlider');
seedSlider.style.position = 'absolute';
seedSlider.style.left = userCanvas.width + 10 + 'px';
seedSlider.style.top = forestCanvas.height + 130 + 'px';
seedSlider.min = -1;
seedSlider.max = 1;
seedSlider.value = 0;

let updateLabel = document.getElementById('updateLabel');
updateLabel.style.position = 'absolute';
updateLabel.style.left = userCanvas.width + 150 + 'px';
updateLabel.style.top = forestCanvas.height + 170 + 'px';
updateLabel.innerText = 'ANIMATION UPDATE RATE';

let updateSlider = document.getElementById('updateSlider');
updateSlider.style.position = 'absolute';
updateSlider.style.left = userCanvas.width + 10 + 'px';
updateSlider.style.top = forestCanvas.height + 170 + 'px';
updateSlider.min = 0;
updateSlider.max = 6;
updateSlider.value = 3;



// Set global variables that track of all trees and forest-wide parameters.
let nTrees, treeArray, maxRadius, boxDict, treeSpecies, treeGrowths, treeColors, stats;
function resetForest() {
    // Fill the canvas with white so we can paint over dead trees with background color.
  c.fillStyle = 'rgba(255, 255, 255, 255)';
  c.fillRect(0, 0, forestCanvas.width, forestCanvas.height);
  nTrees = speciesSlider.value;
  treeArray = [];
  maxRadius = 50;
  boxDict = {};  // boxDict[u, v] will hold trees near (u, v) box-coord
  treeSpecies = [];
  treeGrowths = [];
  treeColors = [];
  for (let i = 0; i < nTrees; i++) {
    treeSpecies.push(i);
    let rate = (2 * i + 1) / (2 * nTrees)
    // brighter colors (reds, oranges) should grow faster
    let hsl = 'hsl(' + (280 * (1 - rate)).toString() + ', 100%, 50%)';
    treeGrowths.push(rate);
    treeColors.push(hsl);
  }
  // Keeping track of forest summary statistics over time.
  // Each speciesDict will hold the total area of trees of a given species.
  stats = []
  for (let i = 0; i < userCanvas.width; i++) {
    let speciesDict = {};
    for (let species of treeSpecies) {
      speciesDict[species] = 0;
    }
    stats.push(speciesDict);
  }
}

// Build the boxes needed to calculated all nearest neighbors.
// Also used in birthTree() when seedSlider is active.
function setBoxDict() {
  // Reset boxDict.
  boxDict = {};
  // A given tree goes into 9 different boxes in total.
  for (let tree of treeArray) {
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
      if (key in boxDict) {
        boxDict[key].push(tree);  // key will be converted to string
      } else {
        boxDict[key] = [tree];  // key will be converted to string
      }
    }
  }
}

// Get all nearest neighbors by exploiting that trees have a maxRadius.
function setClosestNeighborDist() {
  // For each tree, compare with all other trees in box containing tree.
  for (let tree of treeArray) {
    let key = [tree.u, tree.v];
    tree.closestNeighborDist = Infinity;
    for (let closeTree of boxDict[key]) {
      let candidate = tree.getDistance(closeTree, true);
      // Need candidate > 0 in order to exclude tree iteself
      if (candidate < tree.closestNeighborDist && candidate > 0) {
        tree.closestNeighborDist = candidate;
      }
    }
  }
}

// Give birth to n new trees if space is available.
function birthTree(n = 1) {
  for (let i = 0; i < n; i++) {
    let x = Math.random() * forestCanvas.width;
    let y = Math.random() * forestCanvas.height;
    // Determining if there is a tree at (x, y)
    let pixelRGBA = c.getImageData(x, y, 1, 1);
    let colorValue = pixelRGBA.data[0] + pixelRGBA.data[1]
                     + pixelRGBA.data[2];
    if (colorValue > 750) {  // no currently existing tree at (x, y)
      // looking at neighboring trees
      let u = Math.floor(x / (2 * maxRadius));
      let v = Math.floor(y / (2 * maxRadius));

      let species = 0;  // will modify this in conditionals below
      if ((seedSlider.value > -1) && ([u, v] in boxDict)) { // seedling has neighbors
        // Building speciesDict to count species of neighboring trees
        let speciesDict = {};
        let totalNeighborArea = 0;
        for (let species of treeSpecies) {
          if (seedSlider.value == 0) {
            speciesDict[species] = 10;  // giving all species a chance
            totalNeighborArea += 10;
          } else {
            speciesDict[species] = 0;
          }
        }
        for (let tree of boxDict[[u, v]]) {
          // Weight according to neighbor area.
          // Could instead use some Lp weighting: weight by sum of powers of areas.
          speciesDict[tree.species] += tree.getArea();
          totalNeighborArea += tree.getArea();
        }
        for (let species in speciesDict) {
          speciesDict[species] /= totalNeighborArea;
        }
        // Need to get random species choice with weights from speciesDict
        let random = Math.random();
        let weight = speciesDict[species];  // getting first probability
        while (random > weight) {
          species++;
          weight += speciesDict[species];
        }
      } else {
        species = Math.floor(Math.random() * nTrees);
      }
      let tree = new Tree(x, y, species);
      treeArray.push(tree);  // putting tree into treeArray
      tree.draw();
    }
  }
}

// Grow and draw every tree in the forest.
function growForest() {
  // Using a traditional for loop in order to splice out dead trees.
  for (let i = 0; i < treeArray.length; i++) {
    let tree = treeArray[i];
    if (tree.isAlive) {
      tree.grow();
      tree.draw();  // will remove pixels from dead trees
    } else {  // remove dead trees from treeArray
      treeArray.splice(i, 1);
    }
  }
}

// Kill all trees in some big circle centered at (x, y)
function clearCut(x, y) {
  let threshold = Math.min(forestCanvas.width, forestCanvas.height) / 4;
  for (let tree of treeArray) {
    let dist = Math.sqrt(Math.pow(tree.x - x, 2) + Math.pow(tree.y - y, 2));
    if (dist < threshold) {
      tree.isAlive = false;
      tree.draw();  // remove the dead tree pixels
    }
  }
}

// Update statistics.
function updateStats() {
  stats.shift();  // remove first element from stats
  let speciesDict = {};  // creating new colorDict to push to stats
  for (let species of treeSpecies) {
    speciesDict[species] = 0;
  }
  for (let tree of treeArray) {
    speciesDict[tree.species] += tree.getArea();
  }
  // Converting the areas to proportions of canvas area.
  for (let species in speciesDict) {
    speciesDict[species] /= forestCanvas.width * forestCanvas.height;
  }
  stats.push(speciesDict);
}

// Graph the stats over time.
function graphStats() {
  c2.clearRect(0, 0, stats.length + 1, userCanvas.height + 1);
  for (let species of treeSpecies) {
    let t = 0;
    for (let speciesDict of stats) {
      if (t == 0) {
        c2.beginPath();  // starting path
        // Arbitrary constant 300 * nTrees used to scale the y-values appropriately.
        // Using max with 1 to prevent graph from going off the canvas.
        c2.moveTo(t, Math.max(userCanvas.height - 300 * nTrees * speciesDict[species], 1));
        t++;
      } else {
        c2.lineTo(t, Math.max(userCanvas.height - 300 * nTrees * speciesDict[species], 1));
        t++;
      }
    }
    c2.lineWidth = 3;
    c2.strokeStyle = treeColors[species];
    c2.stroke();
  }
}

// Animate the forest. This is the "main()" function for the forest.
let updateForest = function() {
  // Increasing the number of births will result in smaller trees. The number
  // of births and the constant in front of the deathProb should be inverse.
  birthTree(Math.pow(2, birthSlider.value) - 1);  // exponential scaling
  setBoxDict();
  setClosestNeighborDist();
  growForest();
  updateStats();
  graphStats();
};


// Keeps track of individual trees.
class Tree {
  constructor(x, y, species) {
    this.x = x;
    this.y = y;
    this.r = 1;
    // box coordinates
    this.u = Math.floor(x / (2 * maxRadius));
    this.v = Math.floor(y / (2 * maxRadius));
    this.species = species;
    this.growthRate = treeGrowths[species];
    this.color = treeColors[species];
    this.deathProb = 0;
    this.closestNeighborDist = Infinity;
    this.isAlive = true;
  }

  // Grow the tree and determine if still alive.
  grow() {
    // Growing r with some random noise.
    // Don't grow beyond edge of canvas. Don't grow into neighbors.

    let growBool = this.r < maxRadius
                   && this.r < this.closestNeighborDist
                   && this.x - this.r >= 0
                   && this.y - this.r >= 0
                   && this.x + this.r <= forestCanvas.width
                   && this.y + this.r <= forestCanvas.height;
    if (growBool) {
      this.r += this.growthRate * Math.random() / 5;
    }
    // Can scale the growthRate to affect dynamics.
    let deathIncrease = (Math.pow(3, deathSlider.value) - 1)  // exponential
                        * this.growthRate / Math.pow(10, 6);
    this.deathProb += deathIncrease;
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
  getDistance(tree, toEdge = false) {
    let distance = Math.sqrt(Math.pow(this.x - tree.x, 2)
                             + Math.pow(this.y - tree.y, 2));
    if (toEdge) {  // get distance to edge of circle
      return distance - tree.r;  // subtract off the radius of second tree
    } else {  // get distance to center of tree
      return distance;
    }
  }

  // Return the area of the tree.
  getArea() {
    return Math.PI * Math.pow(this.r, 2);
  }
}


// Various callback functions when user gives some input through a slider or click.
// Clear cut after user click.
let doOnClick = function(event) {
  let x = event.clientX;
  let y = event.clientY;
  clearCut(x, y);
}
forestCanvas.addEventListener('click', doOnClick);

// Reset the forest after user adjusts number of species.
let doOnSpeciesSlide = function(event) {
  resetForest();
}
speciesSlider.addEventListener('input', doOnSpeciesSlide);

// Adjust the setInterval update after user adjusts number of species.
let doOnUpdateSlide = function(event) {
  if (intervalID !== null) {
    clearInterval(intervalID);
  }
  let interval = Math.pow(2, 7 - updateSlider.value);
  // setInterval has a certain browser-dependent floor, possibly around 5ms
  intervalID = setInterval(updateForest, interval);
}
updateSlider.addEventListener('input', doOnUpdateSlide);


// Get animation initially started.
resetForest();
let intervalID = null;
doOnUpdateSlide();
