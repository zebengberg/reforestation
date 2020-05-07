import Forest from './forest.js';

// Sizing the two canvas objects.
const userInput = <HTMLDivElement> document.getElementById('userInput');
const forestCanvas = <HTMLCanvasElement> document.getElementById('forestCanvas');
const statsCanvas = <HTMLCanvasElement> document.getElementById('statsCanvas');

// User input.
const birthRateSlider = <HTMLInputElement> document.getElementById('birthRateSlider');
const deathRateSlider = <HTMLInputElement> document.getElementById('deathRateSlider');
const numberSpeciesSlider = <HTMLInputElement> document.getElementById('numberSpeciesSlider');

// Creating forest object.
const forestArgs = {forestCanvas, statsCanvas, birthRate: 5, deathRate: 5, numberSpecies: 3};
let forest: Forest;
resetForest();
updateForestProperties();


// Callback functions.
function updateForestProperties() {
  forest.birthRate = Math.pow(3, +birthRateSlider.value) - 1;
  forest.deathRate = Math.pow(3, +deathRateSlider.value) - 1;
  forest.treeArray.forEach(tree => tree.deathRate = forest.deathRate);
}

function resetForest() {
  // Refitting canvas to window.
  forestCanvas.width = window.innerWidth - 5;
  forestCanvas.height = 0.75 * (window.innerHeight - userInput.offsetHeight);
  statsCanvas.width = window.innerWidth - 5;
  statsCanvas.height = 0.25 * (window.innerHeight - userInput.offsetHeight) - 20;

  // Resetting forest.
  forestArgs.numberSpecies = +numberSpeciesSlider.value;
  forest = new Forest(forestArgs);
}

birthRateSlider.onchange = updateForestProperties;
deathRateSlider.onchange = updateForestProperties;
numberSpeciesSlider.onchange = resetForest;
window.onresize = resetForest;

forestCanvas.onclick = event => {
  const rect = forestCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  forest.clearCut(x, y);
};


// Option for downloading canvas contents as png during setInterval.
let numIterations = 0;
function downloadCanvas() {
  if (++numIterations % 100 === 0) {
    const link = document.createElement('a');
    link.download = 'canvas' + numIterations / 100 + '.png';
    link.href = forestCanvas.toDataURL()
    link.click();
  }
}

// Animating.
// document.onkeydown = () => forest.update();  // useful for debugging
setInterval(() => forest.update(), 10);