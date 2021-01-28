(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.MarkdownArea = factory());
}(this, (function () { 'use strict';

    const rePrefix = /^[ \t]*(?:(?:[-+*]|\d+\.)[ \t]+(?:\[[ x]][ \t]+)?|>[ \t]*)*(?::[ \t]*)?/;
    const reList = /(?:[-+*]|\d+\.)[ \t]+(?:\[[ x]][ \t]+)?$/;
    const reCleanIndent = /[-+*\[\]x\d.]/g;
    const rePureIndent = /[^ \t]/g;
    const reIncrement = /(\d+)\.(?=[ \t]+$)/;
    const reStripLast = /(?:(?:^[ \t]+)?(?:[-+*]|\d+\.|[>:])(?:[ \t]+\[[ x]])?[ \t]*|^[ \t]+)$/;
    function getLineInfo(str) {
        const offset = str.lastIndexOf("\n") + 1, line = str.substring(offset), m = rePrefix.exec(line);
        return {
            line,
            offset,
            prefix: m && m[0]
        };
    }
    function isList(prefix) {
        return reList.test(prefix);
    }
    function toIndent(prefix, pure) {
        return prefix.replace(pure ? rePureIndent : reCleanIndent, ' ');
    }
    function increment(prefix) {
        return prefix.replace(reIncrement, function (_, n) {
            return (parseInt(n) + 1) + '.';
        });
    }
    function stripLast(prefix) {
        return prefix.replace(reStripLast, '');
    }

    const isMac = /mac|iphone|ipad|ipod/i.test(navigator.platform);
    const isFfox = /firefox/i.test(navigator.userAgent);
    const ctrlKey = isMac ? 'metaKey' : 'ctrlKey';
    const defaultKeymap = {
        enter: ['Enter', 'Shift+Enter'],
        indent: ['Tab', 'Cmd+m'],
        outdent: ['Shift+Tab', 'Cmd+Shift+m'],
        inline: ['"', "'", '`', '*', '_', '[', ']', '(', ')', '{', '}', '<', '>'],
    };
    function normalizeOptions(options = {}) {
        return {
            indent: normalizeIndent(options.indent),
            keyMap: normalizeKeyMap(options.keyMap),
        };
    }
    function normalizeKeyMap(keyMap = {}) {
        const knownKeys = {};
        const list = [];
        for (let action in defaultKeymap)
            if (defaultKeymap.hasOwnProperty(action)) {
                let keys = keyMap[action] || defaultKeymap[action];
                if (!Array.isArray(keys)) {
                    keys = keys.toString().trim().split(/\s*[|,]\s*/g);
                }
                list.push.apply(list, keys.map((key) => {
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
    function normalizeKey(key) {
        const opts = {};
        key.trim().split(/\s*\+\s*/g).forEach(function (k) {
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
    function completeModifiers(key) {
        'ctrlKey' in key || (key.ctrlKey = false);
        'altKey' in key || (key.altKey = false);
        'shiftKey' in key || (key.shiftKey = false);
        'metaKey' in key || (key.metaKey = false);
    }
    function normalizeIndent(indent = 4) {
        if (typeof indent !== 'number') {
            indent = (indent + '').length;
        }
        return new Array(indent + 1).join(' ');
    }
    function matchesKey(evt, key) {
        for (const prop in key)
            if (key.hasOwnProperty(prop)) {
                if (evt[prop] !== key[prop]) {
                    return false;
                }
            }
        return true;
    }

    const reDoubledInline = /[*_]/;
    const reSingleQuotePrefix = /[-=\s"'`<>\[\](){}+*^$\\.|]$/;
    const reListEnd = /^(?:\n|$)/;
    const reMkIndent = /^(?!$)/mg;
    const codeBlocks = { '`': /^``$/m, '~': /^~~$/m };
    const openingParens = { '[': ']', '(': ')', '{': '}', '<': '>' };
    const closingParens = { ']': '[', ')': '(', '}': '{', '>': '<' };
    function createHelper() {
        const helper = document.createElement('pre');
        helper.setAttribute('aria-hidden', 'true');
        helper.tabIndex = -1;
        helper.contentEditable = true;
        helper.textContent = '';
        helper.addEventListener('focus', () => setTimeout(() => helper.blur(), 0));
        helper.style.position = 'fixed';
        helper.style.overflow = helper.style.visibility = 'hidden';
        helper.style.left = '-1000px';
        helper.style.top = '50%';
        helper.style.width = helper.style.height = '1px';
        helper.style.opacity = '0';
        return helper;
    }
    function handleKey(ed, evt) {
        if (!ed.elem || evt.defaultPrevented) {
            return;
        }
        if (isFfox && evt[ctrlKey] && evt.key === 'z') {
            ed.elem.blur();
        }
        const shortcut = ed.options.keyMap.find((shortcut) => matchesKey(evt, shortcut.key));
        if (!shortcut) {
            return;
        }
        const state = extractState(ed.elem);
        const prefix = state.v.substring(0, state.s), selection = state.v.substring(state.s, state.e), postfix = state.v.substring(state.e);
        switch (shortcut.action) {
            case 'enter':
                handleEnterKey(ed, prefix, selection, postfix, evt.shiftKey);
                break;
            case 'indent':
                handleIndentKey(ed, prefix, selection, postfix);
                break;
            case 'outdent':
                handleOutdentKey(ed, prefix, selection, postfix);
                break;
            case 'inline':
                handleInlineKey(ed, prefix, selection, postfix, evt.key);
                break;
        }
        evt.preventDefault();
    }
    function handleEnterKey(ed, prefix, selection, postfix, shiftKey) {
        const info = !selection ? getLineInfo(prefix) : null;
        if (info) {
            if (info.line && info.line.charAt(info.line.length - 1) in openingParens) {
                const base = (info.prefix ? toIndent(info.prefix, true) : '');
                postfix = "\n" + base + postfix;
                if (!shiftKey) {
                    prefix += "\n" + base + ed.options.indent;
                }
            }
            else if (info.prefix) {
                if (!shiftKey && info.prefix === info.line && reListEnd.test(postfix)) {
                    prefix = prefix.substring(0, info.offset) + stripLast(info.prefix);
                }
                else if (!shiftKey && isList(info.prefix)) {
                    prefix += "\n" + increment(info.prefix);
                }
                else {
                    prefix += "\n" + toIndent(info.prefix, shiftKey);
                }
            }
            else {
                prefix += "\n";
            }
        }
        else {
            prefix += "\n";
        }
        pushState(ed, prefix + postfix, prefix.length);
    }
    function handleIndentKey(ed, prefix, selection, postfix) {
        let s = prefix.length, n = prefix.lastIndexOf("\n") + 1;
        if (n < s) {
            selection = prefix.substring(n) + selection;
            prefix = prefix.substring(0, n);
        }
        if (n < s || !selection) {
            s += ed.options.indent.length;
        }
        if (selection) {
            selection = selection.replace(reMkIndent, ed.options.indent);
        }
        else {
            prefix += ed.options.indent;
        }
        pushState(ed, prefix + selection + postfix, s, selection ? n + selection.length : s);
    }
    function handleOutdentKey(ed, prefix, selection, postfix) {
        let s = prefix.length, n = prefix.lastIndexOf("\n") + 1;
        if (n < s) {
            selection = prefix.substring(n) + selection;
            prefix = prefix.substring(0, n);
            if (selection.substring(0, ed.options.indent.length) === ed.options.indent) {
                s -= ed.options.indent.length;
            }
        }
        selection = selection.replace(ed.reOutdent, '');
        pushState(ed, prefix + selection + postfix, s, n + selection.length);
    }
    function handleInlineKey(ed, prefix, selection, postfix, key) {
        if (!selection && !(key in openingParens) && postfix.charAt(0) === key) {
            pushState(ed, prefix + (reDoubledInline.test(key) ? key + key : '') + postfix, prefix.length + 1);
        }
        else if (!selection && (key === "'" && !reSingleQuotePrefix.test(prefix) || key in closingParens)) {
            pushState(ed, prefix + key + postfix, prefix.length + 1);
        }
        else if (!selection && key in codeBlocks && codeBlocks[key].test(prefix)) {
            pushState(ed, prefix + key + "language\n" + key + key + key + (postfix.charAt(0) !== "\n" ? "\n" : '') + postfix, prefix.length + 1, prefix.length + 9);
        }
        else if (key === prefix.slice(-1) && key === postfix.slice(0, 1)) {
            pushState(ed, prefix.slice(0, -1) + selection + postfix.slice(1), prefix.length - 1, prefix.length - 1 + selection.length);
        }
        else {
            pushState(ed, prefix + (closingParens[key] || key) + selection + (openingParens[key] || key) + postfix, prefix.length + 1, prefix.length + 1 + selection.length);
        }
    }
    function pushState(ed, v, s, e = s) {
        ed.lock = true;
        ed.helper.style.visibility = '';
        const state = {
            s,
            e,
            v,
            x: ed.elem.scrollLeft,
            y: ed.elem.scrollTop,
        };
        ensureInit(ed);
        writeState(ed.helper, state);
        applyState(ed.elem, state);
        ed.helper.style.visibility = 'hidden';
        ed.lock = false;
    }
    function handleInput(ed, evt) {
        if (ed.lock) {
            return;
        }
        ed.lock = true;
        const state = extractState(ed.elem);
        evt.preventDefault();
        document.execCommand('undo');
        ensureInit(ed);
        writeState(ed.helper, state);
        applyState(ed.elem, state);
        ed.lock = false;
    }
    function handleUndo(ed) {
        if (ed.lock) {
            return;
        }
        const state = readState(ed.helper);
        if (!state) {
            ed.elem.focus();
            return;
        }
        ed.lock = true;
        applyState(ed.elem, state);
        ed.lock = false;
    }
    function ensureInit(ed) {
        if (!ed.init) {
            ed.init = true;
            writeState(ed.helper, extractState(ed.elem));
        }
    }
    function extractState(elem) {
        return {
            s: elem.selectionStart,
            e: elem.selectionEnd,
            x: elem.scrollLeft,
            y: elem.scrollTop,
            v: elem.value.replace(/\u00A0/g, ' '),
        };
    }
    function applyState(elem, state) {
        elem.value = state.v;
        elem.selectionStart = state.s;
        elem.selectionEnd = state.e;
        elem.scrollTo(state.x, state.y);
        elem.focus();
    }
    function readState(helper) {
        return JSON.parse(helper.textContent || 'null');
    }
    function writeState(helper, state) {
        helper.focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, JSON.stringify(state));
    }

    class MarkdownArea {
        constructor(elem, maybeOptions) {
            const options = normalizeOptions(maybeOptions);
            const editor = this.ed = {
                elem,
                options,
                helper: createHelper(),
                reOutdent: new RegExp('^' + options.indent, 'mg'),
                init: false,
                lock: false,
            };
            editor.onInput = handleInput.bind(null, editor);
            editor.onKeyDown = handleKey.bind(null, editor);
            editor.onUndo = handleUndo.bind(null, editor);
            editor.helper.addEventListener('input', editor.onUndo);
            document.body.appendChild(editor.helper);
            this.setElement(elem);
        }
        getElement() {
            return this.ed.elem;
        }
        setElement(elem) {
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
        getValue() {
            return this.ed.elem.value.replace(/\u00A0/g, ' ');
        }
        setValue(value, keepUndo = false) {
            this.ed.elem.value = value;
            if (!keepUndo) {
                this.ed.helper.textContent = '';
                this.ed.init = false;
            }
        }
        destroy() {
            this.ed.elem.removeEventListener('keydown', this.ed.onKeyDown);
            this.ed.elem.removeEventListener('input', this.ed.onInput);
            this.ed.helper.removeEventListener('input', this.ed.onUndo);
            document.body.removeChild(this.ed.helper);
            Object.assign(this.ed, { elem: null, helper: null, options: null, reOutdent: null, onKeyDown: null, onInput: null, onUndo: null });
            Object.assign(this, { ed: null });
            return null;
        }
    }

    return MarkdownArea;

})));
//# sourceMappingURL=index.js.map
