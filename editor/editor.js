import { EditorState, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  drawSelection,
  highlightSpecialChars,
  rectangularSelection,
  crosshairCursor,
} from '@codemirror/view';
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  undo,
  redo,
  undoDepth,
  redoDepth,
} from '@codemirror/commands';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
  bracketMatching,
  foldGutter,
  indentOnInput,
} from '@codemirror/language';
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from '@codemirror/autocomplete';
import { lintGutter, linter } from '@codemirror/lint';
import { highlightSelectionMatches } from '@codemirror/search';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { diffLines } from 'diff';

const theme = EditorView.theme({
  '&': { height: '100%', backgroundColor: '#f8f2e3', color: '#263c2f', fontSize: '13px' },
  '.cm-scroller': { fontFamily: 'Consolas, monospace', overflow: 'auto' },
  '.cm-content': { padding: '12px 0', caretColor: '#245b3f' },
  '.cm-gutters': { backgroundColor: '#ede4cf', color: '#68745b', border: 'none' },
  '.cm-activeLineGutter': { backgroundColor: '#d8e2c8' },
  '.cm-cursor': { borderLeftColor: '#245b3f' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: '#bfd8bb !important',
  },
  '.cm-tooltip': { backgroundColor: '#fffaf0', color: '#263c2f', borderColor: '#a8b397' },
  '.cm-foldPlaceholder': { backgroundColor: '#e6e0cd', borderColor: '#c8c4b2' },
});

function languageFor(path) {
  if (/\.[cm]?[jt]sx?$/.test(path))
    return javascript({ typescript: /\.[cm]?tsx?$/.test(path), jsx: /[jt]sx$/.test(path) });
  if (/\.html?$/.test(path)) return html();
  if (/\.css$/.test(path)) return css();
  if (/\.json$/.test(path)) return [json(), linter(jsonParseLinter())];
  return [];
}
function create(textarea, position) {
  const host = document.createElement('div');
  host.id = 'st-codemirror';
  textarea.after(host);
  let suppress = false,
    currentKey = '',
    lastReadOnly = true,
    lastWrap = false;
  const states = new Map(),
    readonly = new Compartment(),
    wrapping = new Compartment();
  const makeState = (value, path, readOnly, wrap) =>
    EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        history(),
        foldGutter(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion(),
        rectangularSelection(),
        crosshairCursor(),
        highlightSelectionMatches(),
        lintGutter(),
        syntaxHighlighting(defaultHighlightStyle),
        languageFor(path),
        theme,
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        readonly.of([EditorState.readOnly.of(readOnly), EditorView.editable.of(!readOnly)]),
        wrapping.of(wrap ? EditorView.lineWrapping : []),
        EditorView.contentAttributes.of({
          'aria-label': 'Editor de código',
          spellcheck: 'false',
          autocapitalize: 'off',
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !suppress) {
            textarea.value = update.state.doc.toString();
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
          if (update.selectionSet || update.docChanged) {
            const cursor = update.state.selection.main.head,
              line = update.state.doc.lineAt(cursor);
            textarea.setSelectionRange(
              update.state.selection.main.from,
              update.state.selection.main.to,
            );
            position(line.number, cursor - line.from + 1);
          }
        }),
      ],
    });
  const view = new EditorView({ state: makeState('', '', true, false), parent: host });
  function set({ key, value, path, readOnly, wrap, visible }) {
    host.hidden = !visible;
    textarea.hidden = true;
    suppress = true;
    try {
      if (key !== currentKey) {
        if (currentKey) states.set(currentKey, view.state);
        currentKey = key;
        view.setState(states.get(key) || makeState(value, path, readOnly, wrap));
        lastReadOnly = !readOnly;
        lastWrap = !wrap;
        while (states.size > 30) states.delete(states.keys().next().value);
      }
      const effects = [];
      if (readOnly !== lastReadOnly)
        effects.push(
          readonly.reconfigure([
            EditorState.readOnly.of(readOnly),
            EditorView.editable.of(!readOnly),
          ]),
        );
      if (wrap !== lastWrap)
        effects.push(wrapping.reconfigure(wrap ? EditorView.lineWrapping : []));
      const changes =
        view.state.doc.toString() === value
          ? undefined
          : { from: 0, to: view.state.doc.length, insert: value };
      if (changes || effects.length) view.dispatch({ changes, effects });
      lastReadOnly = readOnly;
      lastWrap = wrap;
    } finally {
      suppress = false;
    }
    if (visible) view.requestMeasure();
  }
  return {
    set,
    view,
    select(from, to) {
      view.dispatch({ selection: { anchor: from, head: to }, scrollIntoView: true });
      view.focus();
    },
    focus() {
      view.focus();
    },
    // Used by the same draft/review pipeline; this never saves to the server.
    value() {
      return view.state.doc.toString();
    },
    undo() {
      return undo(view);
    },
    redo() {
      return redo(view);
    },
    history() {
      return { undo: undoDepth(view.state), redo: redoDepth(view.state) };
    },
  };
}
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
function diffMarkup(before, after) {
  const parts = diffLines(before, after, { maxEditLength: 3000, timeout: 150 });
  if (!parts)
    return (
      '<p class="detail-note">Comparação extensa. Reduza o arquivo para destacar as linhas.</p><pre>' +
      esc(after) +
      '</pre>'
    );
  let left = 1,
    right = 1,
    rows = 0;
  const html = [];
  for (const part of parts)
    for (const line of part.value
      .split('\n')
      .slice(0, part.value.endsWith('\n') ? -1 : undefined)) {
      if (++rows > 2000) break;
      html.push(
        '<div class="line-diff-row ' +
          (part.added ? 'desk-plus' : part.removed ? 'desk-minus' : '') +
          '"><span>' +
          (part.added ? '' : left++) +
          '</span><span>' +
          (part.removed ? '' : right++) +
          '</span><code>' +
          esc((part.added ? '+ ' : part.removed ? '- ' : '  ') + line) +
          '</code></div>',
      );
    }
  return (
    '<div class="line-diff" aria-label="Alterações por linha">' +
    html.join('') +
    '</div>' +
    (rows > 2000 ? '<p>Comparação limitada a 2.000 linhas.</p>' : '')
  );
}
window.FirmaCodeEditor = { create, diffMarkup };
