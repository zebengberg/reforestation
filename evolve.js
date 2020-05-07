import EvolvingForest from './evolvingforest.js';
// Getting the two canvas objects.
const forestCanvas = document.getElementById('forestCanvas');
const statsCanvas = document.getElementById('statsCanvas');
const description = document.getElementById('description');
// Creating forest object.
let forest;
resetForest();
window.onresize = resetForest;
function resetForest() {
    forestCanvas.width = window.innerWidth - 5;
    forestCanvas.height = 0.75 * (window.innerHeight - description.offsetHeight);
    statsCanvas.width = window.innerWidth - 5;
    statsCanvas.height = 0.25 * (window.innerHeight - description.offsetHeight) - 20;
    forest = new EvolvingForest({ forestCanvas, statsCanvas });
}
// Animating.
// document.onkeydown = () => forest.update();  // useful for debugging
setInterval(() => forest.update(true), 10);
