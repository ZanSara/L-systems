/**
 * UI wiring: editor, buttons, sliders, examples list, SVG export
 * selection and URL sharing. This replaces the Vue components of the
 * original app (App.vue + CodeEditor.vue).
 */
'use strict';

(function () {
  const canvas = document.getElementById('scene');
  const scene = createScene(canvas);

  const editor = document.getElementById('code');
  const errorBox = document.getElementById('error');
  const errorText = document.getElementById('error-text');
  const examplesList = document.getElementById('examples-list');

  let currentCode = '';
  let lastPickedIndex = -1;
  let pendingSetCode = 0;

  // --- code model ---------------------------------------------------------

  function applyCode(newCode) {
    currentCode = newCode;
    const trimmed = newCode.trim();
    if (!trimmed) {
      showError('Enter a system description above');
      return;
    }
    try {
      const system = LParser.parse(trimmed);
      scene.setSystem(system);
      if (scene.isComplete()) {
        showError(null);
      } else {
        showError('The system limit reached.\nRendering first 1,000,000 characters');
      }
      updateUrl(trimmed);
    } catch (e) {
      showError(e.message);
    }
  }

  function showError(message) {
    errorBox.hidden = !message;
    errorText.textContent = message || '';
  }

  function setEditorCode(code, options) {
    editor.value = code;
    if (pendingSetCode) { clearTimeout(pendingSetCode); pendingSetCode = 0; }
    applyCode(code);
    setActiveExample(options && options.exampleIndex !== undefined ? options.exampleIndex : -1);
  }

  // --- editor -------------------------------------------------------------

  editor.addEventListener('input', () => {
    setActiveExample(-1);
    if (pendingSetCode) clearTimeout(pendingSetCode);
    pendingSetCode = setTimeout(() => {
      pendingSetCode = 0;
      applyCode(editor.value);
    }, 300);
  });

  // Shift+Up / Shift+Down nudge the number under the cursor by ±1 and
  // re-render immediately - handy for tweaking angles.
  editor.addEventListener('keydown', e => {
    if (!e.shiftKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    if (nudgeNumberAtCursor(e.key === 'ArrowUp' ? 1 : -1)) {
      e.preventDefault();
    }
  });

  function nudgeNumberAtCursor(delta) {
    const text = editor.value;
    const cursor = editor.selectionStart;
    const lineStart = text.lastIndexOf('\n', cursor - 1) + 1;
    let lineEnd = text.indexOf('\n', cursor);
    if (lineEnd === -1) lineEnd = text.length;
    const line = text.slice(lineStart, lineEnd);
    const column = cursor - lineStart;

    const numberRe = /-?\d+(\.\d+)?/g;
    let match;
    while ((match = numberRe.exec(line)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (column < start || column > end) continue;

      const value = Number.parseFloat(match[0]) + delta;
      const replacement = formatNumber(value);
      editor.value = text.slice(0, lineStart + start) + replacement + text.slice(lineStart + end);
      const newCursor = lineStart + start + replacement.length;
      editor.setSelectionRange(newCursor, newCursor);

      setActiveExample(-1);
      if (pendingSetCode) { clearTimeout(pendingSetCode); pendingSetCode = 0; }
      applyCode(editor.value);
      return true;
    }
    return false;
  }

  function formatNumber(value) {
    // Avoid 22.500000000000004 style output after float math.
    return String(Math.round(value * 1e6) / 1e6);
  }

  // --- URL sharing ----------------------------------------------------------

  function updateUrl(code) {
    const params = new URLSearchParams(window.location.search);
    params.set('code', code);
    history.replaceState(null, '', '?' + params.toString());
  }

  function getInitialCode() {
    const fromUrl = new URLSearchParams(window.location.search).get('code');
    return fromUrl || DEFAULT_CODE;
  }

  // --- examples --------------------------------------------------------------

  const examples = getExamples().sort((a, b) => a.name.localeCompare(b.name));
  examples.forEach(example => {
    const item = document.createElement('a');
    item.href = '#';
    item.className = 'example-item';
    item.textContent = example.name;
    item.dataset.index = example.index;
    if (example.duplicate) {
      const kind = example.duplicate.kind;
      item.classList.add(kind === 'exact' ? 'dup-exact' : 'dup-variant');
      item.title = (kind === 'exact' ? 'Duplicate of ' : 'Variant of ') + example.duplicate.of;
      const badge = document.createElement('span');
      badge.className = 'dup-badge';
      badge.textContent = kind === 'exact' ? 'duplicate' : 'variant';
      item.appendChild(badge);
    }
    item.addEventListener('click', e => {
      e.preventDefault();
      loadExample(example.index);
    });
    examplesList.appendChild(item);
  });

  function loadExample(index) {
    if (index < 0 || index >= EXAMPLES.length) return;
    lastPickedIndex = index;
    setEditorCode(EXAMPLES[index], { exampleIndex: index });
  }

  function setActiveExample(index) {
    examplesList.querySelectorAll('.example-item').forEach(item => {
      item.classList.toggle('active', Number(item.dataset.index) === index);
    });
  }

  // --- buttons ----------------------------------------------------------------

  onClick('pick-example', () => {
    let index;
    if (EXAMPLES.length <= 1) {
      index = 0;
    } else {
      do { index = Math.floor(Math.random() * EXAMPLES.length); } while (index === lastPickedIndex);
    }
    loadExample(index);
  });

  onClick('random-values', () => {
    setEditorCode(LRandom.generate());
  });

  onClick('stop-generation', () => {
    scene.stop();
  });

  onClick('save-svg', () => {
    openSelectionOverlay();
  });

  function onClick(id, handler) {
    document.getElementById(id).addEventListener('click', e => {
      e.preventDefault();
      handler();
    });
  }

  // --- sidebar / help ------------------------------------------------------------

  const sidebar = document.getElementById('sidebar');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  sidebarToggle.addEventListener('click', () => {
    const open = sidebar.classList.toggle('sidebar-open');
    sidebarToggle.classList.toggle('sidebar-open', open);
    sidebarToggle.querySelector('.toggle-icon').textContent = open ? '×' : '☰';
  });

  const helpPanel = document.getElementById('syntax-help');
  const helpButton = document.getElementById('syntax-help-button');
  helpButton.addEventListener('click', e => {
    e.preventDefault();
    helpPanel.hidden = !helpPanel.hidden;
    helpButton.classList.toggle('syntax-visible', !helpPanel.hidden);
  });

  // --- view controls ----------------------------------------------------------------

  const lineWidthInput = document.getElementById('line-width');
  const lineWidthValue = document.getElementById('line-width-value');
  lineWidthInput.addEventListener('input', () => {
    const width = Number(lineWidthInput.value);
    lineWidthValue.textContent = width + 'px';
    scene.setLineWidth(width);
    if (currentCode) applyCode(currentCode);
  });
  scene.setLineWidth(Number(lineWidthInput.value));

  const gridCheckbox = document.getElementById('show-grid');
  const gridSwitch = document.getElementById('grid-switch');
  function setGrid(visible) {
    gridCheckbox.checked = visible;
    gridSwitch.classList.toggle('active', visible);
    scene.setGridVisible(visible);
  }
  gridCheckbox.addEventListener('change', () => setGrid(gridCheckbox.checked));
  gridSwitch.addEventListener('click', () => setGrid(!gridCheckbox.checked));

  // --- theme ------------------------------------------------------------------------

  const themeToggle = document.getElementById('theme-toggle');
  let isLightTheme = localStorage.getItem('theme') === 'light';

  function applyTheme() {
    document.body.classList.toggle('light-theme', isLightTheme);
    themeToggle.querySelector('.theme-icon').textContent = isLightTheme ? '☀' : '☾';
    themeToggle.title = isLightTheme ? 'Switch to dark theme' : 'Switch to light theme';
    scene.setTheme(isLightTheme);
  }

  themeToggle.addEventListener('click', () => {
    isLightTheme = !isLightTheme;
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
    applyTheme();
    // Re-render so systems without an explicit color pick up the new default.
    if (currentCode) applyCode(currentCode);
  });

  const rotationInput = document.getElementById('rotation');
  const rotationValue = document.getElementById('rotation-value');
  rotationInput.addEventListener('input', () => {
    const deg = Number(rotationInput.value);
    rotationValue.textContent = deg + '°';
    canvas.style.transform = `rotate(${deg}deg)`;
    scene.setRotation(deg);
  });

  // --- SVG export selection ---------------------------------------------------------

  const overlay = document.getElementById('selection-overlay');
  const mask = document.getElementById('selection-mask');
  const selectionRect = { left: 100, top: 100, width: 400, height: 400 };
  let dragState = null; // {mode: 'drag'|'resize', handle, startX, startY, rect}

  function openSelectionOverlay() {
    selectionRect.left = window.innerWidth / 2 - 200;
    selectionRect.top = window.innerHeight / 2 - 200;
    selectionRect.width = 400;
    selectionRect.height = 400;
    positionMask();
    overlay.hidden = false;
  }

  function positionMask() {
    mask.style.left = selectionRect.left + 'px';
    mask.style.top = selectionRect.top + 'px';
    mask.style.width = selectionRect.width + 'px';
    mask.style.height = selectionRect.height + 'px';
  }

  mask.addEventListener('mousedown', e => {
    if (e.target.classList.contains('resize-handle')) return;
    dragState = {
      mode: 'drag',
      startX: e.clientX - selectionRect.left,
      startY: e.clientY - selectionRect.top,
    };
    e.preventDefault();
  });

  mask.querySelectorAll('.resize-handle').forEach(handleEl => {
    handleEl.addEventListener('mousedown', e => {
      dragState = {
        mode: 'resize',
        handle: handleEl.dataset.handle,
        startX: e.clientX,
        startY: e.clientY,
        rect: Object.assign({}, selectionRect),
      };
      e.stopPropagation();
      e.preventDefault();
    });
  });

  document.addEventListener('mousemove', e => {
    if (!dragState) return;
    if (dragState.mode === 'drag') {
      selectionRect.left = e.clientX - dragState.startX;
      selectionRect.top = e.clientY - dragState.startY;
    } else {
      resizeSelection(e.clientX, e.clientY);
    }
    positionMask();
  });

  document.addEventListener('mouseup', () => {
    dragState = null;
  });

  function resizeSelection(clientX, clientY) {
    const MIN = 50;
    const startRect = dragState.rect;
    const handle = dragState.handle;
    let dx = clientX - dragState.startX;
    let dy = clientY - dragState.startY;

    // Clamp dx/dy so handles that move both edge and size don't drift
    // past the minimum dimension.
    if (handle === 'nw' || handle === 'sw' || handle === 'w') {
      dx = Math.min(dx, startRect.width - MIN);
    }
    if (handle === 'nw' || handle === 'ne' || handle === 'n') {
      dy = Math.min(dy, startRect.height - MIN);
    }
    if (handle === 'ne' || handle === 'se' || handle === 'e') {
      dx = Math.max(dx, MIN - startRect.width);
    }
    if (handle === 'sw' || handle === 'se' || handle === 's') {
      dy = Math.max(dy, MIN - startRect.height);
    }

    if (handle.includes('w')) {
      selectionRect.left = startRect.left + dx;
      selectionRect.width = startRect.width - dx;
    }
    if (handle.includes('e')) {
      selectionRect.width = startRect.width + dx;
    }
    if (handle.includes('n')) {
      selectionRect.top = startRect.top + dy;
      selectionRect.height = startRect.height - dy;
    }
    if (handle.includes('s')) {
      selectionRect.height = startRect.height + dy;
    }
  }

  onClick('selection-confirm', () => {
    overlay.hidden = true;
    scene.saveToSVG('l-system.svg', getSelectionViewBox());
  });

  onClick('selection-cancel', () => {
    overlay.hidden = true;
  });

  /**
   * Converts the screen-space selection rectangle into a world-space box.
   * The canvas may be CSS-rotated around its center, so each corner is
   * rotated back into the un-rotated canvas frame first.
   */
  function getSelectionViewBox() {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rad = -Math.PI * Number(rotationInput.value) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const toCanvas = (vx, vy) => {
      const dx = vx - cx;
      const dy = vy - cy;
      return {
        x: cos * dx - sin * dy + canvas.clientWidth / 2,
        y: sin * dx + cos * dy + canvas.clientHeight / 2,
      };
    };

    const { left, top, width, height } = selectionRect;
    const corners = [
      toCanvas(left, top),
      toCanvas(left + width, top),
      toCanvas(left, top + height),
      toCanvas(left + width, top + height),
    ].map(p => scene.getSceneCoordinate(p.x, p.y));

    const xs = corners.map(p => p.x);
    const ys = corners.map(p => p.y);
    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.max(...ys),    // world y points up
      bottom: Math.min(...ys),
    };
  }

  // --- boot ------------------------------------------------------------------------

  applyTheme(); // before the first render, so the default line color is right
  setEditorCode(getInitialCode());
})();
