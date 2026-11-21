// Spot the Difference — the pictures themselves, drawn procedurally.
// One job only: paint a scene into a panel. paintScene(g, sceneId, side,
// ox, oy) draws the 600 x 390 picture at offset (ox, oy); side is 'left'
// or 'right', and the right picture is where the seven differences live,
// keyed to the same keys as differences.js. Everything here is shapes,
// gradients and text — no images, no fonts from the network.

function skyGradient(g, oy, top, bottom, height) {
  const grad = g.createLinearGradient(0, oy, 0, oy + height);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  return grad;
}

function ellipse(g, x, y, rx, ry) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  g.fill();
}

function circle(g, x, y, r) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
}

function cloud(g, x, y, scale, colour) {
  g.fillStyle = colour;
  ellipse(g, x, y, 34 * scale, 13 * scale);
  ellipse(g, x - 22 * scale, y + 5 * scale, 22 * scale, 10 * scale);
  ellipse(g, x + 24 * scale, y + 5 * scale, 24 * scale, 11 * scale);
}

function gull(g, x, y, scale, colour) {
  g.strokeStyle = colour;
  g.lineWidth = 2.5 * scale;
  g.beginPath();
  g.moveTo(x - 12 * scale, y);
  g.quadraticCurveTo(x - 5 * scale, y - 8 * scale, x, y);
  g.quadraticCurveTo(x + 5 * scale, y - 8 * scale, x + 12 * scale, y);
  g.stroke();
}

function star(g, x, y, r, colour) {
  g.fillStyle = colour;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fill();
}

// ---------------------------------------------------------------- harbour

function paintHarbour(g, side, ox, oy) {
  const W = 600;
  const H = 390;
  const HORIZON = 238;

  // Dusk sky.
  g.fillStyle = skyGradient(g, oy, '#ff9e5e', '#7b4d8f', HORIZON);
  g.fillRect(ox, oy, W, HORIZON);

  // The sun, low over the water.
  const sunX = ox + 470;
  const sunY = oy + 70;
  if (side === 'left') {
    g.strokeStyle = '#ffd76a';
    g.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI / 4) * i;
      g.beginPath();
      g.moveTo(sunX + Math.cos(a) * 40, sunY + Math.sin(a) * 40);
      g.lineTo(sunX + Math.cos(a) * 54, sunY + Math.sin(a) * 54);
      g.stroke();
    }
  }
  g.fillStyle = '#ffd76a';
  circle(g, sunX, sunY, 32);
  g.fillStyle = '#fff3c4';
  circle(g, sunX, sunY, 22);

  // Clouds and gulls.
  cloud(g, ox + 120, oy + 52, 1.1, 'rgba(255,214,180,0.9)');
  cloud(g, ox + 330, oy + 110, 0.8, 'rgba(255,200,170,0.75)');
  gull(g, ox + 210, oy + 48, 1, '#3a2b4d');
  gull(g, ox + 380, oy + 88, 0.8, '#3a2b4d');
  if (side === 'right') gull(g, ox + 300, oy + 56, 0.9, '#3a2b4d');

  // The sea.
  g.fillStyle = skyGradient(g, oy + HORIZON, '#3d6f9e', '#1d3a5c', H - HORIZON);
  g.fillRect(ox, oy + HORIZON, W, H - HORIZON);
  g.strokeStyle = 'rgba(255,255,255,0.35)';
  g.lineWidth = 2;
  for (const [wx, wy, wl] of [[60, 268, 70], [300, 292, 90], [470, 272, 60], [180, 330, 80], [380, 352, 90]]) {
    g.beginPath();
    g.moveTo(ox + wx, oy + wy);
    g.lineTo(ox + wx + wl, oy + wy);
    g.stroke();
  }
  // Sun glitter on the water: short dashes that widen toward the sun.
  g.fillStyle = 'rgba(255,215,106,0.5)';
  for (let i = 0; i < 5; i++) {
    const w = 56 - i * 10;
    g.fillRect(ox + 470 - w / 2, oy + 252 + i * 18, w, 4);
  }

  // Cottages along the quay.
  const cottages = [
    { x: 150, w: 84, colour: '#f2c14e', lit: true },
    { x: 244, w: 72, colour: '#e07856', lit: false },
    { x: 326, w: 90, colour: '#7fb069', lit: true },
  ];
  for (const c of cottages) {
    g.fillStyle = c.colour;
    g.fillRect(ox + c.x, oy + 196, c.w, 42);
    g.fillStyle = '#5b3a52';
    g.beginPath();
    g.moveTo(ox + c.x - 4, oy + 196);
    g.lineTo(ox + c.x + c.w / 2, oy + 172);
    g.lineTo(ox + c.x + c.w + 4, oy + 196);
    g.closePath();
    g.fill();
    // Windows: the middle cottage's window is the difference.
    const lit = c.x === 244 ? side === 'left' : c.lit;
    g.fillStyle = lit ? '#ffe98a' : '#3a2b4d';
    g.fillRect(ox + c.x + 14, oy + 210, 16, 16);
    g.fillStyle = '#ffe98a';
    g.fillRect(ox + c.x + c.w - 30, oy + 210, 16, 16);
  }

  // The lighthouse.
  g.fillStyle = '#f4ede0';
  g.fillRect(ox + 68, oy + 108, 44, 130);
  g.fillStyle = '#d94f4f';
  g.fillRect(ox + 68, oy + 132, 44, 16);
  g.fillRect(ox + 68, oy + 176, 44, 16);
  g.fillStyle = '#3a2b4d';
  g.fillRect(ox + 62, oy + 92, 56, 18);
  // Lamp: yellow on the left, red on the right.
  g.fillStyle = side === 'left' ? '#ffe98a' : '#ff5a5a';
  circle(g, ox + 90, oy + 82, 12);
  g.fillStyle = side === 'left' ? 'rgba(255,233,138,0.35)' : 'rgba(255,90,90,0.35)';
  g.beginPath();
  g.moveTo(ox + 90, oy + 82);
  g.lineTo(ox + 210, oy + 52);
  g.lineTo(ox + 210, oy + 112);
  g.closePath();
  g.fill();

  // The little sailing boat.
  const boatX = ox + 330;
  const boatY = oy + 300;
  g.strokeStyle = '#5b3a52';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(boatX, boatY - 58);
  g.lineTo(boatX, boatY);
  g.stroke();
  // Sail: white on the left, red on the right.
  g.fillStyle = side === 'left' ? '#fff6e0' : '#d94f4f';
  g.beginPath();
  g.moveTo(boatX + 2, boatY - 56);
  g.lineTo(boatX + 2, boatY - 6);
  g.lineTo(boatX + 34, boatY - 6);
  g.closePath();
  g.fill();
  g.fillStyle = '#8a5a2b';
  g.beginPath();
  g.moveTo(boatX - 34, boatY);
  g.lineTo(boatX + 40, boatY);
  g.lineTo(boatX + 30, boatY + 16);
  g.lineTo(boatX - 24, boatY + 16);
  g.closePath();
  g.fill();

  // The buoy, and the jumping fish — both only on the left.
  if (side === 'left') {
    g.fillStyle = '#ff7f3f';
    g.beginPath();
    g.moveTo(ox + 500, oy + 316);
    g.lineTo(ox + 514, oy + 316);
    g.lineTo(ox + 510, oy + 336);
    g.lineTo(ox + 504, oy + 336);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffd76a';
    g.fillRect(ox + 501, oy + 322, 12, 5);
    g.fillStyle = '#7fd4ff';
    g.beginPath();
    g.ellipse(ox + 160, oy + 312, 14, 7, -0.5, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(ox + 172, oy + 308);
    g.lineTo(ox + 182, oy + 302);
    g.lineTo(ox + 182, oy + 314);
    g.closePath();
    g.fill();
  }

  // The quay and its lantern posts.
  g.fillStyle = '#6b4a2f';
  g.fillRect(ox, oy + 356, W, 34);
  g.fillStyle = '#8a5a2b';
  for (const px of [40, 180, 320, 460]) {
    g.fillRect(ox + px, oy + 348, 6, 14);
  }
  for (const px of [120, 260, 400, 540]) {
    g.fillStyle = '#3a2b4d';
    g.fillRect(ox + px, oy + 340, 4, 22);
    g.fillStyle = '#ffd76a';
    circle(g, ox + px + 2, oy + 336, 6);
  }
}

// ---------------------------------------------------------------- market

function awning(g, x, y, w, stripeA, stripeB) {
  for (let i = 0; i < 6; i++) {
    g.fillStyle = i % 2 === 0 ? stripeA : stripeB;
    g.fillRect(x + (i * w) / 6, y, w / 6 + 1, 26);
  }
  g.fillStyle = 'rgba(0,0,0,0.15)';
  g.fillRect(x, y + 22, w, 4);
}

function paintMarket(g, side, ox, oy) {
  const W = 600;
  const H = 390;

  // Night sky, stars and the moon.
  g.fillStyle = skyGradient(g, oy, '#1b1440', '#3a2f6e', 240);
  g.fillRect(ox, oy, W, 240);
  g.fillStyle = '#fff6e0';
  for (const [sx, sy, sr] of [[60, 40, 2], [140, 80, 1.5], [240, 30, 2], [350, 55, 1.5], [450, 30, 2], [560, 90, 1.5], [40, 130, 1.5], [200, 120, 2]]) {
    circle(g, ox + sx, oy + sy, sr);
  }
  // Moon: full on the left, a crescent on the right.
  g.fillStyle = '#fff3c4';
  circle(g, ox + 520, oy + 62, 26);
  if (side === 'right') {
    g.fillStyle = '#3a2f6e';
    circle(g, ox + 530, oy + 56, 22);
  }
  g.fillStyle = 'rgba(255,243,196,0.25)';
  circle(g, ox + 520, oy + 62, 34);

  // The street.
  g.fillStyle = '#4a3a5e';
  g.fillRect(ox, oy + 240, W, 150);
  g.fillStyle = '#5d4a75';
  g.fillRect(ox, oy + 300, W, 6);

  // Three stalls.
  const stalls = [
    { x: 30, w: 160, a: '#d94f4f', b: '#fff6e0', sign: 'FRUIT' },
    { x: 220, w: 160, a: '#3d9e57', b: '#fff6e0', sign: 'TEA' },
    { x: 410, w: 160, a: '#3f6fd9', b: '#fff6e0', sign: 'TOYS' },
  ];
  for (const s of stalls) {
    // Middle awning changes colour on the right.
    const a = s.x === 220 && side === 'right' ? '#3f6fd9' : s.a;
    awning(g, ox + s.x, oy + 96, s.w, a, s.b);
    g.fillStyle = '#6b4a2f';
    g.fillRect(ox + s.x + 6, oy + 122, 10, 130);
    g.fillRect(ox + s.x + s.w - 16, oy + 122, 10, 130);
    g.fillStyle = '#8a5a2b';
    g.fillRect(ox + s.x, oy + 218, s.w, 34);
    // Sign board, with a star only on the left for the middle stall.
    g.fillStyle = '#2c2140';
    g.fillRect(ox + s.x + 40, oy + 150, 80, 30);
    g.fillStyle = '#ffcf4d';
    g.font = 'bold 16px sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(s.sign, ox + s.x + 80, oy + 166);
    if (s.x === 220 && side === 'left') star(g, ox + s.x + 80, oy + 140, 8, '#ffcf4d');
  }

  // Fruit piles on the first stall.
  g.fillStyle = '#d94f4f';
  for (const [fx, fy] of [[60, 208], [80, 204], [100, 208], [70, 196], [90, 192]]) {
    circle(g, ox + fx, oy + fy, 8);
  }
  // The third stall's fruit: red apples left, oranges right.
  g.fillStyle = side === 'left' ? '#d94f4f' : '#ff8c2b';
  for (const [fx, fy] of [[440, 208], [460, 204], [480, 208], [450, 196], [470, 192]]) {
    circle(g, ox + fx, oy + fy, 8);
  }

  // Paper lanterns strung above the first stall.
  g.strokeStyle = '#2c2140';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(ox + 40, oy + 96);
  g.lineTo(ox + 180, oy + 96);
  g.stroke();
  const lanternXs = side === 'left' ? [70, 110, 150] : [70, 150];
  for (const lx of lanternXs) {
    g.fillStyle = '#ff5a5a';
    ellipse(g, ox + lx, oy + 108, 13, 16);
    g.fillStyle = '#ffcf4d';
    g.fillRect(ox + lx - 4, oy + 100, 8, 4);
    g.fillRect(ox + lx - 4, oy + 120, 8, 4);
  }

  // Balloons over the third stall — an extra one on the right.
  const balloons = side === 'left'
    ? [[520, 130, '#ff5a5a'], [552, 112, '#3ddc84']]
    : [[520, 130, '#ff5a5a'], [552, 112, '#3ddc84'], [478, 150, '#ffcf4d']];
  for (const [bx, by, bc] of balloons) {
    g.fillStyle = bc;
    ellipse(g, ox + bx, oy + by, 12, 15);
    g.strokeStyle = '#fff6e0';
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(ox + bx, oy + by + 15);
    g.lineTo(ox + bx + 4, oy + by + 34);
    g.stroke();
  }

  // The stall cat, asleep on a crate — only on the left.
  if (side === 'left') {
    g.fillStyle = '#8a5a2b';
    g.fillRect(ox + 66, oy + 316, 52, 30);
    g.fillStyle = '#a86f3a';
    g.fillRect(ox + 66, oy + 316, 52, 6);
    g.fillStyle = '#e8a34c';
    ellipse(g, ox + 92, oy + 310, 20, 10);
    circle(g, ox + 108, oy + 302, 9);
    g.beginPath();
    g.moveTo(ox + 102, oy + 296);
    g.lineTo(ox + 104, oy + 288);
    g.lineTo(ox + 108, oy + 295);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(ox + 110, oy + 295);
    g.lineTo(ox + 114, oy + 288);
    g.lineTo(ox + 115, oy + 296);
    g.closePath();
    g.fill();
  }

  // Steam curls from the tea stall.
  g.strokeStyle = 'rgba(255,255,255,0.6)';
  g.lineWidth = 3;
  for (const sx of [260, 290, 320]) {
    g.beginPath();
    g.moveTo(ox + sx, oy + 210);
    g.quadraticCurveTo(ox + sx + 8, oy + 190, ox + sx, oy + 172);
    g.stroke();
  }
}

// ---------------------------------------------------------------- garden

function flower(g, x, y, petal, centre) {
  g.fillStyle = petal;
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    circle(g, x + Math.cos(a) * 9, y + Math.sin(a) * 9, 7);
  }
  g.fillStyle = centre;
  circle(g, x, y, 6);
}

function paintGarden(g, side, ox, oy) {
  const W = 600;
  const H = 390;

  // Bright sky and the sun.
  g.fillStyle = skyGradient(g, oy, '#7ec8f7', '#cfeeff', 230);
  g.fillRect(ox, oy, W, 230);
  g.fillStyle = '#ffd76a';
  circle(g, ox + 92, oy + 72, 30);
  // The sun smiles on the left, and is plain on the right.
  if (side === 'left') {
    g.fillStyle = '#5b3a52';
    circle(g, ox + 82, oy + 66, 3);
    circle(g, ox + 102, oy + 66, 3);
    g.strokeStyle = '#5b3a52';
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(ox + 92, oy + 76, 10, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
  }
  cloud(g, ox + 250, oy + 60, 1, '#ffffff');
  cloud(g, ox + 470, oy + 110, 0.8, '#ffffff');

  // Rolling hills and the lawn. The base fill first, so no gap of bare
  // canvas shows between the hill's curved edge and the lawn below it.
  g.fillStyle = '#8ed081';
  g.fillRect(ox, oy + 228, W, H - 228);
  g.beginPath();
  g.moveTo(ox, oy + 230);
  g.quadraticCurveTo(ox + 200, oy + 190, ox + 400, oy + 228);
  g.quadraticCurveTo(ox + 520, oy + 250, ox + W, oy + 222);
  g.lineTo(ox + W, oy + H);
  g.lineTo(ox, oy + H);
  g.closePath();
  g.fill();
  g.fillStyle = '#6fbf5e';
  g.fillRect(ox, oy + 300, W, 90);

  // The apple tree.
  g.fillStyle = '#6b4a2f';
  g.fillRect(ox + 288, oy + 150, 24, 90);
  g.fillStyle = '#3d9e57';
  circle(g, ox + 300, oy + 120, 62);
  circle(g, ox + 252, oy + 140, 40);
  circle(g, ox + 348, oy + 140, 40);
  // Five apples on the left, three on the right.
  const apples = side === 'left'
    ? [[268, 108], [300, 96], [332, 112], [282, 132], [320, 138]]
    : [[268, 108], [332, 112], [320, 138]];
  g.fillStyle = '#d94f4f';
  for (const [ax, ay] of apples) circle(g, ox + ax, oy + ay, 7);

  // The pond and its duck — the duck only on the left.
  g.fillStyle = '#5fb8e8';
  ellipse(g, ox + 480, oy + 322, 78, 30);
  g.fillStyle = 'rgba(255,255,255,0.5)';
  ellipse(g, ox + 460, oy + 316, 22, 4);
  ellipse(g, ox + 500, oy + 330, 26, 4);
  if (side === 'left') {
    g.fillStyle = '#fff6e0';
    ellipse(g, ox + 480, oy + 318, 14, 10);
    circle(g, ox + 492, oy + 308, 8);
    g.fillStyle = '#ff8c2b';
    g.beginPath();
    g.moveTo(ox + 498, oy + 308);
    g.lineTo(ox + 508, oy + 311);
    g.lineTo(ox + 498, oy + 314);
    g.closePath();
    g.fill();
  }

  // Flower bed: the tulip changes colour on the right.
  g.strokeStyle = '#3d9e57';
  g.lineWidth = 3;
  for (const fx of [120, 182, 244, 420, 470]) {
    g.beginPath();
    g.moveTo(ox + fx, oy + 330);
    g.lineTo(ox + fx, oy + 296);
    g.stroke();
  }
  flower(g, ox + 120, oy + 292, '#ff7fb0', '#ffcf4d');
  flower(g, ox + 182, oy + 292, side === 'left' ? '#d94f4f' : '#ffcf4d', '#5b3a52');
  flower(g, ox + 244, oy + 292, '#8a6fd9', '#ffcf4d');
  flower(g, ox + 470, oy + 292, '#ff7fb0', '#ffcf4d');
  // The butterfly rests on the last flower — only on the left.
  if (side === 'left') {
    g.fillStyle = '#8a6fd9';
    ellipse(g, ox + 412, oy + 254, 10, 14);
    ellipse(g, ox + 430, oy + 254, 10, 14);
    g.fillStyle = '#5b3a52';
    g.fillRect(ox + 419, oy + 246, 3, 16);
  }

  // A bee — an extra one on the right.
  const bees = side === 'left' ? [[330, 180]] : [[330, 180], [252, 118]];
  for (const [bx, by] of bees) {
    g.fillStyle = '#ffcf4d';
    ellipse(g, ox + bx, oy + by, 10, 7);
    g.strokeStyle = '#5b3a52';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(ox + bx - 3, oy + by - 6);
    g.lineTo(ox + bx - 3, oy + by + 6);
    g.stroke();
    g.beginPath();
    g.moveTo(ox + bx + 3, oy + by - 6);
    g.lineTo(ox + bx + 3, oy + by + 6);
    g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.8)';
    ellipse(g, ox + bx - 2, oy + by - 10, 7, 4);
  }

  // The fence along the bottom — a post missing on the right.
  g.fillStyle = '#a86f3a';
  g.fillRect(ox, oy + 352, W, 8);
  const posts = side === 'left' ? [40, 96, 152, 208, 264, 320] : [40, 152, 208, 264, 320];
  for (const px of posts) {
    g.fillRect(ox + px, oy + 336, 12, 34);
    g.beginPath();
    g.moveTo(ox + px, oy + 336);
    g.lineTo(ox + px + 6, oy + 328);
    g.lineTo(ox + px + 12, oy + 336);
    g.closePath();
    g.fill();
  }
}

// ---------------------------------------------------------------- entry

const PAINTERS = { harbour: paintHarbour, market: paintMarket, garden: paintGarden };

// Paint one picture of a scene. `scene` is a level's scene id, `side` is
// 'left' or 'right', and (ox, oy) is the panel's top-left corner.
export function paintScene(g, scene, side, ox, oy) {
  const paint = PAINTERS[scene];
  if (!paint) throw new Error(`unknown scene: ${scene}`);
  g.save();
  g.beginPath();
  g.rect(ox, oy, 600, 390);
  g.clip();
  paint(g, side, ox, oy);
  g.restore();
}
