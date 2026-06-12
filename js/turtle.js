/**
 * A classic 3D turtle. It keeps a position, a heading and a color, and
 * emits line segments into a scene layer as it walks.
 *
 * The turtle state is fully 3D so that rotateX()/rotateY() actions and
 * 3D `direction:` vectors keep working, but the scene is a 2D canvas:
 * the z coordinate is dropped (orthographic projection) when a segment
 * is emitted.
 */
'use strict';

class Turtle {
  constructor(scene, options = {}) {
    this.position = sliceVector(options.position, [0, 0, 0]);
    checkArray('position', this.position);
    this.direction = sliceVector(options.direction, [1, 0, 0]);
    checkArray('direction', this.direction);
    normalize(this.direction);

    this.scene = scene;
    this.layer = scene.createLayer(options.width || 2);
    this.color = options.color || '#ffffff';
    this.stack = [];
    this.invertZYAngle = false;
  }

  dispose() {
    this.scene.removeLayer(this.layer);
  }

  push() {
    this.stack.push({
      color: this.color,
      direction: [this.direction[0], this.direction[1], this.direction[2]],
      position: [this.position[0], this.position[1], this.position[2]],
    });
  }

  pop() {
    let state = this.stack.pop();
    if (!state) return;
    this.color = state.color;
    this.direction = state.direction;
    this.position = state.position;
  }

  move(distance) {
    let p = this.position;
    let n = this.direction;
    p[0] += distance * n[0];
    p[1] += distance * n[1];
    p[2] += distance * n[2];
  }

  draw(distance) {
    let p = this.position;
    let n = this.direction;
    let x = p[0] + distance * n[0];
    let y = p[1] + distance * n[1];
    let z = p[2] + distance * n[2];
    // Project onto the XY plane: the viewer is a 2D canvas.
    this.layer.add(p[0], p[1], x, y, this.color);
    p[0] = x; p[1] = y; p[2] = z;
  }

  setColor(newColorValue) {
    if (newColorValue === undefined) {
      throw new Error('setColor() expects color value, got undefined');
    }
    this.color = String(newColorValue);
  }

  rotateZ(angleInDegrees) {
    if (this.invertZYAngle) angleInDegrees *= -1;
    let rad = Math.PI * angleInDegrees / 180;
    let n = this.direction;

    let x = Math.cos(rad) * n[0] - Math.sin(rad) * n[1];
    let y = Math.sin(rad) * n[0] + Math.cos(rad) * n[1];

    n[0] = x;
    n[1] = y;
  }

  rotateY(angleInDegrees) {
    if (this.invertZYAngle) angleInDegrees *= -1;
    let rad = Math.PI * angleInDegrees / 180;
    let n = this.direction;

    let x = Math.cos(rad) * n[0] - Math.sin(rad) * n[2];
    let z = Math.sin(rad) * n[0] + Math.cos(rad) * n[2];

    n[0] = x;
    n[2] = z;
  }

  rotateX(angleInDegrees) {
    let rad = Math.PI * angleInDegrees / 180;
    let n = this.direction;

    let y = Math.cos(rad) * n[1] - Math.sin(rad) * n[2];
    let z = Math.sin(rad) * n[1] + Math.cos(rad) * n[2];

    n[1] = y;
    n[2] = z;
  }

  swapAngle() {
    this.invertZYAngle = !this.invertZYAngle;
  }
}

function sliceVector(value, fallback) {
  if (value === undefined) return fallback.slice();
  return Array.isArray(value) ? value.slice() : value;
}

function checkArray(arrayName, array) {
  if (!Array.isArray(array)) {
    throw new Error('Array is expected for `' + arrayName + '`');
  }
  if (array.length === 2) {
    array.push(0);
  }
  if (array.length !== 3) {
    throw new Error('Array `' + arrayName + '` should have 2 or 3 coordinates, got ' + array.length);
  }
}

function normalize(arr) {
  let l = Math.hypot(arr[0], arr[1], arr[2]);
  if (l === 0) throw new Error('`direction` cannot be a zero vector');
  arr[0] /= l;
  arr[1] /= l;
  arr[2] /= l;
}
