import EvolvingForest from './evolvingforest.js';

// Sizing the two canvas objects.
const forestCanvas = <HTMLCanvasElement> document.getElementById('forestCanvas');
forestCanvas.width = window.innerWidth - 5;
forestCanvas.height = 0.75 * window.innerHeight;
const statsCanvas = <HTMLCanvasElement> document.getElementById('statsCanvas');
statsCanvas.width = window.innerWidth - 5;
statsCanvas.height = 0.25 * window.innerHeight - 20;

// Creating forest object.
const forestArgs = {forestCanvas, statsCanvas};
let forest = new EvolvingForest(forestArgs);


forestCanvas.onclick = event => {
  const rect = forestCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  forest.clearCut(x, y);
};

// Animating.
//document.onkeydown = () => forest.update();  // useful for debugging
setInterval(() => forest.update(), 10);