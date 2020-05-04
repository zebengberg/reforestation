import Forest from './forest.js';

// Sizing the two canvas objects.
const userInput = <HTMLDivElement> document.getElementById('userInput');
const forestCanvas = <HTMLCanvasElement> document.getElementById('forestCanvas');
forestCanvas.width = window.innerWidth - 5;
forestCanvas.height = 0.75 * (window.innerHeight - userInput.offsetHeight);
const statsCanvas = <HTMLCanvasElement> document.getElementById('statsCanvas');
statsCanvas.width = window.innerWidth - 5;
statsCanvas.height = 0.25 * (window.innerHeight - userInput.offsetHeight) - 20;

// User input.
const birthRateSlider = <HTMLInputElement> document.getElementById('birthRateSlider');
const deathRateSlider = <HTMLInputElement> document.getElementById('deathRateSlider');
const parentCheckbox = <HTMLInputElement> document.getElementById('parentCheckbox');
const numberSpeciesSlider = <HTMLInputElement> document.getElementById('numberSpeciesSlider');

let numberSpecies = +numberSpeciesSlider.value;
// arbitrary initial values; we call updateForestProperties below.
const birthRate = 1;
const deathRate = 1;
const parentCheck = true;


// Creating forest object.
const forestArgs = {forestCanvas, statsCanvas, birthRate, deathRate, parentCheck, numberSpecies};
let forest = new Forest(forestArgs);
updateForestProperties();

// Callback functions.
function updateForestProperties() {
  forest.birthRate = Math.pow(3, +birthRateSlider.value) - 2;
  forest.deathRate = Math.pow(3, +deathRateSlider.value) - 2;
  forest.parentCheck = parentCheckbox.checked;
  forest.treeArray.forEach(tree => tree.deathRate = forest.deathRate);
}

birthRateSlider.onchange = updateForestProperties;
deathRateSlider.onchange = updateForestProperties;
parentCheckbox.onchange = updateForestProperties;

numberSpeciesSlider.onchange = () => {
  forest.resetContext();
  numberSpecies = +numberSpeciesSlider.value;
  forestArgs.numberSpecies = numberSpecies;
  forest = new Forest(forestArgs);
};

forestCanvas.onclick = event => {
  const rect = forestCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  forest.clearCut(x, y);
};

// Animating.
// document.onkeydown = () => forest.update();  // useful for debugging
setInterval(() => forest.update(), 10);