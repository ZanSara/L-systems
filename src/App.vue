<template>
  <div id="app" :class='{"light-theme": isLightTheme}'>
    <button class='sidebar-toggle' @click='toggleSidebar' :class='{"sidebar-open": sidebarOpen}'>
      <span class='toggle-icon'>{{ sidebarOpen ? '×' : '☰' }}</span>
    </button>
    <button class='theme-toggle' @click='toggleTheme' :title='isLightTheme ? "Switch to dark theme" : "Switch to light theme"'>
      <span class='theme-icon'>{{ isLightTheme ? '☀' : '☾' }}</span>
    </button>
    <div class='sidebar' :class='{"sidebar-open": sidebarOpen}'>
      <div class='editor-container'>
        <div class="section">
        <div class='title'>L-System details: <a class='reset-all' :class='{"syntax-visible": syntaxHelpVisible}' href='#' @click.prevent='syntaxHelpVisible = !syntaxHelpVisible' title='click to learn more about syntax'>syntax help</a></div>
        <div class='help' v-if='syntaxHelpVisible'>
          L-Systems are described very well on <a href='http://paulbourke.net/fractals/lsys/' target="_blank">Paul Bourke's website</a>.
          <p>The following is the list of available sections:
            <ul>
              <li><strong>axiom</strong>: initial state of the system</li>
              <li><strong>rules</strong>: list of rewrite rules that are applied on each iteration</li>
              <li><strong>depth</strong>: how deep we are allowed to go recursively</li>
              <li><strong>angle</strong>: if specified, this argument governs rotation angle. Can be overridden with <strong>actions</strong></li>
              <li><strong>actions</strong>: list of graphic commands that are triggered by a matching character in the evolved system.
                The following is the list of available actions:
                <ul>
                  <li><strong>draw(x)</strong> draw <code>x</code> units in current direction</li>
                  <li><strong>move(x)</strong> move <code>x</code> units in current direction without drawing</li>
                  <li><strong>rotate(deg)</strong>  rotate current direction <code>deg</code> degrees around Z axis</li>
                  <li><strong>rotateX(deg)</strong> rotate current direction <code>deg</code> degrees around X axis</li>
                  <li><strong>rotateY(deg)</strong> rotate current direction <code>deg</code> degrees around Y axis</li>
                  <li><strong>push()</strong> saves current render state onto stack</li>
                  <li><strong>pop()</strong> restores previously saved render state</li>
                  <li><strong>setColor(color)</strong> set the current color value, '#ffa500' or 'orange'.</li>
                  <li><strong>swapAngle()</strong> swaps the meaning of `+` and `-`.</li>
                </ul>

                <p>By default the following actions are added automatically:</p>
<pre><code>actions:
  F => draw(10)
  f => move(10)
  + => rotate(60)
  - => rotate(-60)
  & => swapAngle()
  [ => push()
  ] => pop()
</code></pre>

              </li>

              <li><strong>width</strong>: width in pixels of the drawn line</li>
              <li><strong>color</strong>: color of the line. Accepts names and hex. E.g. <code>blue</code>, works the same as <code>#0000ff</code></li>
              <li><strong>stepsPerFrame</strong>: how many steps we are allowed to render per single frame.
              If set to <code>-1</code> the scene is rendered immediately. This could be dangerous on deep
              systems, as the entire system traversal may exhaust the browser's resources.
              </li>

              <li><strong>direction</strong>: three numbers separated by coma <code>x, y, z</code> that set initial direction</li>
              <li><strong>position</strong>: three numbers separated by coma <code>x, y, z</code> that set initial position</li>
            </ul>
          </p>
        </div>
        <code-editor v-if='codeEditorModel' :model='codeEditorModel' class='code-editor-container'></code-editor>

        <div class='line-width-control'>
          <label for='line-width'>Line Width:</label>
          <input
            id='line-width'
            type='range'
            min='0.5'
            max='10'
            step='0.5'
            v-model.number='lineWidth'
            @input='updateLineWidth'
          />
          <span class='width-value'>{{ lineWidth }}px</span>
        </div>

        <div class='controls'>
          <a href="#" class='album-button' @click.prevent='pickFromAlbum'>Pick from Examples</a>
          <a href="#" class='randomize-button' @click.prevent='trueRandomize'>Random Values</a>
          <a href="#" class='stop-button' @click.prevent='stopGeneration'>Stop Generation</a>
          <a href="#" class='save-button' @click.prevent='toSVGFile'>Save as SVG</a>
        </div>

        <div class="section examples-section">
          <div class='title'>Examples</div>
          <div class='examples-list'>
            <a
              v-for='(example, index) in examples'
              :key='index'
              href='#'
              class='example-item'
              :class='{"active": currentExampleIndex === example.index}'
              @click.prevent='loadExample(example.index)'
            >
              {{ example.name }}
            </a>
          </div>
        </div>
</div>
      </div>
    </div>

    <!-- Save SVG Modal -->
    <div v-if='showSaveModal' class='modal-overlay' @click='showSaveModal = false'>
      <div class='modal-content' @click.stop>
        <h3>Save as SVG</h3>
        <p>Choose which theme version(s) to save:</p>
        <div class='modal-buttons'>
          <button @click='saveSVGVersion("light")' class='modal-btn light-btn'>
            ☀ Light Theme
            <span class='filename'>l-system-light.svg</span>
          </button>
          <button @click='saveSVGVersion("dark")' class='modal-btn dark-btn'>
            ☾ Dark Theme
            <span class='filename'>l-system-dark.svg</span>
          </button>
          <button @click='saveSVGVersion("both")' class='modal-btn both-btn'>
            ☀☾ Both Themes
            <span class='filename'>2 files</span>
          </button>
        </div>
        <button @click='showSaveModal = false' class='modal-cancel'>Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import createScene from './createScene';
import getCodeModel from './getCodeModel';
import CodeEditor from './CodeEditor';

export default {
  name: 'App',
  components: {
    CodeEditor
  },
  data() {
    return {
      codeEditorModel: null,
      sidebarOpen: true,
      syntaxHelpVisible: false,
      currentExampleIndex: -1,
      examples: [],
      isLightTheme: false,
      showSaveModal: false,
      lineWidth: 2
    }
  },
  mounted() {
    this.scene = createScene(document.querySelector('#scene'));

    // Load theme preference from localStorage FIRST
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightTheme = true;
    }

    // Set theme BEFORE loading code so default color is correct
    this.scene.setTheme(this.isLightTheme);

    // Now load the code model with the correct default color
    this.codeEditorModel = getCodeModel(this.scene);
    this.examples = this.codeEditorModel.getExamples().sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  },
  beforeDestroy() {
    this.scene.dispose();
  },
  methods: {
    toSVGFile() {
      this.showSaveModal = true;
    },
    saveSVGVersion(version) {
      const currentTheme = this.isLightTheme;

      if (version === 'light') {
        if (!this.isLightTheme) {
          this.scene.setTheme(true);
          this.codeEditorModel.setCode(this.codeEditorModel.code);
        }
        this.scene.saveToSVG('l-system-light.svg');
        if (!currentTheme) {
          setTimeout(() => {
            this.scene.setTheme(false);
            this.codeEditorModel.setCode(this.codeEditorModel.code);
          }, 100);
        }
      } else if (version === 'dark') {
        if (this.isLightTheme) {
          this.scene.setTheme(false);
          this.codeEditorModel.setCode(this.codeEditorModel.code);
        }
        this.scene.saveToSVG('l-system-dark.svg');
        if (currentTheme) {
          setTimeout(() => {
            this.scene.setTheme(true);
            this.codeEditorModel.setCode(this.codeEditorModel.code);
          }, 100);
        }
      } else if (version === 'both') {
        // Save dark version
        if (this.isLightTheme) {
          this.scene.setTheme(false);
          this.codeEditorModel.setCode(this.codeEditorModel.code);
        }
        this.scene.saveToSVG('l-system-dark.svg');

        // Wait a bit, then save light version
        setTimeout(() => {
          this.scene.setTheme(true);
          this.codeEditorModel.setCode(this.codeEditorModel.code);
          this.scene.saveToSVG('l-system-light.svg');

          // Restore original theme
          if (!currentTheme) {
            setTimeout(() => {
              this.scene.setTheme(false);
              this.codeEditorModel.setCode(this.codeEditorModel.code);
            }, 100);
          }
        }, 200);
      }

      this.showSaveModal = false;
    },
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen;
    },
    pickFromAlbum() {
      const index = this.codeEditorModel.randomize();
      this.currentExampleIndex = index;
    },
    trueRandomize() {
      this.codeEditorModel.trueRandomize();
      this.currentExampleIndex = -1;
    },
    loadExample(index) {
      this.currentExampleIndex = index;
      this.codeEditorModel.loadExample(index);
    },
    stopGeneration() {
      if (this.scene) {
        this.scene.stop();
      }
    },
    toggleTheme() {
      this.isLightTheme = !this.isLightTheme;
      localStorage.setItem('theme', this.isLightTheme ? 'light' : 'dark');
      if (this.scene) {
        this.scene.setTheme(this.isLightTheme);
        // Reload the current code to apply the new default color
        if (this.codeEditorModel && this.codeEditorModel.code) {
          this.codeEditorModel.setCode(this.codeEditorModel.code);
        }
      }
    },
    updateLineWidth() {
      if (this.scene && this.codeEditorModel && this.codeEditorModel.code) {
        this.scene.setLineWidth(this.lineWidth);
        this.codeEditorModel.setCode(this.codeEditorModel.code);
      }
    }
  }

}
</script>

<style lang='stylus'>
@import "./shared.styl";
@import "./editor.styl";

// Dark Blueprint color palette
blueprint-bg = #0a1628;
blueprint-border = #1e3a5f;
blueprint-accent = #3a7bd5;
blueprint-text = #a8d4ff;
blueprint-bright = #6eb5ff;
blueprint-dark = #050d18;
blueprint-grid = rgba(62, 120, 213, 0.15);

primary-text = #e8f4ff;
help-text-color = #6eb5ff;
help-background = #0d1b2e;

// Light theme color palette
light-bg = #f0f4f8;
light-border = #b8c9db;
light-accent = #2563eb;
light-text = #1e3a5f;
light-bright = #1d4ed8;
light-dark = #e5ebf1;
light-grid = rgba(37, 99, 235, 0.08);

light-primary-text = #0f1419;
light-help-text-color = #2563eb;
light-help-background = #dfe6ee;

#app {
  overflow: hidden;
  max-height: 100%;
  position: absolute;
  z-index: 1;
  color: primary-text;
  background: window-background;
}

.sidebar-toggle,
.theme-toggle {
  position: fixed;
  top: 16px;
  z-index: 1000;
  width: 44px;
  height: 44px;
  background: blueprint-bg;
  border: 2px solid blueprint-accent;
  border-radius: 4px;
  color: blueprint-bright;
  cursor: pointer;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4),
              0 0 20px rgba(58, 123, 213, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);

  &:hover {
    background: #0f2140;
    border-color: blueprint-bright;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5),
                0 0 30px rgba(58, 123, 213, 0.4),
                inset 0 1px 0 rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }

  .toggle-icon,
  .theme-icon {
    line-height: 1;
    user-select: none;
  }
}

.sidebar-toggle {
  left: 16px;

  &.sidebar-open {
    left: 516px;
  }
}

.theme-toggle {
  right: 16px;
}

.section {
  padding: 16px;
}

.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 500px;
  height: 100vh;
  overflow: hidden;
  background: blueprint-bg;
  border-right: 2px solid blueprint-accent;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5),
              0 0 40px rgba(58, 123, 213, 0.15);
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 999;

  // Blueprint grid pattern
  background-image:
    linear-gradient(blueprint-grid 1px, transparent 1px),
    linear-gradient(90deg, blueprint-grid 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0, 0 0;

  &.sidebar-open {
    transform: translateX(0);
  }
}

.editor-container {
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(to bottom, blueprint-dark 0%, blueprint-bg 100%);

  a {
    color: blueprint-bright;
    text-decoration: none;
    border-bottom: 1px dashed blueprint-border;
    transition: all 0.2s;

    &:hover {
      color: primary-text;
      border-bottom-color: blueprint-accent;
    }
  }

  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: blueprint-dark;
    border-left: 1px solid blueprint-border;
  }

  &::-webkit-scrollbar-thumb {
    background: blueprint-accent;
    border-radius: 4px;

    &:hover {
      background: blueprint-bright;
    }
  }
}

.error-container {
  color: white;
  background: #d32f2f;
  padding: 8px 16px;
  border-left: 3px solid #ff5252;
  margin: 8px;
}

.title {
  color: primary-text;
  font-size: 20px;
  font-weight: 500;
  padding: 8px 0;
  margin-bottom: 12px;
  border-bottom: 2px solid blueprint-border;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-family: 'Courier New', monospace;

  a {
    float: right;
    font-size: 11px;
    font-style: normal;
    color: help-text-color;
    text-transform: none;
    letter-spacing: 0;
    padding: 6px 12px;
    border: 1px solid blueprint-border;
    border-radius: 3px;
    background: blueprint-dark;
    margin-top: -4px;
    transition: all 0.2s;

    &:hover {
      background: blueprint-border;
      border-color: blueprint-accent;
    }
  }

  a.syntax-visible {
    background: blueprint-accent;
    color: white;
    border-color: blueprint-bright;
  }
}

.help {
  margin: 12px -16px 16px -16px;
  padding: 20px;
  background: help-background;
  color: blueprint-text;
  border: 1px solid blueprint-border;
  border-left: none;
  border-right: none;

  a {
    border-bottom: 1px dashed blueprint-border;
    color: primary-text;
    font-weight: 500;
  }

  ul {
    padding: 0;
    list-style-type: none;

    ul {
      padding-left: 20px;
      list-style-type: none;
      margin-top: 8px;
    }

    strong {
      color: blueprint-bright;
      font-weight: 600;
      font-family: 'Courier New', monospace;
    }

    code {
      color: #4ec9b0;
      background: rgba(0, 0, 0, 0.3);
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 13px;
    }

    li {
      margin: 8px 0;
      line-height: 1.6;
    }
  }

  pre {
    background: rgba(0, 0, 0, 0.4);
    border: 1px solid blueprint-border;
    border-radius: 4px;
    padding: 12px;
    margin: 12px 0;

    code {
      background: none;
      padding: 0;
    }
  }
}

.code-editor-container {
  margin: 16px 0;
}

.line-width-control {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(30, 58, 95, 0.2);
  border: 1px solid blueprint-border;
  border-radius: 4px;
  margin: 16px 0;

  label {
    color: blueprint-text;
    font-size: 14px;
    font-weight: 500;
    min-width: 80px;
  }

  input[type='range'] {
    flex: 1;
    height: 6px;
    background: blueprint-border;
    border-radius: 3px;
    outline: none;
    -webkit-appearance: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: blueprint-bright;
      cursor: pointer;
      border: 2px solid blueprint-bg;
      box-shadow: 0 0 10px rgba(110, 181, 255, 0.5);
      transition: all 0.2s;

      &:hover {
        background: primary-text;
        box-shadow: 0 0 15px rgba(110, 181, 255, 0.8);
        transform: scale(1.1);
      }
    }

    &::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: blueprint-bright;
      cursor: pointer;
      border: 2px solid blueprint-bg;
      box-shadow: 0 0 10px rgba(110, 181, 255, 0.5);
      transition: all 0.2s;

      &:hover {
        background: primary-text;
        box-shadow: 0 0 15px rgba(110, 181, 255, 0.8);
        transform: scale(1.1);
      }
    }
  }

  .width-value {
    color: blueprint-bright;
    font-size: 14px;
    font-weight: 600;
    min-width: 45px;
    text-align: right;
    font-family: 'Courier New', monospace;
  }
}

.examples-section {
  border-top: 2px solid blueprint-border;
  margin-top: 16px;
  padding-top: 0;

  .title {
    margin: 12px 0;
  }

  .examples-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 4px;

    // Custom scrollbar
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: blueprint-dark;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: blueprint-accent;
      border-radius: 3px;

      &:hover {
        background: blueprint-bright;
      }
    }

    .example-item {
      padding: 10px 12px;
      background: rgba(30, 58, 95, 0.3);
      border: 1px solid blueprint-border;
      border-left: 3px solid blueprint-border;
      border-radius: 3px;
      color: blueprint-text;
      text-decoration: none;
      font-size: 13px;
      transition: all 0.2s;
      cursor: pointer;

      &:hover {
        background: rgba(30, 58, 95, 0.6);
        border-left-color: blueprint-accent;
        color: primary-text;
        transform: translateX(4px);
      }

      &.active {
        background: rgba(58, 123, 213, 0.2);
        border-left-color: blueprint-bright;
        color: blueprint-bright;
        font-weight: 600;
        box-shadow: 0 0 10px rgba(58, 123, 213, 0.3);
      }
    }
  }
}

.controls {
  padding: 16px;
  margin-top: 8px;
  border-top: 2px solid blueprint-border;
  display: flex;
  flex-direction: column;
  gap: 12px;

  a.album-button,
  a.randomize-button,
  a.stop-button,
  a.save-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 14px 24px;
    background: transparent;
    text-decoration: none;
    border: 2px solid;
    border-radius: 4px;
    font-size: 15px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 0 20px currentColor;
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 0 10px currentColor;
    }
  }

  a.album-button {
    color: #b884d4;
    border-color: #b884d4;

    &:hover {
      color: #d4a5f0;
      border-color: #d4a5f0;
    }
  }

  a.randomize-button {
    color: blueprint-bright;
    border-color: blueprint-bright;

    &:hover {
      color: primary-text;
      border-color: primary-text;
    }
  }

  a.stop-button {
    color: #ef5350;
    border-color: #ef5350;

    &:hover {
      color: #ff6b68;
      border-color: #ff6b68;
    }
  }

  a.save-button {
    color: #26a69a;
    border-color: #26a69a;

    &:hover {
      color: #4db6ac;
      border-color: #4db6ac;
    }
  }
}

// Light theme overrides
#app.light-theme {
  .sidebar-toggle,
  .theme-toggle {
    background: light-bg;
    border-color: light-accent;
    color: light-bright;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1),
                0 0 20px rgba(37, 99, 235, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.5);

    &:hover {
      background: light-dark;
      border-color: light-bright;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15),
                  0 0 30px rgba(37, 99, 235, 0.2),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }
  }

  .sidebar {
    background: light-bg;
    border-right-color: light-accent;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1),
                0 0 40px rgba(37, 99, 235, 0.08);

    background-image:
      linear-gradient(light-grid 1px, transparent 1px),
      linear-gradient(90deg, light-grid 1px, transparent 1px);
  }

  .editor-container {
    background: linear-gradient(to bottom, light-dark 0%, light-bg 100%);

    a {
      color: light-bright;
      border-bottom-color: light-border;

      &:hover {
        color: light-primary-text;
        border-bottom-color: light-accent;
      }
    }

    &::-webkit-scrollbar-track {
      background: light-dark;
      border-left-color: light-border;
    }

    &::-webkit-scrollbar-thumb {
      background: light-accent;

      &:hover {
        background: light-bright;
      }
    }
  }

  .title {
    color: light-primary-text;
    border-bottom-color: light-border;

    a {
      color: light-help-text-color;
      border-color: light-border;
      background: light-dark;

      &:hover {
        background: light-border;
        border-color: light-accent;
      }
    }

    a.syntax-visible {
      background: light-accent;
      color: white;
      border-color: light-bright;
    }
  }

  .help {
    background: light-help-background;
    color: light-text;
    border-color: light-border;

    a {
      border-bottom-color: light-border;
      color: light-primary-text;
    }

    ul {
      strong {
        color: light-bright;
      }

      code {
        color: #059669;
        background: rgba(0, 0, 0, 0.05);
      }
    }

    pre {
      background: rgba(0, 0, 0, 0.05);
      border-color: light-border;
    }
  }

  .examples-section {
    border-top-color: light-border;

    .examples-list {
      &::-webkit-scrollbar-track {
        background: light-dark;
      }

      &::-webkit-scrollbar-thumb {
        background: light-accent;

        &:hover {
          background: light-bright;
        }
      }

      .example-item {
        background: rgba(185, 201, 219, 0.2);
        border-color: light-border;
        border-left-color: light-border;
        color: light-text;

        &:hover {
          background: rgba(185, 201, 219, 0.4);
          border-left-color: light-accent;
          color: light-primary-text;
        }

        &.active {
          background: rgba(37, 99, 235, 0.15);
          border-left-color: light-bright;
          color: light-bright;
          box-shadow: 0 0 10px rgba(37, 99, 235, 0.2);
        }
      }
    }
  }

  .controls {
    border-top-color: light-border;

    a.album-button {
      color: #7c3aed;
      border-color: #7c3aed;

      &:hover {
        color: #6d28d9;
        border-color: #6d28d9;
      }
    }

    a.randomize-button {
      color: light-bright;
      border-color: light-bright;

      &:hover {
        color: light-accent;
        border-color: light-accent;
      }
    }

    a.stop-button {
      color: #dc2626;
      border-color: #dc2626;

      &:hover {
        color: #b91c1c;
        border-color: #b91c1c;
      }
    }

    a.save-button {
      color: #0d9488;
      border-color: #0d9488;

      &:hover {
        color: #0f766e;
        border-color: #0f766e;
      }
    }
  }

  .error-container {
    background: #fca5a5;
    color: #7f1d1d;
    border-left-color: #dc2626;
  }

  .line-width-control {
    background: rgba(185, 201, 219, 0.2);
    border-color: light-border;

    label {
      color: light-text;
    }

    input[type='range'] {
      background: light-border;

      &::-webkit-slider-thumb {
        background: light-bright;
        border-color: light-bg;
        box-shadow: 0 0 10px rgba(29, 78, 216, 0.3);

        &:hover {
          background: light-accent;
          box-shadow: 0 0 15px rgba(29, 78, 216, 0.5);
        }
      }

      &::-moz-range-thumb {
        background: light-bright;
        border-color: light-bg;
        box-shadow: 0 0 10px rgba(29, 78, 216, 0.3);

        &:hover {
          background: light-accent;
          box-shadow: 0 0 15px rgba(29, 78, 216, 0.5);
        }
      }
    }

    .width-value {
      color: light-bright;
    }
  }

  .modal-overlay {
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    background: light-bg;
    border-color: light-accent;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3),
                0 0 40px rgba(37, 99, 235, 0.2);

    h3 {
      color: light-bright;
    }

    p {
      color: light-text;
    }
  }

  .modal-btn {
    color: light-bright;

    &.light-btn {
      border-color: #f59e0b;
      color: #f59e0b;

      &:hover {
        background: rgba(245, 158, 11, 0.1);
      }
    }

    &.dark-btn {
      border-color: #7c3aed;
      color: #7c3aed;

      &:hover {
        background: rgba(124, 58, 237, 0.1);
      }
    }

    &.both-btn {
      border-color: light-bright;
      color: light-bright;

      &:hover {
        background: rgba(29, 78, 216, 0.1);
      }
    }
  }

  .modal-cancel {
    border-color: light-border;
    color: light-text;

    &:hover {
      background: light-border;
      color: light-primary-text;
    }
  }
}

// Modal styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: blueprint-bg;
  border: 2px solid blueprint-accent;
  border-radius: 8px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6),
              0 0 40px rgba(58, 123, 213, 0.3);

  h3 {
    color: blueprint-bright;
    font-size: 24px;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-family: 'Courier New', monospace;
  }

  p {
    color: blueprint-text;
    margin: 0 0 24px 0;
    font-size: 15px;
  }
}

.modal-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.modal-btn {
  padding: 16px 20px;
  border: 2px solid;
  border-radius: 6px;
  background: transparent;
  color: blueprint-bright;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .filename {
    font-size: 12px;
    opacity: 0.7;
    font-weight: 400;
    font-family: 'Courier New', monospace;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 20px currentColor;
  }

  &.light-btn {
    border-color: #fbbf24;
    color: #fbbf24;

    &:hover {
      background: rgba(251, 191, 36, 0.1);
    }
  }

  &.dark-btn {
    border-color: #8b5cf6;
    color: #8b5cf6;

    &:hover {
      background: rgba(139, 92, 246, 0.1);
    }
  }

  &.both-btn {
    border-color: blueprint-bright;
    color: blueprint-bright;

    &:hover {
      background: rgba(110, 181, 255, 0.1);
    }
  }
}

.modal-cancel {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 2px solid blueprint-border;
  border-radius: 6px;
  color: blueprint-text;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: blueprint-border;
    color: primary-text;
  }
}


@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    max-width: 400px;
  }

  .sidebar-toggle.sidebar-open {
    left: calc(100% - 60px);
    max-left: 416px;
  }
}
</style>
