import {
  KeyCombo, MarkdownAreaActions,
  MarkdownAreaKeymap,
  MarkdownAreaOptions,
  NormalisedKeyMap,
  NormalisedOptions,
} from '../types';
import { handleEnterKey, handleIndentKey, handleInlineKey, handleOutdentKey } from './markdown';

export const isMac = /mac|iphone|ipad|ipod/i.test(navigator.platform);
export const isFfox = /firefox/i.test(navigator.userAgent);
export const ctrlKey = isMac ? 'metaKey' : 'ctrlKey';

const defaultKeymap: MarkdownAreaKeymap = {
  enter: ['Enter', 'Shift+Enter'],
  indent: ['Tab', 'Cmd+m'],
  outdent: ['Shift+Tab', 'Cmd+Shift+m'],
  inline: ['"', "'", '`', '*', '_', '[', ']', '(', ')', '{', '}', '<', '>'],
};

const defaultActions: MarkdownAreaActions = {
  enter: handleEnterKey,
  indent: handleIndentKey,
  outdent: handleOutdentKey,
  inline: handleInlineKey,
};

export function normalizeOptions(options: MarkdownAreaOptions = {}): NormalisedOptions {
  const indent = normalizeIndent(options.indent);

  return {
    indent,
    reOutdent: new RegExp('^' + indent, 'mg'),
    keyMap: normalizeKeyMap(options.keyMap),
    actions: normalizeActions(options.actions),
  }
}

function normalizeKeyMap(keyMap: Partial<MarkdownAreaKeymap> = {}) : NormalisedKeyMap {
  const knownKeys = {};
  const list : NormalisedKeyMap = [];

  for (let action in keyMap) if (keyMap.hasOwnProperty(action)) {
    registerActionKeys(list, knownKeys, action, keyMap[action]);
  }

  for (let action in defaultKeymap) if (defaultKeymap.hasOwnProperty(action)) {
    if (keyMap[action] === undefined) {
      registerActionKeys(list, knownKeys, action, defaultKeymap[action]);
    }
  }

  list.forEach((shortcut) => {
    if (knownKeys[shortcut.key.key] > 1) {
      completeModifiers(shortcut.key);
    }
  });

  return list;
}

function registerActionKeys(
  list: NormalisedKeyMap,
  knownKeys: Record<string, number>,
  action: string,
  keys?: string | string[],
): void {
  if (!Array.isArray(keys)) {
    keys = keys ? keys.toString().trim().split(/\s*[|,]\s*/g) : [];
  }

  keys.length && list.push.apply(list, keys.map((key: string) => {
    const combo = normalizeKey(key);
    combo.key in knownKeys || (knownKeys[combo.key] = 0);
    ++knownKeys[combo.key];

    return { key: combo, action };
  }));
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

function normalizeActions(actions: Partial<MarkdownAreaActions> = {}) : MarkdownAreaActions {
  const map: MarkdownAreaActions = {};

  for (let action in actions) if (actions.hasOwnProperty(action)) {
    const handler = actions[action];

    if (handler !== undefined) {
      map[action] = handler;
    }
  }

  for (let action in defaultActions) if (defaultActions.hasOwnProperty(action)) {
    if (map[action] === undefined) {
      map[action] = defaultActions[action];
    }
  }

  return map;
}

export function matchesKey(evt: KeyboardEvent, key: KeyCombo) {
  for (const prop in key) if (key.hasOwnProperty(prop)) {
    if (evt[prop] !== key[prop]) {
      return false;
    }
  }

  return true;
}
