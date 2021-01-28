export type MarkdownAreaOptions = {
  indent?: string | number;
  keyMap?: Partial<MarkdownAreaKeymap>;
};

export type MarkdownAreaAction = 'enter' | 'indent' | 'outdent' | 'inline';
export type MarkdownAreaKey = string | string[];

export type MarkdownAreaKeymap = {
  [A in MarkdownAreaAction]: MarkdownAreaKey;
};

export type Editor = {
  elem: HTMLTextAreaElement;
  helper: HTMLPreElement;
  options: NormalisedOptions;
  reOutdent: RegExp;
  onKeyDown: (evt: KeyboardEvent) => void;
  onInput: (evt: InputEvent) => void;
  onUndo: (evt: InputEvent) => void;
  init: boolean;
  lock: boolean;
};

export type EditorState = {
  s: number;
  e: number;
  x: number;
  y: number;
  v: string;
};

export type NormalisedOptions = {
  indent: string;
  keyMap: NormalisedKeyMap;
};

export type KeyCombo = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
};

export type NormalisedKeyMap = {
  key: KeyCombo ,
  action: MarkdownAreaAction;
}[];

export type LineInfo = {
  line: string;
  offset: number;
  prefix: string | null;
};
