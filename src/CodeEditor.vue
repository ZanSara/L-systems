<template>
<div>
  <div ref='host' class='cm-host'></div>
  <div class='error-container' v-if='model.error'>
    <pre class='error hl'>{{model.error}}</pre>
  </div>
</div>
</template>

<script>
import bus from './bus';
import CodeMirror from 'codemirror/lib/codemirror.js';
import 'codemirror/addon/comment/comment.js';
import registerLSystemMode from './lmode.js';

registerLSystemMode(CodeMirror);

function toggleComment(cm) {
  cm.toggleComment({
    indent: true,
    lineComment: '//'
  });
}

function handleUp(cm) {
  return updateValueIfNeededBy(1, cm);
}

function handleDown(cm) {
  return updateValueIfNeededBy(-1, cm);
}

function updateValueIfNeededBy(delta, cm) {
  let cursor = cm.getCursor();
  let token = cm.getTokenAt(cursor);
  if (!token || token.type !== 'number') return CodeMirror.Pass;

  let from = {line: cursor.line, ch: token.start};
  let end = {line: cursor.line, ch: token.end};

  let v = Number.parseFloat(token.string);
  let line = cm.getLine(cursor.line);
  if (from.ch > 0) {
    if (line[from.ch - 1] === '-') {
      v *= -1;
      from.ch -= 1;
    }
  }

  v += delta;
  var doc = cm.getDoc();
  doc.replaceRange(String(v), from, end);
  bus.fire('immediate-update');
}

export default {
  name: 'CodeEditor',
  props: ['model'],
  mounted() {
    this.editor = CodeMirror(this.$refs.host, {
      value: this.model.code || '',
      viewportMargin: Infinity,
      theme: 'lsystem',
      mode: 'application/lsystem',
      extraKeys: {
        'Cmd-/': toggleComment,
        'Ctrl-/': toggleComment,
        'Shift-Up': handleUp,
        'Shift-Down': handleDown
      }
    });

    this.editor.on('change', () => {
      const value = this.editor.getValue();
      if (value === this.model.code) return;
      this.model.code = value;
    });

    bus.on('settings-collapsed', this.refreshEditor, this);
    bus.on('immediate-update', this.setImmediateUpdate, this);
  },

  beforeUnmount() {
    bus.off('settings-collapsed', this.refreshEditor, this);
    bus.off('immediate-update', this.setImmediateUpdate, this);
  },

  watch: {
    'model.code': function(newValue) {
      if (this.editor && this.editor.getValue() !== newValue) {
        this.editor.setValue(newValue || '');
      }
      if (this.model.ignoreNextUpdate) {
        this.model.ignoreNextUpdate = false;
        return;
      }
      if (this.pendingSetCode) {
        clearTimeout(this.pendingSetCode);
      }
      if (this.isImmediate) {
        this.model.setCode(this.model.code);
        this.pendingSetCode = 0;
        return;
      }

      this.pendingSetCode = setTimeout(() => {
        this.model.setCode(this.model.code);
        this.pendingSetCode = 0;
      }, 300);
    },
  },
  data() {
    return {
      clearImmediate: 0,
      isImmediate: false
    }
  },
  methods: {
    setImmediateUpdate() {
      if (this.clearImmediate) clearTimeout(this.clearImmediate);
      this.clearImmediate = setTimeout(() => this.isImmediate = false, 30);
      this.isImmediate = true;
    },
    refreshEditor(isCollapsed) {
      if (!isCollapsed && this.editor) {
        setTimeout(() => this.editor.refresh(), 10);
      }
    }
  }
}
</script>
