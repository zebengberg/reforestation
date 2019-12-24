var canvas = document.querySelector('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
var c = canvas.getContext('2d');

class Forest {
	constructor() {
		this.nTrees = 2;
		this.treeGrowths = [.2, .8];
		this.treeColors = ['MediumSpringGreen', 'Coral'];
		this.treeArray = [];
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
		c.fillStyle = this.isAlive ? this.color : 'white';
		c.fill();
	}

	grow() {
		this.r += this.growthRate * Math.random() / 3;
		this.deathProb += Math.pow(this.growthRate, 3) / 10000;  // include some randomization
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

var stuff = function() {
	for (var i = 0; i < forest.treeArray.length; i++) {
		var tree = forest.treeArray[i];
		if (tree.isAlive) {
			tree.grow();
			tree.draw();
		}
	}
}

setInterval(stuff, 10);
