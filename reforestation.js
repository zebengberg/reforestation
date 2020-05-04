import Forest from './forest.js';
// Sizing the two canvas objects.
const forestCanvas = document.getElementById('forestCanvas');
forestCanvas.width = window.innerWidth - 3;
forestCanvas.height = 0.75 * window.innerHeight;
const statsCanvas = document.getElementById('statsCanvas');
statsCanvas.width = 0.6 * window.innerWidth;
statsCanvas.height = 0.25 * window.innerHeight - 20;
// User input.
const birthRateSlider = document.getElementById('birthRateSlider');
const deathRateSlider = document.getElementById('deathRateSlider');
const parentCheckbox = document.getElementById('parentCheckbox');
const numberSpeciesSlider = document.getElementById('numberSpeciesSlider');
let numberSpecies = +numberSpeciesSlider.value;
const birthRate = 1;
const deathRate = 1;
const parentCheck = true;
// Creating forest object.
const forestArgs = { forestCanvas, statsCanvas, birthRate, deathRate, parentCheck, numberSpecies };
let forest = new Forest(forestArgs);
// Callback functions.
function updateForestProperties() {
    forest.birthRate = Math.pow(3, +birthRateSlider.value) - 1;
    forest.deathRate = Math.pow(3, +deathRateSlider.value) - 1;
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
