import { Editor, EditorOptions, NewState } from './types';
import {
  createHelper,
  handleInput,
  handleKey,
  handleUndo,
  normalizeOptions,
  pushState,
  resetHistory,
} from './utils';
import { version as v } from './env';

export class MarkdownArea {
  private readonly ed: Editor;

  constructor(elem: HTMLTextAreaElement, maybeOptions?: EditorOptions) {
    const options = normalizeOptions(maybeOptions);

    const editor: Editor = this.ed = {
      elem,
      options,
      helper: createHelper(),
      history: [],
      state: undefined,
      idx: -1,
      lock: false,
    } as any;

    editor.onKeyDown = handleKey.bind(null, editor);
    editor.onInput = handleInput.bind(null, editor);
    editor.onUndo = handleUndo.bind(null, editor);

    editor.helper.addEventListener('input', editor.onUndo);
    document.body.appendChild(editor.helper);
    this.setElement(elem);
  }

  getElement() : HTMLTextAreaElement {
    return this.ed.elem;
  }

  setElement(elem: HTMLTextAreaElement) : void {
    if (this.ed.elem) {
      this.ed.options.extensions.forEach(ext => ext.cleanup && ext.cleanup(this));
      this.ed.elem.removeEventListener('input', this.ed.onInput);
      this.ed.elem.removeEventListener('keydown', this.ed.onKeyDown);
    }

    this.ed.elem = elem;
    elem.addEventListener('keydown', this.ed.onKeyDown);
    elem.addEventListener('input', this.ed.onInput);
    resetHistory(this.ed);
    this.ed.options.extensions.forEach(ext => ext.init && ext.init(this));
  }

  getValue() : string {
    return this.ed.elem.value.replace(/\u00A0/g, ' ');
  }

  setValue(value: string, keepUndo: boolean = false) : void {
    this.ed.elem.value = value;

    if (!keepUndo) {
      resetHistory(this.ed);
    }
  }

  pushState(state: NewState) : void {
    pushState(this.ed, state);
  }

  destroy() : null {
    this.ed.options.extensions.forEach(ext => ext.cleanup && ext.cleanup(this));
    this.ed.elem.removeEventListener('keydown', this.ed.onKeyDown);
    this.ed.elem.removeEventListener('input', this.ed.onInput);
    this.ed.helper.removeEventListener('input', this.ed.onUndo);
    document.body.removeChild(this.ed.helper);
    this.ed.options.extensions.forEach(ext => ext.destroy && ext.destroy());
    Object.assign(this.ed, { elem: null, helper: null, options: null, reOutdent: null, onKeyDown: null, onInput: null, onUndo: null, history: null });
    Object.assign(this, { ed: null });
    return null;
  }
}

export namespace MarkdownArea {
  export const version: string = v;
}
