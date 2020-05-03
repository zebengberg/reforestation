export default class Tree {
  constructor(args) {
    // Getting properties from forest.
    this.x = args.x;
    this.y = args.y;
    this.u = args.u;
    this.v = args.v;
    this.species = args.species;
    this.color = args.color;
    this.growthRate = args.growthRate;
    this.deathRate = args.deathRate;
    this.maxRadius = args.maxRadius;

    this.canvas = args.canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.c = this.canvas.getContext('2d');


    // Other properties that change over time.
    this.r = 1;
    this.deathProb = 0;
    this.closestNeighborDist = Infinity;
    this.isAlive = true;
  }

  // Check if tree is entirely contained in canvas.
  isContainedInCanvas() {
    return this.x - this.r >= 0 && this.x + this.r <= this.width &&
           this.y - this.r >= 0 && this.y + this.r <= this.height;
  }

  // Grow the tree and determine if it is still alive.
  grow() {
    // Don't grow beyond edge of canvas. Don't grow into neighbors.
    if (this.r < this.maxRadius &&
        this.r < this.closestNeighborDist &&
        this.isContainedInCanvas()) {
      this.r += this.growthRate * Math.random() / 5;
    }

    // A faster growing tree has a higher probability of dying.
    this.deathProb += this.deathRate * this.growthRate / Math.pow(10, 6);
    this.isAlive = Math.random() > this.deathProb;
  }

  // Draw a tree if alive; draw a blank circle if dead.
  draw() {
    this.c.beginPath();
    if (this.isAlive) {
      this.c.fillStyle = this.color;
    } else {
      this.r += 2;  // pad the blank circle so no leftovers after filled white
      this.c.fillStyle = 'rgba(255, 255, 255, 255)';
    }
    this.c.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    if (this.isAlive) {  // give the trees a black outline
      this.c.lineWidth = 2;
      this.c.strokeStyle = 'black';
      this.c.stroke();
    }
    this.c.closePath();
    this.c.fill();
  }

  // Get distance between this tree and another point or tree.
  getDistance(coords, otherRadius = null) {
    const dist = Math.sqrt(Math.pow(this.x - coords.x, 2) + Math.pow(this.y - coords.y, 2));
    return otherRadius ? dist - otherRadius : dist;
  }

  // Return the area of the tree.
  get area() {
    return Math.PI * Math.pow(this.r, 2);
  }

  // Return the x and y coordinates of the tree as an object.
  get coords() {
    return {x: this.x, y: this.y};
  }
}