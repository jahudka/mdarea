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
  helper: HTMLDivElement;
  options: NormalisedOptions;
  reOutdent: RegExp;
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
