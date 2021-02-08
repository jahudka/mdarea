import {
  KeyCombo,
  LineInfo,
  MarkdownAreaExtension,
  NewState,
  NormalisedOptions,
} from '../types';

const rePrefix = /^[ \t]*(?:(?:[-+*]|\d+\.)[ \t]+(?:\[[ x]][ \t]+)?|>[ \t]*)*(?::[ \t]*)?/;
const reList = /(?:[-+*]|\d+\.)[ \t]+(?:\[[ x]][ \t]+)?$/;
const reCleanIndent = /[-+*\[\]x\d.]/g;
const rePureIndent = /[^ \t]/g;
const reIncrement = /(\d+)\.(?=[ \t]+$)/;
const reStripLast = /(?:(?:^[ \t]+)?(?:[-+*]|\d+\.|[>:])(?:[ \t]+\[[ x]])?[ \t]*|^[ \t]+)$/;
const reDoubledInline = /[*_]/;
const reSingleQuotePrefix = /[-=\s"'`<>\[\](){}+*^$\\.|]$/;
const reListEnd = /^(?:\n|$)/;
const reMkIndent = /^(?!$)/mg;
const codeBlocks = {'`': /^``$/m, '~': /^~~$/m};
const openingParens = {'[': ']', '(': ')', '{': '}', '<': '>'};
const closingParens = {']': '[', ')': '(', '}': '{', '>': '<'};

const enter = (
  options: NormalisedOptions,
  prefix: string,
  selection: string,
  postfix: string,
  evt: KeyboardEvent,
): NewState => {
  const info = !selection ? getLineInfo(prefix) : null;

  if (info) {
    if (info.line && info.line.charAt(info.line.length - 1) in openingParens) {
      const base = (info.prefix ? toIndent(info.prefix, true) : '');
      postfix = "\n" + base + postfix;

      if (!evt.shiftKey) {
        prefix += "\n" + base + options.indent;
      }
    } else if (info.prefix) {
      if (!evt.shiftKey && info.prefix === info.line && reListEnd.test(postfix)) {
        prefix = prefix.substring(0, info.offset) + stripLast(info.prefix);
      } else if (!evt.shiftKey && isList(info.prefix)) {
        prefix += "\n" + increment(info.prefix);
      } else {
        prefix += "\n" + toIndent(info.prefix, evt.shiftKey);
      }
    } else {
      prefix += "\n";
    }
  } else {
    prefix += "\n";
  }

  return {v: prefix + postfix, s: prefix.length};
}

const indent = (
  options: NormalisedOptions,
  prefix: string,
  selection: string,
  postfix: string,
): NewState => {
  let s = prefix.length,
    n = prefix.lastIndexOf("\n") + 1;

  if (n < s) {
    selection = prefix.substring(n) + selection;
    prefix = prefix.substring(0, n);
  }

  if (n < s || !selection) {
    s += options.indent.length;
  }

  if (selection) {
    selection = selection.replace(reMkIndent, options.indent);
  } else {
    prefix += options.indent;
  }

  return {
    v: prefix + selection + postfix,
    s,
    e: selection ? n + selection.length : s,
  };
}

const outdent = (
  options: NormalisedOptions,
  prefix: string,
  selection: string,
  postfix: string,
): NewState => {
  let s = prefix.length,
    n = prefix.lastIndexOf("\n") + 1;

  if (n < s) {
    selection = prefix.substring(n) + selection;
    prefix = prefix.substring(0, n);

    if (selection.substring(0, options.indent.length) === options.indent) {
      s -= options.indent.length;
    }
  }

  selection = selection.replace(options.reOutdent, '');

  return {
    v: prefix + selection + postfix,
    s,
    e: n + selection.length,
  };
}

const inline = (
  options: NormalisedOptions,
  prefix: string,
  selection: string,
  postfix: string,
  evt: KeyboardEvent,
): NewState => {
  if (!selection && !(evt.key in openingParens) && postfix.charAt(0) === evt.key) {
    return {
      v: prefix + (reDoubledInline.test(evt.key) ? evt.key + evt.key : '') + postfix,
      s: prefix.length + 1,
    }
  } else if (!selection && (evt.key === "'" && !reSingleQuotePrefix.test(prefix) || evt.key in closingParens)) {
    return {
      v: prefix + evt.key + postfix,
      s: prefix.length + 1,
    };
  } else if (!selection && evt.key in codeBlocks && codeBlocks[evt.key].test(prefix)) {
    return {
      v: prefix + evt.key + "language\n" + evt.key + evt.key + evt.key + (postfix.charAt(0) !== "\n"
        ? "\n"
        : '') + postfix,
      s: prefix.length + 1,
      e: prefix.length + 9,
    };
  } else if (evt.key === prefix.slice(-1) && evt.key === postfix.slice(0, 1)) {
    return {
      v: prefix.slice(0, -1) + selection + postfix.slice(1),
      s: prefix.length - 1,
      e: prefix.length - 1 + selection.length,
    };
  } else {
    return {
      v: prefix + (closingParens[evt.key] || evt.key) + selection + (openingParens[evt.key] || evt.key) + postfix,
      s: prefix.length + 1,
      e: prefix.length + 1 + selection.length,
    };
  }
}

const actions = {
  enter,
  indent,
  outdent,
  inline,
}

export class MDAreaExtension implements MarkdownAreaExtension {
  private readonly options: NormalisedOptions;

  constructor(options: NormalisedOptions) {
    this.options = options;
  }

  handleKey(
    prefix: string,
    selection: string,
    postfix: string,
    evt: KeyboardEvent,
  ): NewState | undefined {
    const shortcut = this.options.keyMap.find((shortcut) => matchesKey(evt, shortcut.key));

    if (!shortcut || !actions[shortcut.action]) {
      return undefined;
    }

    return actions[shortcut.action](this.options, prefix, selection, postfix, evt);
  }
}

function matchesKey(evt: KeyboardEvent, key: KeyCombo) {
  for (const prop in key) if (key.hasOwnProperty(prop)) {
    if (evt[prop] !== key[prop]) {
      return false;
    }
  }

  return true;
}

function getLineInfo(str: string): LineInfo {
  const offset = str.lastIndexOf("\n") + 1,
    line = str.substring(offset),
    m = rePrefix.exec(line);

  return {
    line,
    offset,
    prefix: m && m[0],
  };
}

function isList(prefix: string): boolean {
  return reList.test(prefix);
}

function toIndent(prefix: string, pure: boolean): string {
  return prefix.replace(pure ? rePureIndent : reCleanIndent, ' ');
}

function increment(prefix: string): string {
  return prefix.replace(reIncrement, function (_, n) {
    return (parseInt(n) + 1) + '.';
  })
}

function stripLast(prefix: string): string {
  return prefix.replace(reStripLast, '');
}
