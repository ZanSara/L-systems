<template>
  <div id="app">
    <button class='sidebar-toggle' @click='toggleSidebar' :class='{"sidebar-open": sidebarOpen}'>
      <span class='toggle-icon'>{{ sidebarOpen ? '×' : '☰' }}</span>
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

        <div class="section examples-section">
          <div class='title'>
            Example Systems
            <a class='toggle-examples' :class='{"examples-visible": examplesVisible}' href='#' @click.prevent='examplesVisible = !examplesVisible'>
              {{ examplesVisible ? 'hide' : 'show' }}
            </a>
          </div>
          <div v-if='examplesVisible' class='examples-list'>
            <a
              v-for='(example, index) in examples'
              :key='index'
              href='#'
              class='example-item'
              :class='{"active": currentExampleIndex === index}'
              @click.prevent='loadExample(index)'
            >
              {{ example.name }}
            </a>
          </div>
        </div>

        <div class='controls'>
          <a href="#" class='album-button' @click.prevent='pickFromAlbum'>♫ Pick from Album</a>
          <a href="#" class='randomize-button' @click.prevent='trueRandomize'>⚄ True Randomize</a>
        </div>
</div>
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
      examplesVisible: false,
      currentExampleIndex: -1,
      examples: []
    }
  },
  mounted() {
    this.scene = createScene(document.querySelector('#scene'));
    this.codeEditorModel = getCodeModel(this.scene);
    this.examples = this.codeEditorModel.getExamples();
  },
  beforeDestroy() {
    this.scene.dispose();
  },
  methods: {
    toSVGFile() {
      this.scene.saveToSVG('l-system.svg');
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
    }
  }

}
</script>

<style lang='stylus'>
@import "./shared.styl";
@import "./editor.styl";

// Blueprint color palette
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

#app {
  overflow: hidden;
  max-height: 100%;
  position: absolute;
  z-index: 1;
  color: primary-text;
  background: window-background;
}

.sidebar-toggle {
  position: fixed;
  top: 16px;
  left: 16px;
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

  &.sidebar-open {
    left: 516px;
  }

  .toggle-icon {
    line-height: 1;
    user-select: none;
  }
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

.examples-section {
  border-top: 2px solid blueprint-border;
  margin-top: 16px;
  padding-top: 0;

  .title {
    margin-bottom: 0;

    a.toggle-examples {
      background: blueprint-dark;
      border: 1px solid blueprint-border;
      padding: 6px 12px;
      border-radius: 3px;
      font-size: 11px;
      text-transform: none;

      &:hover {
        background: blueprint-border;
        border-color: blueprint-accent;
      }

      &.examples-visible {
        background: blueprint-accent;
        color: white;
        border-color: blueprint-bright;
      }
    }
  }

  .examples-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
    margin-top: 12px;
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
  a.randomize-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 14px 24px;
    color: white;
    text-decoration: none;
    border: 2px solid blueprint-bright;
    border-radius: 4px;
    font-size: 15px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 4px 12px rgba(58, 123, 213, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2);

    &:hover {
      border-color: primary-text;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(58, 123, 213, 0.5),
                  inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(58, 123, 213, 0.4),
                  inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
  }

  a.album-button {
    background: linear-gradient(135deg, #6b4c9a 0%, #9b59b6 100%);
    border-color: #b884d4;

    &:hover {
      background: linear-gradient(135deg, #9b59b6 0%, #6b4c9a 100%);
    }
  }

  a.randomize-button {
    background: linear-gradient(135deg, blueprint-accent 0%, #2d5fa8 100%);

    &:hover {
      background: linear-gradient(135deg, blueprint-bright 0%, blueprint-accent 100%);
    }
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
