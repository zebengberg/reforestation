var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var c = canvas.getContext('2d');
c.fillStyle = 'rgba(255, 255, 255, 255)';
c.fillRect(0, 0, window.innerWidth, window.innerHeight);


class Forest {
	constructor() {
		this.nTrees = 2;
		this.treeGrowths = [.2, .8];
		this.treeColors = ['MediumSpringGreen', 'Coral'];
		this.treeArray = [];
	}

	birthTree() {
		var x = Math.random() * window.innerWidth;
		var y = Math.random() * window.innerHeight;
		var pixelValue = c.getImageData(x, y, 1, 1);
	}
}

class Tree {
	constructor(forest) {
		this.x = Math.random() * window.innerWidth;
		this.y = Math.random() * window.innerHeight;
		this.r = 10;
		var index = Math.floor(Math.random() * forest.nTrees);
		this.growthRate = forest.treeGrowths[index];
		this.color = forest.treeColors[index];
		this.deathProb = 0;
		this.crowded = 0;
		this.isAlive = true;
	}

	draw() {
		c.beginPath();
		c.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
		c.closePath();
		c.fillStyle = this.isAlive ? this.color : 'rgba(255, 255, 255, 255)';
		c.fill();
	}

	grow() {
		this.r += this.growthRate * Math.random() / 3;
		this.deathProb += Math.pow(this.growthRate, 3) / 1000;  // include some randomization
		if (Math.random() < this.deathProb) {
			this.isAlive = false;
		}
	}

	getNeighbors() {
    // something with setting crowded
	}
}

// Birth forest and many new trees
var forest = new Forest;
for (var i = 0; i < 500; i++) {
	var tree = new Tree(forest);
	forest.treeArray.push(tree);
}

var update = function() {
	forest.birthTree();
	for (var i = 0; i < forest.treeArray.length; i++) {
		var tree = forest.treeArray[i];
		if (tree.isAlive) {
			tree.grow();
			tree.draw();
		}
	}
}

setInterval(update, 100);
