import {
  KeyCombo,
  MarkdownAreaKeymap,
  MarkdownAreaOptions,
  NormalisedKeyMap,
  NormalisedOptions,
} from '../types';

export const isMac = /mac|iphone|ipad|ipod/i.test(navigator.platform);
export const isFfox = /firefox/i.test(navigator.userAgent);
export const ctrlKey = isMac ? 'metaKey' : 'ctrlKey';

const defaultKeymap: MarkdownAreaKeymap = {
  enter: ['Enter', 'Shift+Enter'],
  indent: ['Tab', 'Cmd+m'],
  outdent: ['Shift+Tab', 'Cmd+Shift+m'],
  inline: ['"', "'", '`', '*', '_', '[', ']', '(', ')', '{', '}', '<', '>'],
};

export function normalizeOptions(options: MarkdownAreaOptions = {}): NormalisedOptions {
  return {
    indent: normalizeIndent(options.indent),
    keyMap: normalizeKeyMap(options.keyMap),
  }
}

function normalizeKeyMap(keyMap: Partial<MarkdownAreaKeymap> = {}) : NormalisedKeyMap {
  const knownKeys = {};
  const list : NormalisedKeyMap = [];

  for (let action in defaultKeymap) if (defaultKeymap.hasOwnProperty(action)) {
    let keys = keyMap[action] || defaultKeymap[action];

    if (!Array.isArray(keys)) {
      keys = keys.toString().trim().split(/\s*[|,]\s*/g);
    }

    list.push.apply(list, keys.map((key: string) => {
      const combo = normalizeKey(key);
      combo.key in knownKeys || (knownKeys[combo.key] = 0);
      ++knownKeys[combo.key];

      return { key: combo, action };
    }));
  }

  list.forEach((shortcut) => {
    if (knownKeys[shortcut.key.key] > 1) {
      completeModifiers(shortcut.key);
    }
  });

  return list;
}

function normalizeKey(key: string) : KeyCombo {
  const opts: KeyCombo = {} as any;

  key.trim().split(/\s*\+\s*/g).forEach(function(k) {
    switch (k.toLowerCase()) {
      case 'cmd':
        opts[ctrlKey] = true;
        break;
      case 'ctrl':
      case 'alt':
      case 'shift':
      case 'meta':
        opts[k.toLowerCase() + 'Key'] = true;
        break;
      default:
        opts.key = k;
    }
  });

  return opts;
}

function completeModifiers(key: KeyCombo) : void {
  'ctrlKey' in key || (key.ctrlKey = false);
  'altKey' in key || (key.altKey = false);
  'shiftKey' in key || (key.shiftKey = false);
  'metaKey' in key || (key.metaKey = false);
}

function normalizeIndent(indent: string | number = 4) : string {
  if (typeof indent !== 'number') {
    indent = (indent + '').length;
  }

  return new Array(indent + 1).join(' ');
}

export function matchesKey(evt: KeyboardEvent, key: KeyCombo) {
  for (const prop in key) if (key.hasOwnProperty(prop)) {
    if (evt[prop] !== key[prop]) {
      return false;
    }
  }

  return true;
}
