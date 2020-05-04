export default class Tree {
  x: number;
  y: number;
  u: number;
  v: number;
  r: number;
  species: number;
  color: string;
  growthRate: number;
  deathRate: number;
  maxRadius: number;
  isAlive: boolean;
  deathProb: number;
  closestNeighborDistance: number;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;

  constructor({x, y, u, v, species, color, growthRate, deathRate, maxRadius,
    canvas}: {x: number, y: number, u: number, v: number, species: number,
    color: string, growthRate: number, deathRate: number, maxRadius: number,
    canvas: HTMLCanvasElement}) {
    // Getting properties from forest.
    this.x = x;
    this.y = y;
    this.u = u;
    this.v = v;
    this.species = species;
    this.color = color;
    this.growthRate = growthRate;
    this.deathRate = deathRate;
    this.maxRadius = maxRadius;
    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');

    // Other properties that change over time.
    this.r = 1;
    this.deathProb = 0;
    this.closestNeighborDistance = Infinity;
    this.isAlive = true;
  }

  // Check if tree is entirely contained in canvas.
  isContainedInCanvas() {
    return this.x - this.r >= 0 && this.x + this.r <= this.canvas.width &&
           this.y - this.r >= 0 && this.y + this.r <= this.canvas.height;
  }

  // Grow the tree and determine if it is still alive.
  grow() {
    // Don't grow beyond edge of canvas. Don't grow into neighbors.
    if (this.r < this.maxRadius &&
        this.r < this.closestNeighborDistance &&
        this.isContainedInCanvas()) {
      this.r += this.growthRate * Math.random() / 5;
    }

    // A faster growing tree has a higher probability of dying.
    this.deathProb += this.deathRate * this.growthRate / Math.pow(10, 6);
    this.isAlive = Math.random() > this.deathProb;
  }

  // Draw a tree if alive; draw a blank circle if dead.
  draw() {
    this.context.beginPath();
    if (this.isAlive) {
      this.context.fillStyle = this.color;
    } else {
      this.r += 2;  // pad the blank circle so no leftovers after filled white
      this.context.fillStyle = 'rgba(255, 255, 255, 255)';
    }
    this.context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
    if (this.isAlive) {  // give the trees a black outline
      this.context.lineWidth = 2;
      this.context.strokeStyle = 'black';
      this.context.stroke();
    }
    this.context.closePath();
    this.context.fill();
  }

  // Get distance between this tree and another point or tree.
  getDistance(x: number, y: number, r: number = 0) {
    return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2)) - r;
  }

  // Return the area of the tree.
  get area() {
    return Math.PI * Math.pow(this.r, 2);
  }
}