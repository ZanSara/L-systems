/**
 * The examples album. The actual L-system definitions live in the
 * user-editable `examples.js` at the project root (the `EXAMPLES_TEXT`
 * string); this module splits that text into individual examples and
 * annotates duplicates.
 *
 * Duplicate detection has two tiers:
 *  - "exact": the parsed system is identical to an earlier example;
 *  - "variant": same axiom and rules once color-action symbols are
 *    stripped - the same fractal with different colors/depth/angle.
 * The first occurrence stays unmarked; later ones carry the annotation.
 */
'use strict';

const DEFAULT_CODE = `axiom: X
rules:
  X => -YF+XFX+FY-
  Y => +XF-YFY-FX+

depth: 5
stepsPerFrame: 10
width: 2

actions:
  - => rotate(-90)
  + => rotate(90)
  F => draw()
`;

const EXAMPLES = EXAMPLES_TEXT
  .split('\n')
  .reduce((chunks, line) => {
    if (line.trim() === '---') chunks.push([]);
    else chunks[chunks.length - 1].push(line);
    return chunks;
  }, [[]])
  .map(lines => lines.join('\n').trim())
  .filter(code => code !== '');

function getExamples() {
  const examples = EXAMPLES.map((code, index) => {
    // Extract name from comment at the beginning
    let match = code.match(/\/\/\s*(.+)/);
    let name = match ? match[1].trim() : `Example ${index + 1}`;
    return { name, code, index };
  });
  annotateDuplicates(examples);
  return examples;
}

function annotateDuplicates(examples) {
  const seenExact = new Map();    // canonical system -> first example
  const seenSkeleton = new Map(); // color-stripped axiom+rules -> first example

  examples.forEach(example => {
    let system;
    try {
      system = LParser.parse(example.code.trim());
    } catch (e) {
      return; // unparseable entries are never flagged
    }

    const exactKey = canonicalSystem(system);
    const skeletonKey = systemSkeleton(system);

    if (seenExact.has(exactKey)) {
      example.duplicate = { kind: 'exact', of: seenExact.get(exactKey).name };
    } else if (seenSkeleton.has(skeletonKey)) {
      example.duplicate = { kind: 'variant', of: seenSkeleton.get(skeletonKey).name };
    }

    if (!seenExact.has(exactKey)) seenExact.set(exactKey, example);
    if (!seenSkeleton.has(skeletonKey)) seenSkeleton.set(skeletonKey, example);
  });
}

/** A stable string form of the whole parsed system. */
function canonicalSystem(system) {
  const out = {};
  for (const key of Object.keys(system).sort()) {
    const value = system[key];
    if (key === 'rules') {
      out.rules = Object.keys(value).sort().map(r => r + '=>' + value[r]).join(';');
    } else if (key === 'actions') {
      out.actions = Object.keys(value).sort()
        .map(a => a + '=>' + value[a].name + '(' + value[a].args.join(',') + ')').join(';');
    } else {
      out[key] = value;
    }
  }
  return JSON.stringify(out);
}

/** Axiom + rules with color-action symbols removed: the bare fractal shape. */
function systemSkeleton(system) {
  const colorChars = new Set();
  if (system.actions) {
    for (const [ch, action] of Object.entries(system.actions)) {
      if (/chcolor|setColor/i.test(action.name)) colorChars.add(ch);
    }
  }
  const strip = s => Array.from(String(s)).filter(c => !colorChars.has(c)).join('');
  const rules = system.rules
    ? Object.keys(system.rules).sort().map(r => r + '=>' + strip(system.rules[r])).join(';')
    : '';
  return strip(system.axiom || '') + '|' + rules;
}
