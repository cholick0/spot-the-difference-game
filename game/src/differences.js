// Spot the Difference — where every difference hides.
// One job only: the spot list for each level. Each entry is a circle in
// panel coordinates (600 x 390, shared by both pictures): x, y and radius.
// scenes.js reads the same `key` to draw the two versions of that spot, so
// the list here and the painting there always agree.

export const DIFFERENCES = {
  harbour: [
    { key: 'sunRays',    x: 470, y: 70,  radius: 42, name: 'the sun lost its rays' },
    { key: 'extraGull',  x: 300, y: 56,  radius: 20, name: 'an extra gull' },
    { key: 'lampColour', x: 90,  y: 96,  radius: 24, name: 'the lighthouse lamp colour' },
    { key: 'sailColour', x: 330, y: 300, radius: 32, name: 'the boat sail colour' },
    { key: 'windowLit',  x: 212, y: 214, radius: 18, name: 'a lit cottage window' },
    { key: 'buoy',       x: 500, y: 330, radius: 20, name: 'the missing buoy' },
    { key: 'fish',       x: 160, y: 318, radius: 22, name: 'the jumping fish' },
  ],
  market: [
    { key: 'moon',       x: 520, y: 62,  radius: 32, name: 'the moon' },
    { key: 'awning',     x: 300, y: 118, radius: 28, name: 'the middle awning stripes' },
    { key: 'lantern',    x: 150, y: 182, radius: 22, name: 'a missing paper lantern' },
    { key: 'fruit',      x: 430, y: 252, radius: 26, name: 'the fruit changed colour' },
    { key: 'cat',        x: 92,  y: 302, radius: 26, name: 'the stall cat' },
    { key: 'balloon',    x: 478, y: 150, radius: 24, name: 'an extra balloon' },
    { key: 'signStar',   x: 300, y: 202, radius: 20, name: 'the star on the sign' },
  ],
  garden: [
    { key: 'sunFace',    x: 92,  y: 72,  radius: 36, name: 'the sun stopped smiling' },
    { key: 'butterfly',  x: 420, y: 258, radius: 22, name: 'the butterfly' },
    { key: 'bee',        x: 252, y: 118, radius: 18, name: 'an extra bee' },
    { key: 'tulip',      x: 182, y: 300, radius: 20, name: 'the tulip changed colour' },
    { key: 'duck',       x: 480, y: 322, radius: 26, name: 'the pond duck' },
    { key: 'apples',     x: 300, y: 112, radius: 28, name: 'apples missing from the tree' },
    { key: 'fencePost',  x: 96,  y: 342, radius: 20, name: 'a missing fence post' },
  ],
};

// Look a difference up by its key inside one level's list.
export function differenceByKey(levelId, key) {
  return DIFFERENCES[levelId].find((d) => d.key === key);
}

// How many differences a level holds.
export function differenceCount(levelId) {
  return DIFFERENCES[levelId].length;
}
