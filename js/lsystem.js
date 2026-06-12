/**
 * The L-System itself: expands the axiom through the rewrite rules, then
 * walks the resulting string symbol by symbol, triggering turtle actions.
 *
 * Rendering is incremental: renderIterator() yields after every executed
 * action, and frame() advances it by `stepsPerFrame` actions per call
 * (`stepsPerFrame: -1` renders everything in a single call).
 */
'use strict';

// We don't want to crash the browser. If the expanded system is larger than
// this we stop the expansion and report the system as incomplete.
const LSYSTEM_LIMIT = 1000000;

class LSystem {
  constructor(scene, systemSettings) {
    coerceSystemTypes(systemSettings);
    this.rules = systemSettings.rules || {};
    this.actions = compileActions(systemSettings, this);
    this.turtle = new Turtle(scene, systemSettings);
    this.stepsPerFrame = systemSettings.stepsPerFrame || 42;

    const depth = Number.isFinite(systemSettings.depth) ? systemSettings.depth : 5;
    let axiom = systemSettings.axiom;
    if (axiom === undefined) axiom = Object.keys(this.rules)[0];
    if (axiom === undefined) throw new Error('System has neither an axiom nor rewrite rules');
    this.axiom = axiom;
    this.depth = depth;
    this.simulate();
    this.iterator = this.renderIterator();
  }

  dispose() {
    this.turtle.dispose();
  }

  frame() {
    let next, steps = 0;
    do {
      next = this.iterator.next();
    } while (!next.done && steps++ < this.stepsPerFrame);
    return !next.done;
  }

  simulate() {
    let production = this.axiom;
    let index = 0;
    while (index < this.depth && production.length < LSYSTEM_LIMIT) {
      production = this.iterateRules(production);
      index += 1;
    }

    this.production = production;
    this.complete = production.length < LSYSTEM_LIMIT;
  }

  iterateRules(input) {
    let result = [];
    for (let op of input) {
      let rewriteRule = this.rules[op];
      if (rewriteRule !== undefined) result.push(rewriteRule);
      else result.push(op);
    }
    return result.join('');
  }

  *renderIterator() {
    for (let op of this.production) {
      if (this.actions[op]) {
        this.actions[op]();
        if (this.stepsPerFrame >= 0) {
          yield;
        }
      }
    }
  }
}

function compileActions(systemSettings, lSystem) {
  let actions = {};

  let defaultRotationAngle = Number.isFinite(systemSettings.angle) ? systemSettings.angle : 60;

  let mergedActions = Object.assign({
    'F': { name: 'draw', args: [] },
    'f': { name: 'move', args: [] },
    '+': { name: 'rotate', args: [defaultRotationAngle] },
    '-': { name: 'rotate', args: [-defaultRotationAngle] },
    '&': { name: 'swapAngle', args: [] },
    '[': { name: 'push', args: [] },
    ']': { name: 'pop', args: [] },
  }, systemSettings.actions);

  Object.keys(mergedActions).forEach(key => {
    let value = mergedActions[key];
    let turtleAction = turtleCanDo(value, lSystem);
    if (turtleAction) {
      actions[key] = turtleAction;
    } else {
      throw new Error("Turtle does not know how to do '" + value.name + "'");
    }
  });

  return actions;
}

function turtleCanDo(command, lSystem) {
  if (command.name.indexOf('rotate') === 0) {
    let angle = command.args[0];
    if (!Number.isFinite(angle)) throw new Error('rotate() needs one float argument');

    switch (command.name) {
      case 'rotateX': return function () { lSystem.turtle.rotateX(angle); };
      case 'rotateY': return function () { lSystem.turtle.rotateY(angle); };
    }

    return function () { lSystem.turtle.rotateZ(angle); };
  }

  if (command.name === 'draw') {
    let length = getLength(command.args[0], 'draw');
    return function () { lSystem.turtle.draw(length); };
  }

  if (command.name.match(/chcolor|setColor/i)) {
    let color = command.args[0];
    return function () { lSystem.turtle.setColor(color); };
  }

  if (command.name === 'push') return function () { lSystem.turtle.push(); };
  if (command.name === 'pop') return function () { lSystem.turtle.pop(); };
  if (command.name === 'move') {
    let length = getLength(command.args[0], 'move');
    return function () { lSystem.turtle.move(length); };
  }
  if (command.name.match(/swapAngle/i)) {
    return function () { lSystem.turtle.swapAngle(); };
  }
}

function getLength(value, name) {
  let length = 10;
  if (value !== undefined) {
    length = value;
    if (!Number.isFinite(length)) throw new Error(name + '(l) expects `l` to be a float number. Got: ' + value);
  }
  return length;
}

function coerceSystemTypes(system) {
  if (system.angle !== undefined) system.angle = Number.parseFloat(system.angle);
  if (system.width !== undefined) system.width = Number.parseFloat(system.width);
  if (system.depth !== undefined) system.depth = Number.parseFloat(system.depth);
  if (system.position !== undefined) system.position = coerceVector(system.position, 'position');
  if (system.direction !== undefined) system.direction = coerceVector(system.direction, 'direction');
}

function coerceVector(value, name) {
  if (Array.isArray(value)) return value.map(Number);
  if (typeof value === 'string') {
    const parts = value.replace(/[[\]()]/g, '').split(/[,\s]+/).filter(Boolean).map(Number);
    if (parts.some(n => !Number.isFinite(n))) {
      throw new Error('`' + name + '` could not be parsed as a numeric vector: ' + value);
    }
    return parts;
  }
  throw new Error('`' + name + '` must be an array or a string of numbers');
}
