export type MarkdownAreaOptions = {
  indent?: string | number;
  keyMap?: Partial<MarkdownAreaKeymap>;
  actions?: Partial<MarkdownAreaActions>;
};

export type MarkdownAreaKeymap = {
  [action: string]: string | string[];
};

export type MarkdownAreaActions = {
  [action: string]: MarkdownAreaActionHandler | null;
};

export type MarkdownAreaActionHandler = (
  options: NormalisedOptions,
  prefix: string,
  selection: string,
  postfix: string,
  evt: KeyboardEvent,
) => MarkdownAreaActionResult | undefined | null;

export type MarkdownAreaActionResult = {
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
  actions: MarkdownAreaActions;
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
  action: string;
}[];

export type LineInfo = {
  line: string;
  offset: number;
  prefix: string | null;
};
