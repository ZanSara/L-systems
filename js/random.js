/**
 * Random L-system generator ("Random Values" button).
 *
 * Improvements over the Vue version, which sampled a very narrow slice of
 * the space (angles were always 45/60/90, rules never branched, and the
 * generated color actions were never referenced by the rules):
 *  - angles can be any value: half the time a "nice" symmetric angle
 *    (360/n and friends), half the time a continuous random angle;
 *  - rules can contain bracketed branches `[...]` and `f` moves;
 *  - the axiom varies (single symbol, n-fold rings, branched rings);
 *  - color action symbols are actually inserted into the rules;
 *  - depth is derived from the rule growth rate, so deep systems stay
 *    under the expansion limit instead of using a fixed 4-7 range.
 */
'use strict';

var LRandom = (function () {

  const COLOR_PALETTES = [
    // Nature greens
    ['green', 'lime', 'lightgreen', 'darkgreen'],
    // Autumn
    ['goldenrod', 'gold', 'orange', 'brown'],
    // Purples
    ['mediumpurple', 'violet', 'purple', 'orchid'],
    // Blues
    ['dodgerblue', 'skyblue', 'steelblue', 'navy'],
    // Warm
    ['coral', 'salmon', 'tomato', 'crimson'],
    // Cool
    ['cyan', 'turquoise', 'teal', 'aquamarine'],
    // Mixed vibrant
    ['red', 'blue', 'green', 'yellow'],
    // Pastels
    ['lightcoral', 'lightblue', 'lightgreen', 'lightyellow'],
    // Earth tones
    ['sienna', 'peru', 'chocolate', 'saddlebrown'],
    // Pink/Red
    ['hotpink', 'deeppink', 'pink', 'lightpink'],
  ];

  const NICE_ANGLES = [120, 90, 72, 60, 51.4, 45, 40, 36, 30, 25.7, 22.5, 18, 15, 12];

  function generate() {
    const colors = pickColors();
    const colorChars = colors.map((_, i) => String.fromCharCode(99 + i)); // c, d, e, f

    let X = makeRule(colorChars);
    let Y = Math.random() < 0.5 ? mirrorRule(X) : makeRule(colorChars);
    [X, Y] = ensureColorCharsUsed(X, Y, colorChars);

    const axiom = makeAxiom();
    const angle = pickAngle();
    const depth = pickDepth(axiom, X, Y);

    let code = `axiom: ${axiom}
rules:
  X => ${X.join('')}
  Y => ${Y.join('')}

depth: ${depth}
angle: ${angle}`;

    if (colors.length > 0) {
      code += '\nactions:';
      colors.forEach((color, index) => {
        code += `\n  ${colorChars[index]} => setColor('${color}')`;
      });
    }
    return code;
  }

  /** Half "nice" symmetric angles, half anywhere on the continuum. */
  function pickAngle() {
    if (Math.random() < 0.5) {
      return NICE_ANGLES[randomInt(NICE_ANGLES.length)];
    }
    return Math.round((5 + Math.random() * 170) * 10) / 10;
  }

  function pickColors() {
    if (Math.random() < 0.35) return [];
    const palette = COLOR_PALETTES[randomInt(COLOR_PALETTES.length)];
    return palette.slice(0, randomInt(3) + 2); // 2-4 colors
  }

  /**
   * Builds one rewrite rule as an array of tokens over the alphabet
   * F X Y f + - [ ] plus the color action characters.
   */
  function makeRule(colorChars) {
    const length = 6 + randomInt(9); // 6-14 tokens
    const tokens = [];
    let bracketDepth = 0;
    let lastCh = '';

    while (tokens.length < length) {
      let ch = pickToken(colorChars, bracketDepth, length - tokens.length);

      // Guards against degenerate sequences:
      if (ch === '+' && lastCh === '-') ch = '-';
      else if (ch === '-' && lastCh === '+') ch = '+';
      else if (ch === 'F' && lastCh === 'F' && Math.random() < 0.6) {
        ch = Math.random() < 0.5 ? 'X' : 'Y';
      }
      if (ch === ']' && (bracketDepth === 0 || lastCh === '[')) continue;

      if (ch === '[') bracketDepth++;
      if (ch === ']') bracketDepth--;
      tokens.push(ch);
      lastCh = ch;
    }
    // Close any branch that is still open (never leave it empty).
    while (bracketDepth > 0) {
      if (tokens[tokens.length - 1] === '[') tokens.push('F');
      tokens.push(']');
      bracketDepth--;
    }

    // Make sure the rule actually draws and keeps rewriting:
    for (const required of 'FXY') {
      if (tokens.indexOf(required) < 0) {
        replaceRandomPlainToken(tokens, required);
      }
    }
    return tokens;
  }

  function pickToken(colorChars, bracketDepth, remaining) {
    const r = Math.random();
    if (r < 0.30) return 'F';
    if (r < 0.44) return 'X';
    if (r < 0.58) return 'Y';
    if (r < 0.70) return '+';
    if (r < 0.82) return '-';
    if (r < 0.86) return 'f';
    if (r < 0.94 && bracketDepth < 2 && remaining > 2) return '[';
    if (r < 0.97 && bracketDepth > 0) return ']';
    if (colorChars.length > 0) return colorChars[randomInt(colorChars.length)];
    return Math.random() < 0.5 ? '+' : '-';
  }

  /** Swaps a random non-bracket token for `required`. */
  function replaceRandomPlainToken(tokens, required) {
    for (let attempts = 0; attempts < 50; attempts++) {
      const i = randomInt(tokens.length);
      if (tokens[i] !== '[' && tokens[i] !== ']') {
        tokens[i] = required;
        return;
      }
    }
    tokens.push(required);
  }

  /**
   * The mirror image of a rule: reversed, with +/- and X/Y swapped.
   * Brackets must swap too to stay balanced after the reversal.
   */
  function mirrorRule(tokens) {
    return tokens.slice().reverse().map(ch => {
      if (ch === '+') return '-';
      if (ch === '-') return '+';
      if (ch === 'X') return 'Y';
      if (ch === 'Y') return 'X';
      if (ch === '[') return ']';
      if (ch === ']') return '[';
      return ch;
    });
  }

  /** Guarantees every declared color symbol shows up in some rule. */
  function ensureColorCharsUsed(X, Y, colorChars) {
    colorChars.forEach(ch => {
      if (X.indexOf(ch) < 0 && Y.indexOf(ch) < 0) {
        const target = Math.random() < 0.5 ? X : Y;
        target.splice(randomInt(target.length + 1), 0, ch);
      }
    });
    return [X, Y];
  }

  function makeAxiom() {
    const r = Math.random();
    if (r < 0.4) return 'X';
    if (r < 0.55) return 'FX';
    const n = 3 + randomInt(6); // 3-8 fold symmetry
    if (r < 0.85) {
      return new Array(n).fill('X').join('+');
    }
    return new Array(n).fill('[X]').join('+');
  }

  /**
   * Chooses the deepest recursion that keeps the expanded string well
   * below the renderer's 1,000,000 character limit, estimated from the
   * average growth factor of the rules.
   */
  function pickDepth(axiom, X, Y) {
    const growth = Math.max(2, (countRewritten(X) + countRewritten(Y)) / 2);
    const budget = 150000 / Math.max(1, axiom.length);
    let depth = Math.floor(Math.log(budget) / Math.log(growth));
    depth = Math.max(3, Math.min(depth, 12));
    // A little variety below the maximum:
    if (depth > 3 && Math.random() < 0.5) depth -= 1;
    return depth;
  }

  function countRewritten(tokens) {
    return tokens.filter(ch => ch === 'X' || ch === 'Y' || ch === 'F').length;
  }

  function randomInt(n) {
    return Math.floor(Math.random() * n);
  }

  return { generate };
})();
