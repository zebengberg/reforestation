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
const parentCheck = document.getElementById('parentCheck');
const numberSpeciesSlider = document.getElementById('numberSpeciesSlider');
let numberSpecies = Number(numberSpeciesSlider.value);

// Creating forest object.
const forestArgs = {forestCanvas, statsCanvas, birthRateSlider, deathRateSlider,
  parentCheck, numberSpecies};
let forest = new Forest(forestArgs);

// Resetting forest
numberSpeciesSlider.onchange = () => {
  forest.resetContext();
  numberSpecies = Number(numberSpeciesSlider.value);
  forestArgs.numberSpecies = numberSpecies;
  forest = new Forest(forestArgs);
};

// Animating.
document.onkeydown = () => forest.update();  // useful for debugging
setInterval(() => forest.update(), 10);