// Spot the Difference — boot. One job only: wire the canvas to the game
// and start the animation loop. All rules live in game.js.

import { SpotTheDifferenceGame } from './game.js';

const canvas = document.getElementById('game');
const statusLine = document.getElementById('status');

if (!canvas) throw new Error('canvas #game is missing from index.html');

const game = new SpotTheDifferenceGame(canvas, statusLine);
requestAnimationFrame((time) => game.frame(time));
