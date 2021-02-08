import { MarkdownArea } from './markdownArea';

export type EditorOptions = {
  indent?: string | number;
  keyMap?: Partial<Keymap>;
  extensions?: MarkdownAreaExtension[];
};

export type EditorAction = 'enter' | 'indent' | 'outdent' | 'inline';

export type Keymap = {
  [A in EditorAction]: string | string[];
};

export interface MarkdownAreaExtension {
  init?(editor: MarkdownArea) : void;
  cleanup?(editor: MarkdownArea) : void;
  destroy?() : void;

  handleKey(
    prefix: string,
    selection: string,
    postfix: string,
    evt: KeyboardEvent,
  ) : NewState | undefined;
}

export type NewState = {
  v: string;
  s: number;
  e?: number;
  x?: number;
  y?: number;
};

export type Editor = {
  elem: HTMLTextAreaElement;
  helper: HTMLDivElement;
  options: NormalisedOptions;
  onKeyDown: (evt: KeyboardEvent) => void;
  onInput: (evt: InputEvent) => void;
  onUndo: (evt: InputEvent) => void;
  history: EditorState[];
  state: EditorState;
  idx: number;
  lock: boolean;
};

export type EditorState = {
  s: number; // selection start
  e: number; // selection end
  x: number; // scroll left
  y: number; // scroll top
  v: string; // value
  c: boolean; // committed
};

export type NormalisedOptions = {
  indent: string;
  reOutdent: RegExp;
  keyMap: NormalisedKeyMap;
  extensions: MarkdownAreaExtension[];
};

export type KeyCombo = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
};

export type NormalisedKeyMap = {
  key: KeyCombo,
  action: EditorAction;
}[];

export type LineInfo = {
  line: string;
  offset: number;
  prefix: string | null;
};
