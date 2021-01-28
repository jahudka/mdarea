import { Editor, MarkdownAreaOptions } from './types';
import {
  createHelper,
  handleInput,
  handleKey,
  handleUndo,
  normalizeOptions,
} from './utils';

export class MarkdownArea {
  private ed: Editor;

  constructor(elem: HTMLTextAreaElement, maybeOptions?: MarkdownAreaOptions) {
    const options = normalizeOptions(maybeOptions);

    const editor = this.ed = {
      elem,
      options,
      helper: createHelper(),
      reOutdent: new RegExp('^' + options.indent, 'mg'),
      init: false,
      lock: false,
    } as Editor;

    editor.onInput = handleInput.bind(null, editor);
    editor.onKeyDown = handleKey.bind(null, editor);
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
      this.ed.elem.removeEventListener('input', this.ed.onInput);
      this.ed.elem.removeEventListener('keydown', this.ed.onKeyDown);
    }

    this.ed.elem = elem;
    elem.addEventListener('keydown', this.ed.onKeyDown);
    elem.addEventListener('input', this.ed.onInput);
    this.ed.helper.textContent = '';
    this.ed.init = false;
  }

  getValue() : string {
    return this.ed.elem.value.replace(/\u00A0/g, ' ');
  }

  setValue(value: string, keepUndo: boolean = false) : void {
    this.ed.elem.value = value;

    if (!keepUndo) {
      this.ed.helper.textContent = '';
      this.ed.init = false;
    }
  }

  destroy() : null {
    this.ed.elem.removeEventListener('keydown', this.ed.onKeyDown);
    this.ed.elem.removeEventListener('input', this.ed.onInput);
    this.ed.helper.removeEventListener('input', this.ed.onUndo);
    document.body.removeChild(this.ed.helper);
    Object.assign(this.ed, { elem: null, helper: null, options: null, reOutdent: null, onKeyDown: null, onInput: null, onUndo: null });
    Object.assign(this, { ed: null });
    return null;
  }
}
