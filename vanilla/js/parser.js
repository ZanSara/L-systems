/**
 * Parser for the L-system definition language.
 *
 * The input is a plain-text document made of "sections". A section is a
 * `key: value` line (`axiom`, `angle`, `depth`, ...) or a block section
 * (`rules:`, `actions:`) followed by indented `X => value` lines.
 *
 * It works as a simple state machine with two states: "ExpectKeyValue"
 * and "ExpectRewriteValue". Each state consumes one line of input and
 * either transitions to the other state or records a key/value pair.
 */
'use strict';

var LParser = (function () {
  const separator = /:|->|=>|=|→/;
  const rulesKey = /rules|production rules/i;
  const actionsKey = /actions/i;
  const ws = /[ \t]/g;
  const numericKey = /angle|depth|width|stepsPerFrame/i;
  const vectorKey = /direction|position/i;
  const parens = /[[\]()]/g;

  /** Reads `X => value` lines inside a `rules:` or `actions:` block. */
  class ExpectRewriteValue {
    constructor(addTo, parent, valueParser) {
      this.parent = parent;
      this.addTo = addTo;
      this.valueParser = valueParser || (result => result);
    }

    process(line) {
      let result = line.split(separator);
      if (result.length === 1) throw new Error('Expected `_ => value`, found ' + line);

      let key = result[0].trim();
      if (key.length !== 1) {
        // Not a single-symbol rewrite rule - this block is over, hand the
        // line back to the parent key/value state.
        return this.parent.process(line);
      }
      let v = result.slice(1).join('').replace(ws, '');
      this.addTo[key] = this.valueParser(v);
      return this;
    }
  }

  /** Reads top-level `key: value` lines. */
  class ExpectKeyValue {
    constructor(addTo) {
      this.addTo = addTo;
    }

    process(line) {
      let result = line.split(separator);
      if (result.length === 1) throw new Error('Expected `key: value`, found ' + line);
      let key = result[0].trim();
      let value = result.slice(1).join('').trim();
      if (key.match(rulesKey)) {
        this.addTo.rules = {};
        return new ExpectRewriteValue(this.addTo.rules, this);
      } else if (key.match(actionsKey)) {
        this.addTo.actions = {};
        return new ExpectRewriteValue(this.addTo.actions, this, extractAction);
      } else if (key.match(numericKey)) {
        let v = Number.parseFloat(value);
        if (!Number.isFinite(v)) {
          throw new Error('Expected a number value for `' + key + '`');
        }
        this.addTo[key] = v;
        return this;
      } else if (key.match(vectorKey)) {
        this.addTo[key] = parseVector(value, key);
        return this;
      }

      this.addTo[key] = value;
      return this;
    }
  }

  function extractAction(stringValue) {
    let m = stringValue.match(/(\w+?)\s*\((.+?)?\)/);
    if (!m) {
      throw new Error('Expected `action()` call, got: ' + stringValue);
    }
    let name = m[1];
    let args;
    if (!m[2]) args = [];
    else {
      args = m[2].split(',').map(v => {
        let stringValue = extractStringValue(v);
        if (stringValue !== undefined) return stringValue;
        return Number.parseFloat(v.trim());
      });
    }
    return { name, args };
  }

  function extractStringValue(value) {
    let matchedString = (value && value.match(/\s*(?:'(.*?)'|"(.*?)")\s*/));
    if (matchedString) {
      return matchedString[1] || matchedString[2];
    }
  }

  function parseVector(v, vectorName) {
    return v.replace(parens, '').replace(ws, '').split(',').map((component, position) => {
      if (!component) {
        throw new Error('Missing vector component at position ' + position + ' for `' + vectorName + '`');
      }
      let x = Number.parseFloat(component);
      if (!Number.isFinite(x)) {
        throw new Error('Vectors are expected to be numbers. Found `' + component + '` in `' + v + '`');
      }
      return x;
    });
  }

  function parse(str) {
    let lines = str.split('\n');
    let currentState = new ExpectKeyValue({});

    lines.forEach((line, lineNumber) => {
      line = line.trim();
      // ignore comments and empty lines
      if (line === '' || line.startsWith('//')) return;
      try {
        currentState = currentState.process(line);
      } catch (e) {
        throw new Error(e.message + '\n\n at line ' + (lineNumber + 1));
      }
    });

    while (currentState.parent) {
      currentState = currentState.parent;
    }
    return currentState.addTo;
  }

  return { parse };
})();
