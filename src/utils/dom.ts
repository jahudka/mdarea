import { Editor, EditorState } from '../types';

export function createHelper() : HTMLDivElement {
  const helper = document.createElement('div');
  helper.setAttribute('aria-hidden', 'true');
  helper.tabIndex = -1;
  helper.contentEditable = true as any;
  helper.textContent = '0';
  helper.addEventListener('focus', () => setTimeout(() => helper.blur(), 0));

  if (process.env.CI) {
    helper.style.position = 'fixed';
    helper.style.overflow = 'hidden';
    helper.style.left = '-1000px';
    helper.style.top = '50%';
    helper.style.width = helper.style.height = '1px';
    helper.style.opacity = '0';
  }

  return helper;
}

export function extractState(elem: HTMLTextAreaElement, committed: boolean = false) : EditorState {
  return {
    s: elem.selectionStart,
    e: elem.selectionEnd,
    x: elem.scrollLeft,
    y: elem.scrollTop,
    v: elem.value.replace(/\u00A0/g, ' '),
    c: committed,
  };
}

export function pushState(ed: Editor, v: string, s: number, e: number = s) : void {
  ed.lock = true;

  commitState(ed, {
    s,
    e,
    v,
    x: ed.elem.scrollLeft,
    y: ed.elem.scrollTop,
    c: true,
  }, true);

  ed.lock = false;
}

export function handleInput(ed: Editor, evt: InputEvent) : void {
  if (ed.lock) {
    return;
  }

  evt.preventDefault();
  ed.lock = true;

  const next = extractState(ed.elem);
  document.execCommand('undo');
  commitState(ed, next);

  ed.lock = false;
}

export function handleUndo(ed: Editor) : void {
  if (ed.lock) {
    return;
  }

  ed.lock = true;
  ed.idx = +(ed.helper.textContent || '0');
  ed.state = ed.history[ed.idx];
  applyState(ed.elem, ed.state);
  ed.lock = false;
}

export function resetHistory(ed: Editor) : void {
  ed.helper.textContent = '0';
  ed.state = extractState(ed.elem);
  ed.history = [ed.state];
  ed.idx = 0;
}

function commitState(ed: Editor, state: EditorState, forceNew: boolean = false) : void {
  if (ed.idx < 1 || forceNew && !ed.state.c) {
    updateState(ed, extractState(ed.elem, true));
  }

  if (ed.state.c) {
    writeState(ed, state);
  } else {
    updateState(ed, state);
  }

  applyState(ed.elem, ed.state);
}

function updateState(ed: Editor, state: EditorState) : void {
  Object.assign(ed.state, state);
}

function applyState(elem: HTMLTextAreaElement, state: EditorState): void {
  elem.value = state.v;
  elem.selectionStart = state.s;
  elem.selectionEnd = state.e;
  elem.scrollTo(state.x, state.y);
  elem.focus();
}

function writeState(ed: Editor, state: EditorState): void {
  ed.history.splice(++ed.idx, ed.history.length, state);
  ed.state = state;
  ed.helper.focus();
  document.execCommand('selectAll');
  document.execCommand('insertText', false, ed.idx.toString());
}
