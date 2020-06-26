(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.MarkdownArea = factory();
    }
})(typeof self !== 'undefined' ? self : this, function() {

    var isMac = /mac|iphone|ipad|ipod/i.test(navigator.platform),
        ctrlKey = isMac ? 'metaKey' : 'ctrlKey',
        reDoubledInline = /[*_]/,
        rePrefix = /^[ \t]*(?:(?:[-+*]|\d+\.)[ \t]+(?:\[[ x]][ \t]+)?|>[ \t]*)*(?::[ \t]*)?/,
        reList = /(?:[-+*]|\d+\.)[ \t]+(?:\[[ x]][ \t]+)?$/,
        reCleanIndent = /[-+*\[\]x\d.]/g,
        rePureIndent = /[^ \t]/g,
        reIncrement = /(\d+)\.(?=[ \t]+$)/,
        reStripLast = /(?:(?:^[ \t]+)?(?:[-+*]|\d+\.|[>:])(?:[ \t]+\[[ x]])?[ \t]*|^[ \t]+)$/,
        reMkIndent = /^(?!$)/mg,
        codeBlocks = {'`': /^``$/m, '~': /^~~$/m},
        openingParens = {'[': ']', '(': ')', '{': '}', '<': '>'},
        closingParens = {']': '[', ')': '(', '}': '{', '>': '<'};

    var defaultKeymap = {
        enter: ['Enter', 'Shift+Enter'],
        indent: ['Tab', 'Ctrl+m'],
        outdent: ['Shift+Tab', 'Ctrl+Shift+m'],
        inline: ['"', "'", '`', '*', '_', '[', ']', '(', ')', '{', '}', '<', '>'],
    };


    function MarkdownArea(elem, options) {
        this._options = normalizeOptions(options);
        this._reOutdent = new RegExp('^' + this._options.indent, 'mg');
        this._handleKey = this._handleKey.bind(this);
        this.setElement(elem);
    }

    MarkdownArea.prototype = {
        constructor: MarkdownArea,

        getElement: function () {
            return this._elem;
        },

        setElement: function (elem) {
            if (this._elem) {
                this._elem.removeEventListener('keydown', this._handleKey);
            }

            this._elem = elem;
            elem.addEventListener('keydown', this._handleKey);
        },

        getValue: function () {
            return this._elem.value;
        },

        setValue: function (value) {
            this._elem.value = value;
        },

        destroy: function () {
            this._elem.removeEventListener('keydown', this._handleKey);
            this._elem = this._options = this._reOutdent = this._handleKey = null;
        },

        _handleKey: function (evt) {
            if (!evt.defaultPrevented) {
                var shortcut = this._options.keyMap.find(function(shortcut) {
                    return matchesKey(evt, shortcut.key);
                });

                if (shortcut) {
                    var prefix = evt.target.value.substring(0, evt.target.selectionStart),
                        selection = evt.target.value.substring(evt.target.selectionStart, evt.target.selectionEnd),
                        postfix = evt.target.value.substring(evt.target.selectionEnd);

                    switch (shortcut.action) {
                        case 'enter':
                            handleEnterKey(this._elem, prefix, selection, postfix, this._options.indent, evt.shiftKey);
                            break;
                        case 'indent':
                            handleIndentKey(this._elem, prefix, selection, postfix, this._options.indent);
                            break;
                        case 'outdent':
                            handleOutdentKey(this._elem, prefix, selection, postfix, this._options.indent, this._reOutdent);
                            break;
                        case 'inline':
                            handleInlineKey(this._elem, prefix, selection, postfix, evt.key);
                            break;
                    }

                    evt.preventDefault();
                }
            }
        }
    };

    function normalizeOptions(options) {
        options || (options = {});
        options.keyMap = normalizeKeyMap(options.keyMap);
        options.indent = normalizeIndent(options.indent || '    ');
        return options;
    }

    function normalizeKeyMap(keyMap) {
        keyMap || (keyMap = {});
        var knownKeys = {};
        var list = [];

        for (var action in defaultKeymap) if (defaultKeymap.hasOwnProperty(action)) {
            var keys = keyMap[action] || defaultKeymap[action];

            if (!Array.isArray(keys)) {
                keys = keys.toString().trim().split(/\s*[|,]\s*/g);
            }

            list.push.apply(list, keys.map(function(key) {
                key = normalizeKey(key);
                key.key in knownKeys || (knownKeys[key.key] = 0);
                ++knownKeys[key.key];

                return {
                    key: key,
                    action: action
                };
            }));
        }

        list.forEach(function(shortcut) {
            if (knownKeys[shortcut.key.key] > 1) {
                completeModifiers(shortcut.key);
            }
        });

        return list;
    }

    function normalizeKey(key) {
        var opts = {};

        key.trim().split(/\s*\+\s*/g).forEach(function(k) {
            switch (k.toLowerCase()) {
                case 'ctrl':
                case 'cmd':
                    opts[ctrlKey] = true;
                    break;
                case 'shift':
                    opts.shiftKey = true;
                    break;
                case 'alt':
                    opts.altKey = true;
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

    function normalizeIndent(indent) {
        if (typeof indent === 'number') {
            return new Array(indent + 1).join(' ');
        } else {
            return (indent + '').replace(/[^ \t]/g, ' ');
        }
    }

    function matchesKey(evt, key) {
        for (var prop in key) if (key.hasOwnProperty(prop)) {
            if (evt[prop] !== key[prop]) {
                return false;
            }
        }

        return true;
    }

    function handleEnterKey (elem, prefix, selection, postfix, indent, shift) {
        var info = !selection ? getLineInfo(prefix) : null;

        if (!selection) {
            if (info.line && info.line.charAt(info.line.length - 1) in openingParens) {
                var base = (info.prefix ? toIndent(info.prefix, true) : '');
                postfix = "\n" + base + postfix;

                if (!shift) {
                    prefix += "\n" + base + indent;
                }
            } else if (info.prefix) {
                if (!shift && info.prefix === info.line) {
                    prefix = prefix.substring(0, info.offset) + stripLast(info.prefix);
                } else if (!shift && isList(info.prefix)) {
                    prefix += "\n" + increment(info.prefix);
                } else {
                    prefix += "\n" + toIndent(info.prefix, shift);
                }
            } else {
                prefix += "\n";
            }
        } else {
            prefix += "\n";
        }

        apply(elem, prefix + postfix, prefix.length);
    }

    function handleIndentKey (elem, prefix, selection, postfix, indent) {
        var s = prefix.length,
            n = prefix.lastIndexOf("\n") + 1;

        if (n < s) {
            selection = prefix.substring(n) + selection;
            prefix = prefix.substring(0, n);
        }

        if (n < s || !selection) {
            s += indent.length;
        }

        if (selection) {
            selection = selection.replace(reMkIndent, indent);
        } else {
            prefix += indent;
        }

        apply(elem, prefix + selection + postfix, s, selection ? n + selection.length : s);
    }

    function handleOutdentKey (elem, prefix, selection, postfix, indent, reOutdent) {
        var s = prefix.length,
            n = prefix.lastIndexOf("\n") + 1;

        if (n < s) {
            selection = prefix.substring(n) + selection;
            prefix = prefix.substring(0, n);

            if (selection.substring(0, indent.length) === indent) {
                s -= indent.length;
            }
        }

        selection = selection.replace(reOutdent, '');
        apply(elem, prefix + selection + postfix, s, n + selection.length);
    }

    function handleInlineKey (elem, prefix, selection, postfix, key) {
        if (!selection && !(key in openingParens) && postfix.charAt(0) === key) {
            apply(elem, prefix + (reDoubledInline.test(key) ? key + key : '') + postfix, prefix.length + 1);
        } else if (!selection && (key === "'" || key in closingParens)) {
            apply(elem, prefix + key + postfix, prefix.length + 1);
        } else if (!selection && key in codeBlocks && codeBlocks[key].test(prefix)) {
            apply(elem, prefix + key + "language\n" + key + key + key + (postfix.charAt(0) !== "\n" ? "\n" : '') + postfix, prefix.length + 1, prefix.length + 9);
        } else {
            apply(
                elem,
                prefix + (closingParens[key] || key) + selection + (openingParens[key] || key) + postfix,
                prefix.length + 1,
                prefix.length + 1 + selection.length
            );
        }
    }

    function apply(elem, value, s, e) {
        elem.value = value;
        elem.selectionStart = s;
        elem.selectionEnd = arguments.length > 3 ? e : s;

        if ('InputEvent' in window) try {
            var evt = new InputEvent('input');
            elem.dispatchEvent(evt);
        } catch (e) { }
    }

    function getLineInfo(str) {
        var offset = str.lastIndexOf("\n") + 1,
            line = str.substring(offset),
            m = rePrefix.exec(line);

        return {
            line: line,
            offset: offset,
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
        })
    }

    function stripLast(prefix) {
        return prefix.replace(reStripLast, '');
    }


    return MarkdownArea;

});
