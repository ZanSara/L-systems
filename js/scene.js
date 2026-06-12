/**
 * Canvas 2D scene. Replaces the WebGL (w-gl) renderer of the original app.
 *
 * Responsibilities:
 *  - holds layers of line segments produced by turtles;
 *  - runs the requestAnimationFrame loop that advances L-systems
 *    incrementally (`stepsPerFrame` actions per frame);
 *  - 2D camera: pan with mouse/touch drag, zoom with wheel/pinch.
 *    While the user hasn't touched the camera the view auto-fits the
 *    growing drawing;
 *  - optional grid overlay;
 *  - SVG export of a world-space rectangle.
 *
 * The canvas may be CSS-rotated by the "Rotation" slider; pointer
 * coordinates are converted back into the un-rotated canvas frame so
 * pan/zoom keep working (use setRotation to keep the scene informed).
 */
'use strict';

function createScene(canvas) {
  const ctx = canvas.getContext('2d');

  let width = 0, height = 0, dpr = 1;
  // Camera: world point (cx, cy) is at the canvas center, `scale` is
  // pixels per world unit. World y points up (canvas y points down).
  const view = { cx: 0, cy: 0, scale: 1 };

  let layers = [];
  let systems = [];
  let disposeLater = null;
  let raf = 0;
  let stopped = false;
  let needsFullRedraw = true;
  let gridVisible = false;
  let backgroundColor = '#000000';
  let defaultColor = '#ffffff';
  let gridColor = '#444444';
  let defaultLineWidth = 2;
  let rotationRad = 0; // CSS rotation currently applied to the canvas

  // Auto-fit keeps the whole drawing in view until the user pans or zooms.
  let autoFit = true;
  let lastFit = null;

  // Active pointers, for mouse/touch pan and pinch zoom.
  const pointers = new Map();
  let lastPinchDistance = 0;

  class Layer {
    constructor(lineWidth) {
      this.segments = [];
      this.width = lineWidth;
      this.drawnCount = 0;
      this.bounds = null; // {minX, minY, maxX, maxY}
    }

    add(x0, y0, x1, y1, color) {
      this.segments.push({ x0, y0, x1, y1, color });
      let b = this.bounds;
      if (!b) {
        b = this.bounds = { minX: x0, minY: y0, maxX: x0, maxY: y0 };
      }
      if (x0 < b.minX) b.minX = x0; else if (x0 > b.maxX) b.maxX = x0;
      if (y0 < b.minY) b.minY = y0; else if (y0 > b.maxY) b.maxY = y0;
      if (x1 < b.minX) b.minX = x1; else if (x1 > b.maxX) b.maxX = x1;
      if (y1 < b.minY) b.minY = y1; else if (y1 > b.maxY) b.maxY = y1;
    }
  }

  resize();
  window.addEventListener('resize', onResize);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  const api = {
    setSystem,
    stop,
    isComplete,
    saveToSVG,
    setLineWidth,
    setGridVisible,
    setTheme,
    setRotation,
    getSceneCoordinate,
    createLayer,
    removeLayer,
    dispose,
  };
  return api;

  // --- system lifecycle -----------------------------------------------

  function setSystem(newSystem) {
    if (raf) { cancelAnimationFrame(raf); raf = 0; }
    stopped = false;

    let settingsList = Array.isArray(newSystem) ? newSystem : [newSystem];
    let newSystems = [];
    try {
      settingsList.forEach(systemSettings => {
        if (systemSettings.color === undefined) systemSettings.color = defaultColor;
        if (systemSettings.width === undefined) systemSettings.width = defaultLineWidth;
        newSystems.push(new LSystem(api, systemSettings));
      });
    } catch (e) {
      // A constructor may throw after some turtles already created layers.
      newSystems.forEach(s => s.dispose());
      throw e;
    }

    // Keep the old drawing on screen until the new one produces its first
    // frame, then throw it away (same trick as the original app).
    if (disposeLater) {
      systems.forEach(s => disposeLater.push(s));
    } else {
      disposeLater = systems;
    }
    systems = newSystems;

    autoFit = true;
    lastFit = null;
    schedule();
  }

  function stop() {
    stopped = true;
    if (disposeLater) {
      disposeLater.forEach(s => s.dispose());
      disposeLater = null;
      schedule();
    }
  }

  function isComplete() {
    return systems.every(s => s.complete);
  }

  function createLayer(lineWidth) {
    const layer = new Layer(lineWidth);
    layers.push(layer);
    return layer;
  }

  function removeLayer(layer) {
    const i = layers.indexOf(layer);
    if (i >= 0) layers.splice(i, 1);
    needsFullRedraw = true;
  }

  function dispose() {
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener('resize', onResize);
  }

  // --- frame loop -------------------------------------------------------

  function schedule() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  function frame() {
    raf = 0;
    let canDrawMore = false;
    if (!stopped) {
      systems.forEach(system => {
        if (system.frame()) canDrawMore = true;
      });
    }
    if (disposeLater) {
      disposeLater.forEach(s => s.dispose());
      disposeLater = null;
    }
    if (autoFit) fitToDrawing();
    render();
    if (canDrawMore) schedule();
  }

  function fitToDrawing() {
    let b = null;
    layers.forEach(layer => {
      if (!layer.bounds) return;
      if (!b) b = Object.assign({}, layer.bounds);
      else {
        if (layer.bounds.minX < b.minX) b.minX = layer.bounds.minX;
        if (layer.bounds.minY < b.minY) b.minY = layer.bounds.minY;
        if (layer.bounds.maxX > b.maxX) b.maxX = layer.bounds.maxX;
        if (layer.bounds.maxY > b.maxY) b.maxY = layer.bounds.maxY;
      }
    });
    if (!b) return;
    if (lastFit && lastFit.minX === b.minX && lastFit.minY === b.minY &&
        lastFit.maxX === b.maxX && lastFit.maxY === b.maxY) return;
    lastFit = b;

    const w = Math.max(b.maxX - b.minX, 1e-6);
    const h = Math.max(b.maxY - b.minY, 1e-6);
    view.cx = (b.minX + b.maxX) / 2;
    view.cy = (b.minY + b.maxY) / 2;
    view.scale = 0.9 * Math.min(width / w, height / h);
    needsFullRedraw = true;
  }

  // --- rendering --------------------------------------------------------

  function onResize() {
    resize();
    schedule();
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const newWidth = canvas.clientWidth;
    const newHeight = canvas.clientHeight;
    if (width === 0) {
      // Initial view box: [-40, 40] in both directions, like the original.
      view.scale = Math.min(newWidth, newHeight) / 80;
    }
    width = newWidth;
    height = newHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    needsFullRedraw = true;
  }

  function toScreenX(x) { return width / 2 + (x - view.cx) * view.scale; }
  function toScreenY(y) { return height / 2 - (y - view.cy) * view.scale; }

  function getSceneCoordinate(canvasX, canvasY) {
    return {
      x: view.cx + (canvasX - width / 2) / view.scale,
      y: view.cy - (canvasY - height / 2) / view.scale,
    };
  }

  function render() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (needsFullRedraw) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      if (gridVisible) drawGrid();
      layers.forEach(layer => {
        drawSegments(layer, 0);
        layer.drawnCount = layer.segments.length;
      });
      needsFullRedraw = false;
    } else {
      // Only draw segments added since the last frame.
      layers.forEach(layer => {
        if (layer.drawnCount < layer.segments.length) {
          drawSegments(layer, layer.drawnCount);
          layer.drawnCount = layer.segments.length;
        }
      });
    }
  }

  function drawSegments(layer, from) {
    const segments = layer.segments;
    const n = segments.length;
    ctx.lineWidth = layer.width;
    ctx.lineCap = 'square';
    let i = from;
    while (i < n) {
      const color = segments[i].color;
      ctx.strokeStyle = color;
      ctx.beginPath();
      let batch = 0;
      while (i < n && segments[i].color === color && batch < 20000) {
        const s = segments[i];
        ctx.moveTo(toScreenX(s.x0), toScreenY(s.y0));
        ctx.lineTo(toScreenX(s.x1), toScreenY(s.y1));
        i++;
        batch++;
      }
      ctx.stroke();
    }
  }

  function drawGrid() {
    // Pick a 1/2/5 grid spacing that lands near 60 screen pixels.
    const target = 60 / view.scale;
    const pow = Math.pow(10, Math.floor(Math.log10(target)));
    let spacing = pow * 10;
    for (const m of [1, 2, 5]) {
      if (m * pow >= target) { spacing = m * pow; break; }
    }

    const topLeft = getSceneCoordinate(0, 0);
    const bottomRight = getSceneCoordinate(width, height);
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.ceil(bottomRight.x / spacing) * spacing; x >= topLeft.x; x -= spacing) {
      const sx = toScreenX(x);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
    }
    for (let y = Math.ceil(bottomRight.y / spacing) * spacing; y <= topLeft.y; y += spacing) {
      const sy = toScreenY(y);
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
    }
    ctx.stroke();
  }

  // --- camera (pan / zoom) -----------------------------------------------

  function setRotation(deg) {
    rotationRad = Math.PI * deg / 180;
  }

  /**
   * Converts viewport (client) coordinates into the un-rotated canvas
   * frame. The canvas is rotated with CSS around its center, so we rotate
   * the offset from the center back.
   */
  function clientToCanvas(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const cos = Math.cos(-rotationRad);
    const sin = Math.sin(-rotationRad);
    const dx = clientX - cx;
    const dy = clientY - cy;
    return {
      x: cos * dx - sin * dy + width / 2,
      y: sin * dx + cos * dy + height / 2,
    };
  }

  function onPointerDown(e) {
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, clientToCanvas(e.clientX, e.clientY));
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      lastPinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    const p = clientToCanvas(e.clientX, e.clientY);
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, p);

    if (pointers.size === 1) {
      panBy(p.x - prev.x, p.y - prev.y);
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (lastPinchDistance > 0) {
        zoomAt(middle, distance / lastPinchDistance);
      }
      lastPinchDistance = distance;
      panBy((p.x - prev.x) / 2, (p.y - prev.y) / 2);
    }
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    lastPinchDistance = 0;
  }

  function onWheel(e) {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.002));
    zoomAt(clientToCanvas(e.clientX, e.clientY), factor);
  }

  function panBy(dx, dy) {
    if (dx === 0 && dy === 0) return;
    autoFit = false;
    view.cx -= dx / view.scale;
    view.cy += dy / view.scale;
    needsFullRedraw = true;
    schedule();
  }

  function zoomAt(point, factor) {
    autoFit = false;
    const anchor = getSceneCoordinate(point.x, point.y);
    view.scale = Math.min(Math.max(view.scale * factor, 1e-6), 1e9);
    // Keep the world point under the cursor fixed.
    view.cx = anchor.x - (point.x - width / 2) / view.scale;
    view.cy = anchor.y + (point.y - height / 2) / view.scale;
    needsFullRedraw = true;
    schedule();
  }

  // --- settings -----------------------------------------------------------

  function setLineWidth(lineWidth) {
    defaultLineWidth = lineWidth;
  }

  function setGridVisible(visible) {
    gridVisible = visible;
    needsFullRedraw = true;
    schedule();
  }

  /**
   * Light theme: white background, black default lines, darker grid.
   * Dark theme: black background, white default lines, lighter grid.
   * The default line color only affects systems built after the switch,
   * so the caller should re-apply the current code afterwards.
   */
  function setTheme(isLight) {
    backgroundColor = isLight ? '#ffffff' : '#000000';
    defaultColor = isLight ? '#000000' : '#ffffff';
    gridColor = isLight ? '#888888' : '#444444';
    needsFullRedraw = true;
    schedule();
  }

  // --- SVG export ----------------------------------------------------------

  /**
   * Exports the world-space rectangle {left, right, top, bottom}
   * (top > bottom, world y up) as an SVG file.
   */
  function saveToSVG(fileName, box) {
    const boxWidth = Math.max(box.right - box.left, 1e-6);
    const boxHeight = Math.max(box.top - box.bottom, 1e-6);
    // Match what's on screen: same pixel density as the current view.
    const outWidth = Math.max(1, Math.round(boxWidth * view.scale));
    const outHeight = Math.max(1, Math.round(boxHeight * view.scale));

    const round = v => Math.round(v * 1000) / 1000;
    const parts = [];
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${outWidth}" height="${outHeight}" viewBox="${round(box.left)} ${round(-box.top)} ${round(boxWidth)} ${round(boxHeight)}">`);
    parts.push(`<!-- Generator: L-Systems explorer (plain JS edition) -->`);
    parts.push(`<rect x="${round(box.left)}" y="${round(-box.top)}" width="${round(boxWidth)}" height="${round(boxHeight)}" fill="${backgroundColor}"/>`);

    layers.forEach(layer => {
      const segments = layer.segments;
      const n = segments.length;
      let i = 0;
      while (i < n) {
        const color = segments[i].color;
        const d = [];
        while (i < n && segments[i].color === color) {
          const s = segments[i];
          // World y points up, SVG y points down.
          d.push(`M${round(s.x0)} ${round(-s.y0)}L${round(s.x1)} ${round(-s.y1)}`);
          i++;
        }
        parts.push(`<path d="${d.join('')}" fill="none" stroke="${escapeAttribute(color)}" stroke-width="${layer.width}" stroke-linejoin="miter" stroke-linecap="square" vector-effect="non-scaling-stroke"/>`);
      }
    });
    parts.push('</svg>');

    const blob = new Blob([parts.join('\n')], { type: 'image/svg+xml' });
    const url = window.URL.createObjectURL(blob);
    // Safari doesn't like when download happens on the same event loop
    // cycle. Pushing it to the next one.
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      // In iOS immediately revoked URLs cause "WebKitBlobResource error 1."
      setTimeout(() => window.URL.revokeObjectURL(url), 45000);
    }, 30);
  }

  function escapeAttribute(value) {
    return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }
}
