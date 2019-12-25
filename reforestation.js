var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var c = canvas.getContext('2d');
c.fillStyle = 'rgba(255, 255, 255, 255)';
c.fillRect(0, 0, window.innerWidth, window.innerHeight);


class Forest {
	constructor() {
		this.nTrees = 4;
		this.treeGrowths = [.05, .2, .7, .95];
		this.treeColors = ['MidnightBlue', 'MediumSpringGreen', 'Gold', 'Coral'];
		this.treeArray = [];
	}

  // Give birth to n new trees if space is available.
	birthTree(n = 1) {
		for (var i = 0; i < n; i++) {
			var x = Math.random() * window.innerWidth;
			var y = Math.random() * window.innerHeight;
			// Determining if there is a tree at (x, y)
			var pixelRGBA = c.getImageData(x, y, 1, 1);
			var colorValue = pixelRGBA.data[0] + pixelRGBA.data[0] + pixelRGBA.data[1];
			if (colorValue > 750) {  // No tree
				var index = Math.floor(Math.random() * this.nTrees);
				var growthRate = this.treeGrowths[index];
				var color = this.treeColors[index];
				var tree = new Tree(x, y, growthRate, color);
				this.treeArray.push(tree);
				tree.draw();
			}
		}
	}

	// Kill all trees in some big region if the user clicks.
	clearCut() {
		canvas.addEventListener('click', function(event) {
			var x = event.clientX;
			var y = event.clientY;
			var threshold = Math.min(window.innerWidth, window.innerHeight) / 2;
			for (var i = 0; i < forest.treeArray.length; i++) {
				var tree = forest.treeArray[i];
				var distance = Math.abs(tree.x - x, 2) + Math.abs(tree.y - y, 2);
				if (distance < threshold) {
					tree.isAlive = false;
					tree.draw();
				}
			}
		})
	}

  // Grow and draw every tree in the forest.
	grow() {
		for (var i = 0; i < this.treeArray.length; i++) {
			var tree = this.treeArray[i];
			if (tree.isAlive) {
				tree.grow();
				tree.draw();
			}
		}
	}

	// Update forest.
	update() {
		this.clearCut();
		this.birthTree();
		this.grow();
	}
}


class Tree {
	constructor(x, y, growthRate, color) {
		this.x = x;
		this.y = y;
		this.r = 1;
		this.growthRate = growthRate;
		this.color = color;
		this.deathProb = 0;
		this.isAlive = true;
	}

	draw() {
		c.beginPath();
		if (this.isAlive) {
			c.stroke();
			c.fillStyle = this.color;
		} else {
			this.r += 1  // pad the disk so no leftovers appear
			c.fillStyle = 'rgba(255, 255, 255, 255)';
		}
		c.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
		c.closePath();
		c.fill();
	}

	grow() {
		this.r += this.growthRate * Math.random() / 10;
		this.deathProb += Math.pow(this.growthRate, 3) / 50000;
		if (Math.random() < this.deathProb) {
			this.isAlive = false;
		}
	}
	//getNeighbors() {
    // something with setting crowded
	//}
}


// Animate the forest.
var forest = new Forest;
var update = function() {forest.update()};
setInterval(update, 100);
