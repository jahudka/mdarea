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
        reInlineKey = /^["'`*_[({<>})\]]$/,
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


    function MarkdownArea(elem) {
        this._useTab = true;
        this._useInline = true;
        this._indent = '    ';
        this._reOutdent = /^[ ]{4}/mg;
        this._reKey = makeKeyRe(true, true);
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

        getIndent: function () {
            return this._indent;
        },

        setIndent: function (indent) {
            if (typeof indent === 'number') {
                this._indent = new Array(indent + 1).join(' ');
            } else {
                this._indent = (indent + '').replace(/[^ \t]/g, ' ');
            }

            this._reOutdent = new RegExp('^' + this._indent, 'mg');
        },

        isTabUsed: function () {
            return this._useTab;
        },

        useTab: function () {
            this._useTab = true;
            this._reKey = makeKeyRe(true, this._useInline);
        },

        ignoreTab: function () {
            this._useTab = false;
            this._reKey = makeKeyRe(false, this._useInline);
        },

        isInlineEnabled: function() {
            return this._useInline;
        },

        enableInline: function () {
            this._useInline = true;
            this._reKey = makeKeyRe(this._useTab, true);
        },

        disableInline: function () {
            this._useInline = false;
            this._reKey = makeKeyRe(this._useTab, false);
        },

        destroy: function () {
            this._elem.removeEventListener('keydown', this._handleKey);
            this._elem = this._reKey = this._handleKey = this._indent = this._reOutdent = null;
        },

        _handleKey: function (evt) {
            if (this._reKey.test(evt.key)) {
                var prefix = evt.target.value.substring(0, evt.target.selectionStart),
                    selection = evt.target.value.substring(evt.target.selectionStart, evt.target.selectionEnd),
                    postfix = evt.target.value.substring(evt.target.selectionEnd);

                if (evt.key === 'Enter' && !evt.ctrlKey && !evt.altKey && !evt.metaKey) {
                    handleEnterKey(this._elem, prefix, selection, postfix, evt.shiftKey);
                } else if (evt.key === 'Tab' && !evt.shiftKey || evt.key === 'i' && evt[ctrlKey]) {
                    handleIndentKey(this._elem, prefix, selection, postfix, this._indent);
                } else if (evt.key === 'Tab' && evt.shiftKey || evt.key === 'o' && evt[ctrlKey]) {
                    handleOutdentKey(this._elem, prefix, selection, postfix, this._indent, this._reOutdent);
                } else if (reInlineKey.test(evt.key)) {
                    handleInlineKey(this._elem, prefix, selection, postfix, evt.key);
                } else {
                    return;
                }

                evt.preventDefault();
            }
        }
    };


    function makeKeyRe(tab, inline) {
        return new RegExp('^(?:Enter' + (tab ? '|Tab' : '') + '|[io' + (inline ? '"\'`*_([{<>}\\])' : '') + '])$');
    }


    function handleEnterKey (elem, prefix, selection, postfix, shift) {
        var info = !selection ? getLineInfo(prefix) : null;

        if (!selection && info.prefix) {
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
        } else if (!selection && key in closingParens) {
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
