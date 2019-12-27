var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var c = canvas.getContext('2d');
c.fillStyle = 'rgba(255, 255, 255, 255)';
c.fillRect(0, 0, window.innerWidth, window.innerHeight);



class Forest {
	constructor() {
		this.nTrees = 4;
		this.treeGrowths = [.05, .2, .6, .8];
		this.treeColors = ['MidnightBlue', 'MediumSpringGreen', 'Gold', 'Coral'];
		this.treeArray = [];
		this.maxRadius = 100;
		this.U = window.innerWidth / (2 * this.maxRadius);  // so tree.u <= U
		this.V = window.innerHeight / (2 * this.maxRadius);  // and tree.v <= V
		this.boxDict = {};
	}

	// Build the boxes needed to calculated all nearest neighbors.
	// A given tree goes into 9 different boxes in total.
	buildBoxDict() {
		for (var tree of this.treeArray) {
			var u = tree.u;
			var v = tree.v;
			// Not a problem if any of these keys are actually out of bounds.
			var keys = [[u - 1, v - 1],
									[u - 1, v],
									[u - 1, v + 1],
									[u, v - 1],
									[u, v],
									[u, v + 1],
									[u + 1, v - 1],
									[u + 1, v],
									[u + 1, v + 1]]
			for (var key of keys) {
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
		// Clump all trees into small boxes
		for (var tree of this.treeArray) {
			var key = [tree.u, tree.v];
			tree.closestNeighborDist = Infinity;
			for (var closeTree of this.boxDict[key]) {
				var candidate = tree.distance(closeTree, true);
				if (candidate < tree.closestNeighborDist & candidate > 0) {  // excluding same tree
					tree.closestNeighborDist = candidate;
				}
			}
		}
	}

  // Give birth to n new trees if space is available.
	birthTree(n = 1) {
		for (var i = 0; i < n; i++) {
			var x = Math.random() * window.innerWidth;
			var y = Math.random() * window.innerHeight;
			// Determining if there is a tree at (x, y)
			var pixelRGBA = c.getImageData(x, y, 1, 1);
			var colorValue = pixelRGBA.data[0] + pixelRGBA.data[0] + pixelRGBA.data[1];
			if (colorValue > 750) {  // no tree at (x, y)
				var index = Math.floor(Math.random() * this.nTrees);
				var growthRate = this.treeGrowths[index];
				var color = this.treeColors[index];
				var tree = new Tree(x, y, growthRate, color, this.maxRadius);
				this.treeArray.push(tree);  // putting tree into treeArray
				tree.draw();
			}
		}
	}

	// Grow and draw every tree in the forest.
	grow() {
		// console.log('Number of trees: ' + this.treeArray.length);
		for (var i = 0; i < this.treeArray.length; i++) {
			var tree = this.treeArray[i];
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
		var threshold = Math.min(window.innerWidth, window.innerHeight) / 4;
		for (var i = 0; i < this.treeArray.length; i++) {
			var tree = this.treeArray[i];
			var distance = Math.sqrt(Math.pow(tree.x - x, 2) + Math.pow(tree.y - y, 2));
			if (distance < threshold) {
				tree.isAlive = false;
				tree.draw();  // remove the dead tree pixels
			}
		}
	}
}


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
		// Growing r with some random noise.
		this.r += this.growthRate * Math.random() / 1;
		// Clipping r so that it isn't larger than maxRadius or overlap neighbor.
		this.r = Math.min(this.r, this.maxRadius, this.closestNeighborDist);

		this.deathProb += Math.pow(this.growthRate, 3) / 50000;
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
			this.r += 1  // pad the blank circle so no leftovers appear
			c.fillStyle = 'rgba(255, 255, 255, 255)';
		}
		c.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
		if (this.isAlive) {  // give the trees a black outline
			c.strokeStyle = 'black';
			c.stroke();
		}
		c.closePath();
		c.fill();
	}

	// Get distance between this tree and another tree
	distance(tree, toEdge = false) {
		var distance = Math.sqrt(Math.pow(this.x - tree.x, 2)
		                         + Math.pow(this.x - tree.x, 2));
	  if (toEdge) {
			return distance - tree.r;  // subtract off the radius of second tree
		} else {
			return distance;
		}
	}
}


var forest = new Forest;

// Clear cut after user click.
var doOnClick = function(event) {
	var x = event.clientX;
	var y = event.clientY;
	forest.clearCut(x, y);
}
canvas.addEventListener('click', doOnClick);

// Animate the forest.
var update = function() {
	forest.birthTree();
	forest.buildBoxDict();
	forest.setClosestNeighborDist();
	forest.grow();
};
setInterval(update, 200);
