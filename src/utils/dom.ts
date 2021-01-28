import { getLineInfo, increment, isList, stripLast, toIndent } from './markdown';
import { ctrlKey, isFfox, matchesKey } from './options';
import { Editor, EditorState } from '../types';

const reDoubledInline = /[*_]/;
const reSingleQuotePrefix = /[-=\s"'`<>\[\](){}+*^$\\.|]$/;
const reListEnd = /^(?:\n|$)/;
const reMkIndent = /^(?!$)/mg;
const codeBlocks = {'`': /^``$/m, '~': /^~~$/m};
const openingParens = {'[': ']', '(': ')', '{': '}', '<': '>'};
const closingParens = {']': '[', ')': '(', '}': '{', '>': '<'};

export function createHelper() : HTMLPreElement {
  const helper = document.createElement('pre');
  helper.setAttribute('aria-hidden', 'true');
  helper.tabIndex = -1;
  helper.contentEditable = true as any;
  helper.textContent = '';
  helper.addEventListener('focus', () => setTimeout(() => helper.blur(), 0));
  helper.style.position = 'fixed';
  helper.style.overflow = helper.style.visibility = 'hidden';
  helper.style.left = '-1000px';
  helper.style.top = '50%';
  helper.style.width = helper.style.height = '1px';
  helper.style.opacity = '0';
  return helper;
}

export function handleKey(ed: Editor, evt: KeyboardEvent) : void {
  if (!ed.elem || evt.defaultPrevented) {
    return;
  }

  if (isFfox && evt[ctrlKey] && evt.key === 'z') {
    ed.elem.blur();
  }

  const shortcut = ed.options.keyMap.find((shortcut) => matchesKey(evt, shortcut.key));

  if (!shortcut) {
    return;
  }

  const state = extractState(ed.elem);

  const prefix = state.v.substring(0, state.s),
    selection = state.v.substring(state.s, state.e),
    postfix = state.v.substring(state.e);

  switch (shortcut.action) {
    case 'enter':
      handleEnterKey(ed, prefix, selection, postfix, evt.shiftKey);
      break;
    case 'indent':
      handleIndentKey(ed, prefix, selection, postfix);
      break;
    case 'outdent':
      handleOutdentKey(ed, prefix, selection, postfix);
      break;
    case 'inline':
      handleInlineKey(ed, prefix, selection, postfix, evt.key);
      break;
  }

  evt.preventDefault();
}

function handleEnterKey(ed: Editor, prefix: string, selection: string, postfix: string, shiftKey: boolean) : void {
  const info = !selection ? getLineInfo(prefix) : null;

  if (info) {
    if (info.line && info.line.charAt(info.line.length - 1) in openingParens) {
      const base = (info.prefix ? toIndent(info.prefix, true) : '');
      postfix = "\n" + base + postfix;

      if (!shiftKey) {
        prefix += "\n" + base + ed.options.indent;
      }
    } else if (info.prefix) {
      if (!shiftKey && info.prefix === info.line && reListEnd.test(postfix)) {
        prefix = prefix.substring(0, info.offset) + stripLast(info.prefix);
      } else if (!shiftKey && isList(info.prefix)) {
        prefix += "\n" + increment(info.prefix);
      } else {
        prefix += "\n" + toIndent(info.prefix, shiftKey);
      }
    } else {
      prefix += "\n";
    }
  } else {
    prefix += "\n";
  }

  pushState(ed, prefix + postfix, prefix.length);
}

function handleIndentKey(ed: Editor, prefix: string, selection: string, postfix: string) : void {
  let s = prefix.length,
  n = prefix.lastIndexOf("\n") + 1;

  if (n < s) {
    selection = prefix.substring(n) + selection;
    prefix = prefix.substring(0, n);
  }

  if (n < s || !selection) {
    s += ed.options.indent.length;
  }

  if (selection) {
    selection = selection.replace(reMkIndent, ed.options.indent);
  } else {
    prefix += ed.options.indent;
  }

  pushState(ed, prefix + selection + postfix, s, selection ? n + selection.length : s);
}

function handleOutdentKey(ed: Editor, prefix: string, selection: string, postfix: string) : void {
  let s = prefix.length,
  n = prefix.lastIndexOf("\n") + 1;

  if (n < s) {
    selection = prefix.substring(n) + selection;
    prefix = prefix.substring(0, n);

    if (selection.substring(0, ed.options.indent.length) === ed.options.indent) {
      s -= ed.options.indent.length;
    }
  }

  selection = selection.replace(ed.reOutdent, '');
  pushState(ed, prefix + selection + postfix, s, n + selection.length);
}

function handleInlineKey(ed: Editor, prefix: string, selection: string, postfix: string, key: string) : void {
  if (!selection && !(key in openingParens) && postfix.charAt(0) === key) {
    pushState(ed, prefix + (reDoubledInline.test(key) ? key + key : '') + postfix, prefix.length + 1);
  } else if (!selection && (key === "'" && !reSingleQuotePrefix.test(prefix) || key in closingParens)) {
    pushState(ed, prefix + key + postfix, prefix.length + 1);
  } else if (!selection && key in codeBlocks && codeBlocks[key].test(prefix)) {
    pushState(ed, prefix + key + "language\n" + key + key + key + (postfix.charAt(0) !== "\n" ? "\n" : '') + postfix, prefix.length + 1, prefix.length + 9);
  } else if (key === prefix.slice(-1) && key === postfix.slice(0, 1)) {
    pushState(ed,
      prefix.slice(0, -1) + selection + postfix.slice(1),
      prefix.length - 1,
      prefix.length - 1 + selection.length
    );
  } else {
    pushState(ed,
      prefix + (closingParens[key] || key) + selection + (openingParens[key] || key) + postfix,
      prefix.length + 1,
      prefix.length + 1 + selection.length
    );
  }
}

function pushState(ed: Editor, v: string, s: number, e: number = s) : void {
  ed.lock = true;
  ed.helper.style.visibility = '';

  const state: EditorState = {
    s,
    e,
    v,
    x: ed.elem.scrollLeft,
    y: ed.elem.scrollTop,
  };

  ensureInit(ed);
  writeState(ed.helper, state);
  applyState(ed.elem, state);

  ed.helper.style.visibility = 'hidden';
  ed.lock = false;
}

export function handleInput(ed: Editor, evt: InputEvent) : void {
  if (ed.lock) {
    return;
  }

  ed.lock = true;

  const state = extractState(ed.elem);

  evt.preventDefault();

  document.execCommand('undo');

  ensureInit(ed);

  writeState(ed.helper, state);
  applyState(ed.elem, state);

  ed.lock = false;
}

export function handleUndo(ed: Editor) : void {
  if (ed.lock) {
    return;
  }

  const state = readState(ed.helper);

  if (!state) {
    ed.elem.focus();
    return;
  }

  ed.lock = true;
  applyState(ed.elem, state);
  ed.lock = false;
}

function ensureInit(ed: Editor) : void {
  if (!ed.init) {
    ed.init = true;
    writeState(ed.helper, extractState(ed.elem));
  }
}

function extractState(elem: HTMLTextAreaElement) : EditorState {
  return {
    s: elem.selectionStart,
    e: elem.selectionEnd,
    x: elem.scrollLeft,
    y: elem.scrollTop,
    v: elem.value.replace(/\u00A0/g, ' '),
  };
}

function applyState(elem: HTMLTextAreaElement, state: EditorState): void {
  elem.value = state.v;
  elem.selectionStart = state.s;
  elem.selectionEnd = state.e;
  elem.scrollTo(state.x, state.y);
  elem.focus();
}

function readState(helper: HTMLPreElement) : EditorState | null {
  return JSON.parse(helper.textContent || 'null');
}

function writeState(helper: HTMLPreElement, state: EditorState): void {
  helper.focus();
  document.execCommand('selectAll');
  document.execCommand('insertText', false, JSON.stringify(state));
}
