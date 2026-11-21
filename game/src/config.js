// Spot the Difference — shared constants: canvas layout, levels and scoring.
// One job only: numbers and level metadata. The pictures live in scenes.js,
// the difference spots in differences.js, the rules in game.js.

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;

// Each picture panel, in canvas pixels. The two panels share one size so a
// difference sits at the same spot in both pictures.
export const PANEL = {
  width: 600,
  height: 390,
  leftX: 20,
  rightX: 660,
  y: 100,
};

export const HEADER_HEIGHT = 84;
export const FOOTER_Y = 512;

// Three rounds, each a different hand-drawn scene, each with 7 differences.
// The clock gets shorter and the spots get smaller as the rounds go on.
export const LEVELS = [
  {
    id: 'harbour',
    name: 'Lantern Harbour',
    scene: 'harbour',
    timeLimitSeconds: 150,
    blurb: 'Dusk on the harbour. Seven things changed between the two pictures.',
  },
  {
    id: 'market',
    name: 'Night Market',
    scene: 'market',
    timeLimitSeconds: 120,
    blurb: 'Lanterns, stalls and steam. Seven things changed — look closer.',
  },
  {
    id: 'garden',
    name: 'Sunny Garden',
    scene: 'garden',
    timeLimitSeconds: 100,
    blurb: 'A bright garden, a busy bee. Seven small changes to find.',
  },
];

export const DIFFERENCES_PER_LEVEL = 7;

export const SCORING = {
  findPoints: 100,
  comboStepPoints: 25,
  wrongClickPoints: -25,
  hintCostPoints: -50,
  hintsPerLevel: 3,
  timeBonusPerSecond: 5,
  wrongClickTimePenaltySeconds: 0,
};

export const COLOURS = {
  page: '#141021',
  header: '#1e1830',
  headerLine: '#3a2f5e',
  cream: '#fff6e0',
  gold: '#ffcf4d',
  green: '#3ddc84',
  greenDark: '#1d9e57',
  red: '#ff5a5a',
  soft: '#b9aed6',
  panelFrame: '#ffcf4d',
};
