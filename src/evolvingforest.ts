import Forest from './forest.js';
import Tree from './tree.js';

export default class EvolvingForest extends Forest {
  constructor({forestCanvas, statsCanvas} : {forestCanvas: HTMLCanvasElement,
    statsCanvas: HTMLCanvasElement}) {
    super({forestCanvas, statsCanvas, birthRate: 5, deathRate: 10, numberSpecies: 3});
  }

  getSpeciesColor(species: number) {
    switch(species) {
      case 0:
        return '#0000C0';
      case 1:
        return '#00C000';
      case 2:
        return '#C00000';
    }
  }

  getIndividualColor(species: number, growthRate: number) {
    let hex = Math.floor(128 + growthRate * 128).toString(16);
    switch(species) {
      case 0:
        return '#0000' + hex;
      case 1:
        return '#00' + hex + '00';
      case 2:
        return '#' + hex + '0000';
    }
  }

  // Overriding method from parent class.
  getTreeArgs(x: number, y: number, species: number, parent: Tree = null) {
    let growthRate: number;
    if (parent === null) {
      growthRate = this.getGrowthRate(species);
    } else {
      // Including random noise -- this enables evolution.
      growthRate = parent.growthRate;
      growthRate += 0.3 * this.randomNormal();
      if (growthRate > 1) {
        growthRate = 1;
      } else if (growthRate < 0) {
        growthRate = 0;
      }
    }
    const deathRate = this.deathRate;
    const color = this.getIndividualColor(species, growthRate);
    const canvas = this.canvas;
    const maxRadius = this.maxTreeRadius;
    return {x, y, species, growthRate, deathRate, color, canvas, maxRadius}
  }

  // Uses Box-Muller to get random normal with mean 0 and standard deviation 1.
  randomNormal() {
    const s = Math.random();
    const t = Math.random();
    return Math.sqrt(-2 * Math.log(s)) * Math.cos(2 * Math.PI * t);
  }

  // Calculate the average growth rate of species across forest.
  getAverageGrowthRate(species: number) {
    const speciesArray = this.treeArray.filter(tree => tree.species === species);
    const sum = speciesArray.reduce((acc, tree) => acc + tree.growthRate, 0);
    if (sum === 0) {
      return this.getGrowthRate(species);  // default from Forest
    }
    return sum / speciesArray.length;
  }

  // Overriding method from parent class.
  updateStats() {
    this.stats.shift();  // remove first element from stats
    const averageGrowthRates = [];
    for (let species = 0; species < this.numberSpecies; species++) {
      const speciesArray = this.treeArray.filter(tree => tree.species === species);
      averageGrowthRates.push(this.getAverageGrowthRate(species));
    }
    this.stats.push(averageGrowthRates);
  }

  // Overriding
  graphStats() {
    const c = this.statsCanvas.getContext('2d');
    c.clearRect(0, 0, this.statsCanvas.width, this.statsCanvas.height);
    for (let species = 0; species < this.numberSpecies; species++) {
      let timeSeries = this.stats.map(areas => areas[species]);
      let t = timeSeries.findIndex(r => r > 0);
      // Scaling data to fit in statsCanvas
      timeSeries = timeSeries.map(r => (1 - r) * this.statsCanvas.height);

      c.beginPath();
      c.moveTo(t, timeSeries[t]);
      for (; t < this.statsCanvas.width; t++) {
        c.lineTo(t, timeSeries[t]);
      }
      c.lineWidth = 3;
      c.strokeStyle = this.getSpeciesColor(species);
      c.stroke();
    }
  }
}