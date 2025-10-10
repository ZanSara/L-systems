import {createScene, createGuide, toSVG} from 'w-gl';
import LSystem from './LSystem';

export default function createLScene(canvas) {
  let scene = createScene(canvas, {
    // Disable 3D transformations, only allow 2D panning and zooming
    camera: {
      allowRotation: false,
      allowPinchRotation: false
    }
  });
  let guide = null; // Start with grid hidden

  scene.setClearColor(0, 0, 0, 1)
  let initialSceneSize = 40;
  scene.setViewBox({
    left:  -initialSceneSize,
    top:   -initialSceneSize,
    right:  initialSceneSize,
    bottom: initialSceneSize,
  });

  let canDrawMore = false;
  let lSystem = [];
  let disposeLater;
  let raf = requestAnimationFrame(frame);
  let defaultColor = 0xFFFFFFFF; // white
  let defaultLineWidth = 2;
  let currentTheme = 'dark'; // Track current theme
  let gridColor = 0x444444ff; // medium gray for dark theme

  return {
    dispose,
    setSystem,
    saveToSVG,
    isComplete,
    stop,
    setTheme,
    setLineWidth,
    setGridVisible,
  }

  function saveToSVG(fileName) {
    let svg = toSVG(scene, {
      open() {
        return `<!-- Generator: https://zansara.dev/L-system -->`;
      },
      scale: 5
    });

    // Add non-scaling-stroke to keep line width constant regardless of scale
    svg = svg.replace(/<path /g, '<path vector-effect="non-scaling-stroke" ');

    let blob = new Blob([svg], {type: "image/svg+xml"});
    let url = window.URL.createObjectURL(blob);
    // For some reason, safari doesn't like when download happens on the same
    // event loop cycle. Pushing it to the next one.
    setTimeout(() => {
      let a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      revokeLater(url);
    }, 30)
  }

  function revokeLater(url) {
    // In iOS immediately revoked URLs cause "WebKitBlobResource error 1." error
    // Setting a timeout to revoke URL in the future fixes the error:
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 45000);
  }

  function setSystem(newSystem) {
    cancelAnimationFrame(raf);
    if (disposeLater) {
      lSystem.forEach(l => disposeLater.push(l));
    } else {
      disposeLater = lSystem;
    }

    if (!Array.isArray(newSystem)) {
      newSystem = [newSystem]
    }
    lSystem = [];
    newSystem.forEach(systemSettings => {
      // Set default color if not specified
      if (systemSettings.color === undefined) {
        systemSettings.color = defaultColor;
      }
      // Set default line width if not specified
      if (systemSettings.width === undefined) {
        systemSettings.width = defaultLineWidth;
      }
      lSystem.push(new LSystem(scene, systemSettings));
    });

    raf = requestAnimationFrame(frame);
  }

  function isComplete() {
    return lSystem.every(x => x.complete);
  }

  function frame() {
    canDrawMore = false;
    lSystem.forEach(drawSystem);
    if (canDrawMore) {
      raf = requestAnimationFrame(frame);
    }
    if (disposeLater) {
      disposeLater.forEach(l => l.dispose())
      disposeLater = null;
    }
  }

  function drawSystem(system) {
    canDrawMore |= system.frame();
  }

  function stop() {
    cancelAnimationFrame(raf);
    canDrawMore = false;
  }

  function setTheme(isLight) {
    currentTheme = isLight ? 'light' : 'dark';

    if (isLight) {
      // Light theme: white background, black lines, dark gray grid
      scene.setClearColor(1, 1, 1, 1);
      defaultColor = 0x000000FF; // black: RRGGBBAA format
      gridColor = 0x888888ff; // dark gray for light theme
    } else {
      // Dark theme: black background, white lines, light gray grid
      scene.setClearColor(0, 0, 0, 1);
      defaultColor = 0xFFFFFFFF; // white: RRGGBBAA format
      gridColor = 0x444444ff; // medium gray for dark theme
    }

    // Update grid color if it's visible
    if (guide) {
      guide.dispose();
      guide = createGuide(scene, {
        lineColor: gridColor
      });
    }

    // Force a re-render
    scene.renderFrame();
  }

  function setLineWidth(width) {
    defaultLineWidth = width;
  }

  function setGridVisible(visible) {
    if (visible && !guide) {
      guide = createGuide(scene, {
        lineColor: gridColor
      });
    } else if (!visible && guide) {
      guide.dispose();
      guide = null;
    }
    scene.renderFrame();
  }

  function dispose() {
    cancelAnimationFrame(raf);
    scene.dispose();
  }
}