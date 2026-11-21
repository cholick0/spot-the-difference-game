// Spot the Difference — the rules and the frame.
// One job only: run the game. It owns the state machine (title, playing,
// round clear, won, out of time), the clicks, the timer, the score, the
// hints, the markers and every bit of HUD text. The pictures come from
// scenes.js, the spots from differences.js, the sounds from audio.js.

import { CANVAS_WIDTH, CANVAS_HEIGHT, PANEL, LEVELS, SCORING, COLOURS } from './config.js';
import { DIFFERENCES, differenceCount } from './differences.js';
import { paintScene } from './scenes.js';
import { playFound, playWrong, playHint, playWin, playTick, playClick, toggleMute, isMuted } from './audio.js';

const TITLE = 'SPOT THE DIFFERENCE';
const SUBTITLE = 'Lantern Harbour  ·  Night Market  ·  Sunny Garden';

export class SpotTheDifferenceGame {
  constructor(canvas, statusLine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.statusLine = statusLine;
    this.state = 'title';
    this.levelIndex = 0;
    this.found = new Set();
    this.score = 0;
    this.combo = 0;
    this.mistakes = 0;
    this.hintsLeft = SCORING.hintsPerLevel;
    this.timeLeft = 0;
    this.lastTickSecond = -1;
    this.marks = [];
    this.hintPulse = null;
    this.message = '';
    this.messageUntil = 0;
    this.totalFound = 0;
    this.totalDifferences = LEVELS.reduce((sum, level) => sum + differenceCount(level.id), 0);
    this.wonAt = 0;
    this.lastFrame = 0;
    this.hover = null;

    canvas.addEventListener('click', (event) => this.onClick(event));
    canvas.addEventListener('mousemove', (event) => this.onHover(event));
    window.addEventListener('keydown', (event) => this.onKey(event));
  }

  // ------------------------------------------------------------ state

  level() {
    return LEVELS[this.levelIndex];
  }

  remaining() {
    return differenceCount(this.level().id) - this.found.size;
  }

  startGame() {
    this.levelIndex = 0;
    this.score = 0;
    this.totalFound = 0;
    this.mistakes = 0;
    this.startLevel();
    playClick();
  }

  startLevel() {
    this.found = new Set();
    this.combo = 0;
    this.hintsLeft = SCORING.hintsPerLevel;
    this.timeLeft = this.level().timeLimitSeconds;
    this.lastTickSecond = -1;
    this.marks = [];
    this.hintPulse = null;
    this.state = 'playing';
    this.say(`${this.level().name}: find ${differenceCount(this.level().id)} differences!`);
  }

  // ------------------------------------------------------------ input

  canvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  }

  // Which panel, if any, holds this canvas point, and where inside it.
  panelPoint(point) {
    for (const [side, x] of [['left', PANEL.leftX], ['right', PANEL.rightX]]) {
      if (point.x >= x && point.x < x + PANEL.width && point.y >= PANEL.y && point.y < PANEL.y + PANEL.height) {
        return { side, x: point.x - x, y: point.y - PANEL.y };
      }
    }
    return null;
  }

  onHover(event) {
    this.hover = this.canvasPoint(event);
  }

  onClick(event) {
    const point = this.canvasPoint(event);
    if (this.state === 'title') return this.startGame();
    if (this.state === 'roundClear') return this.nextLevel();
    if (this.state === 'won' || this.state === 'timeUp') return this.startGame();
    if (this.state !== 'playing') return;

    // The hint button lives in the footer.
    if (this.hintButtonRect && this.inRect(point, this.hintButtonRect)) return this.useHint();

    const panel = this.panelPoint(point);
    if (!panel) return;
    this.checkClick(panel.x, panel.y, point.x, point.y);
  }

  onKey(event) {
    const key = event.key.toLowerCase();
    if (key === 'h' && this.state === 'playing') return this.useHint();
    if (key === 'm') {
      toggleMute();
      this.flash(isMuted() ? 'Sound off (M to turn back on)' : 'Sound on');
      return;
    }
    if (key === 'enter' || key === ' ') {
      if (this.state === 'title') return this.startGame();
      if (this.state === 'roundClear') return this.nextLevel();
      if (this.state === 'won' || this.state === 'timeUp') return this.startGame();
    }
    if (key === 'r' && (this.state === 'playing' || this.state === 'timeUp')) return this.startLevel();
  }

  inRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;
  }

  // ------------------------------------------------------------ rules

  checkClick(panelX, panelY, canvasX, canvasY) {
    const spots = DIFFERENCES[this.level().id];
    for (const spot of spots) {
      if (this.found.has(spot.key)) continue;
      const dx = panelX - spot.x;
      const dy = panelY - spot.y;
      if (dx * dx + dy * dy <= (spot.radius + 6) * (spot.radius + 6)) {
        return this.markFound(spot);
      }
    }
    this.markWrong(canvasX, canvasY);
  }

  markFound(spot) {
    this.found.add(spot.key);
    this.totalFound += 1;
    this.combo += 1;
    const gained = SCORING.findPoints + (this.combo - 1) * SCORING.comboStepPoints;
    this.score += gained;
    this.marks.push({ key: spot.key, x: spot.x, y: spot.y, radius: spot.radius, born: performance.now(), kind: 'found' });
    playFound();
    this.flash(`Found it — ${spot.name}! +${gained}${this.combo > 1 ? ` (combo x${this.combo})` : ''}`);
    this.say(`Found ${spot.name}. ${this.remaining()} differences remain.`);
    if (this.remaining() === 0) this.clearRound();
  }

  markWrong(canvasX, canvasY) {
    this.combo = 0;
    this.mistakes += 1;
    this.score = Math.max(0, this.score + SCORING.wrongClickPoints);
    this.marks.push({ key: `wrong-${Date.now()}`, x: canvasX, y: canvasY, radius: 18, born: performance.now(), kind: 'wrong', absolute: true });
    playWrong();
    this.flash('Not quite — look again! −25');
  }

  useHint() {
    if (this.hintsLeft <= 0) {
      this.flash('No hints left in this round!');
      return;
    }
    const unfound = DIFFERENCES[this.level().id].filter((spot) => !this.found.has(spot.key));
    if (unfound.length === 0) return;
    this.hintsLeft -= 1;
    this.score = Math.max(0, this.score + SCORING.hintCostPoints);
    const pick = unfound[Math.floor(Math.random() * unfound.length)];
    this.hintPulse = { key: pick.key, x: pick.x, y: pick.y, radius: pick.radius, until: performance.now() + 2200 };
    playHint();
    this.flash(`Hint: something changed near here… −50 (${this.hintsLeft} left)`);
  }

  clearRound() {
    const bonus = Math.round(this.timeLeft) * SCORING.timeBonusPerSecond;
    this.score += bonus;
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.state = 'won';
      this.wonAt = performance.now();
      playWin(true);
      this.say(`You found all ${this.totalDifferences} differences! Final score ${this.score}.`);
    } else {
      this.state = 'roundClear';
      playWin(false);
      this.say(`${this.level().name} clear! Time bonus +${bonus}.`);
    }
    this.roundBonus = bonus;
  }

  nextLevel() {
    this.levelIndex += 1;
    this.startLevel();
    playClick();
  }

  flash(text) {
    this.message = text;
    this.messageUntil = performance.now() + 2200;
  }

  say(text) {
    if (this.statusLine) this.statusLine.textContent = text;
  }

  // ------------------------------------------------------------ update

  update(now, dt) {
    if (this.state === 'playing') {
      this.timeLeft -= dt;
      const whole = Math.ceil(this.timeLeft);
      if (whole <= 10 && whole !== this.lastTickSecond && whole > 0) {
        this.lastTickSecond = whole;
        playTick();
      }
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.state = 'timeUp';
        this.say(`Out of time on ${this.level().name}. Press R to retry the round.`);
      }
    }
    this.marks = this.marks.filter((mark) => now - mark.born < 2600 || mark.kind === 'found');
    if (this.hintPulse && now > this.hintPulse.until) this.hintPulse = null;
  }

  // ------------------------------------------------------------ render

  frame(now) {
    const dt = Math.min(0.1, (now - this.lastFrame) / 1000 || 0);
    this.lastFrame = now;
    this.update(now, dt);
    this.render(now);
    requestAnimationFrame((t) => this.frame(t));
  }

  render(now) {
    const g = this.ctx;
    g.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.renderHeader(g);
    if (this.state === 'title') {
      this.renderTitle(g);
    } else {
      this.renderPanels(g, now);
      this.renderFooter(g, now);
    }
    if (this.state === 'roundClear') this.renderRoundClear(g);
    if (this.state === 'won') this.renderWin(g, now);
    if (this.state === 'timeUp') this.renderTimeUp(g);
    if (this.message && now < this.messageUntil) this.renderMessage(g);
  }

  renderHeader(g) {
    g.fillStyle = COLOURS.header;
    g.fillRect(0, 0, CANVAS_WIDTH, HEADER_HEIGHT);
    g.fillStyle = COLOURS.headerLine;
    g.fillRect(0, HEADER_HEIGHT - 3, CANVAS_WIDTH, 3);
    g.fillStyle = COLOURS.gold;
    g.font = 'bold 30px sans-serif';
    g.textAlign = 'left';
    g.textBaseline = 'middle';
    g.fillText('SPOT THE DIFFERENCE', 24, 34);
    g.fillStyle = COLOURS.soft;
    g.font = '16px sans-serif';
    g.fillText(SUBTITLE, 24, 62);

    // The remaining counter — the number the player watches.
    const remaining = this.state === 'title' ? this.totalDifferences : this.remaining();
    const total = this.state === 'title' ? this.totalDifferences : differenceCount(this.level().id);
    g.fillStyle = '#2c2140';
    g.beginPath();
    g.roundRect(880, 14, 180, 56, 12);
    g.fill();
    g.fillStyle = COLOURS.cream;
    g.font = 'bold 15px sans-serif';
    g.textAlign = 'center';
    g.fillText('REMAINING', 970, 30);
    g.fillStyle = remaining === 0 ? COLOURS.green : COLOURS.gold;
    g.font = 'bold 26px sans-serif';
    g.fillText(`${remaining} / ${total}`, 970, 54);

    // Score and clock.
    g.fillStyle = COLOURS.cream;
    g.font = 'bold 20px sans-serif';
    g.textAlign = 'right';
    g.fillText(`SCORE  ${this.score}`, 1256, 30);
    const clock = this.state === 'title' ? '--:--' : `${Math.floor(Math.max(0, this.timeLeft) / 60)}:${String(Math.floor(Math.max(0, this.timeLeft) % 60)).padStart(2, '0')}`;
    g.fillStyle = this.state === 'playing' && this.timeLeft <= 10 ? COLOURS.red : COLOURS.cream;
    g.fillText(`TIME  ${clock}`, 1256, 60);
    g.textAlign = 'left';
  }

  renderPanels(g, now) {
    const level = this.level();
    // Frames.
    for (const x of [PANEL.leftX, PANEL.rightX]) {
      g.fillStyle = '#00000055';
      g.fillRect(x - 4, PANEL.y - 4, PANEL.width + 8, PANEL.height + 8);
      g.strokeStyle = COLOURS.panelFrame;
      g.lineWidth = 3;
      g.strokeRect(x, PANEL.y, PANEL.width, PANEL.height);
    }
    paintScene(g, level.scene, 'left', PANEL.leftX, PANEL.y);
    paintScene(g, level.scene, 'right', PANEL.rightX, PANEL.y);

    // Labels above each picture.
    g.fillStyle = COLOURS.cream;
    g.font = 'bold 17px sans-serif';
    g.textAlign = 'left';
    g.fillText('◀  LEFT', PANEL.leftX + 4, PANEL.y - 12);
    g.textAlign = 'right';
    g.fillText('RIGHT  ▶', PANEL.rightX + PANEL.width - 4, PANEL.y - 12);
    g.textAlign = 'left';

    // Green rings on every difference found, on both pictures.
    for (const spot of DIFFERENCES[level.id]) {
      if (!this.found.has(spot.key)) continue;
      for (const x of [PANEL.leftX, PANEL.rightX]) {
        this.drawFoundRing(g, x + spot.x, PANEL.y + spot.y, spot.radius);
      }
    }
    // The pulsing hint ring, on both pictures.
    if (this.hintPulse) {
      const pulse = 1 + 0.12 * Math.sin(now / 130);
      for (const x of [PANEL.leftX, PANEL.rightX]) {
        g.strokeStyle = COLOURS.gold;
        g.lineWidth = 4;
        g.beginPath();
        g.arc(x + this.hintPulse.x, PANEL.y + this.hintPulse.y, this.hintPulse.radius * pulse + 6, 0, Math.PI * 2);
        g.stroke();
      }
    }
    // Fresh wrong-click X marks, fading out.
    for (const mark of this.marks) {
      if (mark.kind !== 'wrong') continue;
      const age = now - mark.born;
      const alpha = Math.max(0, 1 - age / 1200);
      g.save();
      g.globalAlpha = alpha;
      g.strokeStyle = COLOURS.red;
      g.lineWidth = 5;
      const r = 12;
      g.beginPath();
      g.moveTo(mark.x - r, mark.y - r);
      g.lineTo(mark.x + r, mark.y + r);
      g.moveTo(mark.x + r, mark.y - r);
      g.lineTo(mark.x - r, mark.y + r);
      g.stroke();
      g.restore();
    }
  }

  drawFoundRing(g, x, y, radius) {
    g.strokeStyle = COLOURS.green;
    g.lineWidth = 5;
    g.beginPath();
    g.arc(x, y, radius + 4, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, y, radius + 8, 0, Math.PI * 2);
    g.stroke();
    // The check mark inside the ring.
    g.strokeStyle = COLOURS.green;
    g.lineWidth = 5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x - 10, y);
    g.lineTo(x - 3, y + 8);
    g.lineTo(x + 11, y - 8);
    g.stroke();
    g.lineCap = 'butt';
  }

  renderFooter(g, now) {
    const level = this.level();
    // Round dots and progress.
    g.fillStyle = COLOURS.soft;
    g.font = '16px sans-serif';
    g.textAlign = 'left';
    g.fillText(`ROUND ${this.levelIndex + 1} OF ${LEVELS.length} — ${level.name}`, 24, 540);
    g.fillText(level.blurb, 24, 566);
    for (let i = 0; i < LEVELS.length; i++) {
      g.fillStyle = i < this.levelIndex ? COLOURS.green : i === this.levelIndex ? COLOURS.gold : '#3a2f5e';
      g.beginPath();
      g.arc(24 + i * 26, 596, 8, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = COLOURS.soft;
    g.fillText(`${this.totalFound} found of ${this.totalDifferences} in all`, 120, 600);

    // Found-so-far pips for this round.
    const spots = DIFFERENCES[level.id];
    spots.forEach((spot, i) => {
      const x = 24 + i * 30;
      const y = 640;
      g.fillStyle = this.found.has(spot.key) ? COLOURS.green : '#3a2f5e';
      g.beginPath();
      g.arc(x, y, 10, 0, Math.PI * 2);
      g.fill();
      if (this.found.has(spot.key)) {
        g.strokeStyle = '#ffffff';
        g.lineWidth = 2.5;
        g.beginPath();
        g.moveTo(x - 5, y);
        g.lineTo(x - 1, y + 4);
        g.lineTo(x + 5, y - 4);
        g.stroke();
      }
    });

    // The hint button.
    const rect = { x: 1080, y: 528, w: 176, h: 52 };
    this.hintButtonRect = rect;
    g.fillStyle = this.hintsLeft > 0 ? '#3a2f5e' : '#241d38';
    g.beginPath();
    g.roundRect(rect.x, rect.y, rect.w, rect.h, 12);
    g.fill();
    g.strokeStyle = COLOURS.gold;
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(rect.x, rect.y, rect.w, rect.h, 12);
    g.stroke();
    g.fillStyle = this.hintsLeft > 0 ? COLOURS.gold : COLOURS.soft;
    g.font = 'bold 18px sans-serif';
    g.textAlign = 'center';
    g.fillText(`HINT  (${this.hintsLeft})`, rect.x + rect.w / 2, rect.y + 33);
    g.textAlign = 'left';

    // Keys reminder.
    g.fillStyle = COLOURS.soft;
    g.font = '15px sans-serif';
    g.fillText('Click a difference in either picture  ·  H hint  ·  M sound  ·  R retry round', 24, 692);
    void now;
  }

  renderMessage(g) {
    const text = this.message;
    g.font = 'bold 20px sans-serif';
    const width = g.measureText(text).width + 36;
    const x = (CANVAS_WIDTH - width) / 2;
    // The message bar sits in the gap between the pictures and the footer,
    // so it never covers the progress pips.
    g.fillStyle = 'rgba(20,16,33,0.92)';
    g.beginPath();
    g.roundRect(x, 498, width, 40, 10);
    g.fill();
    g.strokeStyle = COLOURS.gold;
    g.lineWidth = 2;
    g.beginPath();
    g.roundRect(x, 498, width, 40, 10);
    g.stroke();
    g.fillStyle = COLOURS.cream;
    g.textAlign = 'center';
    g.fillText(text, CANVAS_WIDTH / 2, 522);
    g.textAlign = 'left';
  }

  renderTitle(g) {
    // A quiet preview of the harbour behind the title.
    g.save();
    g.globalAlpha = 0.45;
    paintScene(g, 'harbour', 'left', PANEL.leftX, PANEL.y);
    paintScene(g, 'harbour', 'right', PANEL.rightX, PANEL.y);
    g.restore();
    g.fillStyle = 'rgba(20,16,33,0.72)';
    g.fillRect(0, PANEL.y, CANVAS_WIDTH, PANEL.height);
    g.fillStyle = COLOURS.cream;
    g.font = 'bold 54px sans-serif';
    g.textAlign = 'center';
    g.fillText(TITLE, CANVAS_WIDTH / 2, 220);
    g.fillStyle = COLOURS.gold;
    g.font = '22px sans-serif';
    g.fillText('Two pictures. Seven differences. One sharp eye.', CANVAS_WIDTH / 2, 268);
    g.fillStyle = COLOURS.cream;
    g.font = '18px sans-serif';
    g.fillText('Click a difference in either picture to circle it.', CANVAS_WIDTH / 2, 330);
    g.fillText('3 rounds · 21 differences · hints, combos and a ticking clock', CANVAS_WIDTH / 2, 360);
    g.fillText('Wrong clicks cost 25 points — look before you click!', CANVAS_WIDTH / 2, 390);
    g.fillStyle = COLOURS.gold;
    g.font = 'bold 26px sans-serif';
    const blink = Math.floor(performance.now() / 600) % 2 === 0;
    if (blink) g.fillText('— CLICK TO PLAY —', CANVAS_WIDTH / 2, 452);
    g.textAlign = 'left';
    g.fillStyle = COLOURS.soft;
    g.font = '15px sans-serif';
    g.textAlign = 'center';
    g.fillText('H hint  ·  M sound  ·  R retry round  ·  all art drawn in code, no images', CANVAS_WIDTH / 2, 660);
    g.textAlign = 'left';
  }

  renderRoundClear(g) {
    g.fillStyle = 'rgba(20,16,33,0.78)';
    g.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    g.fillStyle = COLOURS.green;
    g.font = 'bold 46px sans-serif';
    g.textAlign = 'center';
    g.fillText('ROUND CLEAR!', CANVAS_WIDTH / 2, 300);
    g.fillStyle = COLOURS.cream;
    g.font = '22px sans-serif';
    g.fillText(`All 7 differences found in ${this.level().name}.`, CANVAS_WIDTH / 2, 350);
    g.fillText(`Time bonus +${this.roundBonus || 0}   ·   Score ${this.score}`, CANVAS_WIDTH / 2, 386);
    g.fillStyle = COLOURS.gold;
    g.font = 'bold 24px sans-serif';
    g.fillText('CLICK FOR THE NEXT ROUND', CANVAS_WIDTH / 2, 440);
    g.textAlign = 'left';
  }

  renderWin(g, now) {
    // Confetti drift.
    const colours = ['#ffcf4d', '#3ddc84', '#ff5a5a', '#7ec8f7', '#ff7fb0'];
    for (let i = 0; i < 70; i++) {
      const x = (i * 173 + 40) % CANVAS_WIDTH;
      const y = ((now / 14 + i * 97) % (CANVAS_HEIGHT + 40)) - 20;
      g.fillStyle = colours[i % colours.length];
      g.fillRect(x, y, 8, 12);
    }
    g.fillStyle = 'rgba(20,16,33,0.82)';
    g.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    g.fillStyle = COLOURS.gold;
    g.font = 'bold 52px sans-serif';
    g.textAlign = 'center';
    g.fillText('YOU FOUND THEM ALL!', CANVAS_WIDTH / 2, 250);
    g.fillStyle = COLOURS.cream;
    g.font = '24px sans-serif';
    g.fillText(`All ${this.totalDifferences} differences across 3 rounds.`, CANVAS_WIDTH / 2, 310);
    g.fillText(`Final score  ${this.score}      Mistakes  ${this.mistakes}`, CANVAS_WIDTH / 2, 350);
    const rank = this.score >= 2600 ? 'Eagle Eye!' : this.score >= 2200 ? 'Sharp Shooter!' : this.score >= 1800 ? 'Keen Observer!' : 'Difference Detective!';
    g.fillStyle = COLOURS.green;
    g.font = 'bold 28px sans-serif';
    g.fillText(rank, CANVAS_WIDTH / 2, 410);
    g.fillStyle = COLOURS.gold;
    g.font = 'bold 22px sans-serif';
    const blink = Math.floor(now / 600) % 2 === 0;
    if (blink) g.fillText('CLICK TO PLAY AGAIN', CANVAS_WIDTH / 2, 470);
    g.textAlign = 'left';
  }

  renderTimeUp(g) {
    g.fillStyle = 'rgba(20,16,33,0.82)';
    g.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    g.fillStyle = COLOURS.red;
    g.font = 'bold 48px sans-serif';
    g.textAlign = 'center';
    g.fillText("TIME'S UP!", CANVAS_WIDTH / 2, 300);
    g.fillStyle = COLOURS.cream;
    g.font = '22px sans-serif';
    g.fillText(`You found ${this.found.size} of 7 differences in ${this.level().name}.`, CANVAS_WIDTH / 2, 350);
    g.fillStyle = COLOURS.gold;
    g.font = 'bold 22px sans-serif';
    g.fillText('Press R to retry the round — or click to start over', CANVAS_WIDTH / 2, 410);
    g.textAlign = 'left';
  }
}
