// Generate a unique Spanish bingo card (3 rows x 9 cols, 15 numbers)
export function generateCard(seed) {
  const ranges = [
    [1,9],[10,19],[20,29],[30,39],[40,49],
    [50,59],[60,69],[70,79],[80,90]
  ];

  let rng = seed >>> 0;
  const next = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
    return rng;
  };

  // Shuffle array with seeded rng
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = next() % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const card = Array.from({ length: 3 }, () => Array(9).fill(null));

  // Assign cell counts per column: total = 15, each col 1-3
  const colCounts = Array(9).fill(1);
  let extra = 6;
  let attempts = 0;
  while (extra > 0 && attempts < 1000) {
    const ci = next() % 9;
    if (colCounts[ci] < 3) { colCounts[ci]++; extra--; }
    attempts++;
  }

  // Fill card
  for (let c = 0; c < 9; c++) {
    const count = colCounts[c];
    const pool = shuffle(ranges[c].length === 2
      ? Array.from({ length: ranges[c][1] - ranges[c][0] + 1 }, (_, i) => i + ranges[c][0])
      : ranges[c]);
    const nums = pool.slice(0, count).sort((a, b) => a - b);
    const rows = shuffle([0, 1, 2]).slice(0, count).sort((a, b) => a - b);
    rows.forEach((r, i) => { card[r][c] = nums[i]; });
  }

  return card;
}

// Check if any row is complete
export function checkLine(card, markedSet) {
  for (let r = 0; r < 3; r++) {
    const nums = card[r].filter(n => n !== null);
    if (nums.length > 0 && nums.every(n => markedSet.has(n))) return r;
  }
  return -1;
}

// Check full bingo
export function checkBingo(card, markedSet) {
  const all = card.flat().filter(n => n !== null);
  return all.length > 0 && all.every(n => markedSet.has(n));
}

// Generate a 4-char room code
export function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Spanish bingo narrations
const SPECIALS = {
  1: "¡El uno, la unidad!", 2: "¡El dos, el patito!",
  3: "¡El tres, San Jenaro!", 7: "¡El siete, el campeón!",
  9: "¡El nueve, el gran chico!", 10: "¡La decena completa!",
  11: "¡Las dos palitos!", 13: "¡El trece, mala suerte!",
  15: "¡El quince, el once y el cuarto!", 20: "¡La veintena!",
  22: "¡Los dos patitos, cuac cuac!", 25: "¡El veinticinco!",
  30: "¡Treinta, los tres ceros!", 33: "¡El treinta y tres!",
  40: "¡El cuarenta, el ama de casa!", 44: "¡Las dos sillitas!",
  50: "¡El cincuenta, las cinco decenas!", 55: "¡Las dos quinces!",
  60: "¡El sesenta!", 66: "¡Las dos seises!",
  69: "¡El sesenta y nueve!", 70: "¡El setenta!",
  77: "¡Las dos mecedoras!", 80: "¡El ochenta!",
  88: "¡Los dos gordos!", 90: "¡El noventa, el rey del tablero! ¡Última bola!"
};

export function getNarration(num) {
  return SPECIALS[num] || `¡El ${num}!`;
}
