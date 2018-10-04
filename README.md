# The tiniest Markdown editor for the web

This project provides the simplest imaginable writing aid
for Markdown-enabled `<textarea>` elements.

It only supports a handful of features, mostly to save you keystrokes.
There's no GUI, no WYSIWYG features, and no preview.

It is also quite small at 1.33 KB gzipped.

Check out the [demo]!

# Installation

```bash
npm install mdarea
```

Or you can download the raw archive from the [Releases] section.

Add the `mdarea.js` or `mdarea.min.js` script to your page. You might
need to use something like the [keyboardevent-key-polyfill] if you wish
to support older browsers.

Initialise your textareas like this:

```html
<textarea id="mdarea"></textarea>

<script type="application/javascript">
    var editor = new MarkdownArea(document.getElementById('mdarea'));
</script>

```

# API

 - ### `editor.getElement()`
   Returns the DOM element the editor instance is attached to.

 - ### `editor.setElement(element)`
   Reattaches the editor instance to another textarea element.

 - ### `editor.getValue()`
   Returns the current contents of the editor. Same as `editor.getElement().value`.

 - ### `editor.setValue(value)`
   Sets the editor contents. Same as `editor.getElement().value = value`.

 - ### `editor.getIndent()`
   Returns the string currently used for indentation. Defaults to four spaces.

 - ### `editor.setIndent(indent)`
   Sets the string the editor will use for indentation. Passing a Number
   will make the editor use that many spaces for indentation. Any other
   value will be converted to a string and all characters other than
   spaces and tabs will be converted to spaces.

 - ### `editor.isTabUsed()`
   Checks whether the editor uses the `Tab` key for indentation. On by default.

 - ### `editor.useTab()`
   Makes the editor handle the `Tab` key and use it for indentation (`Tab`
   to indent selection, `Shift+Tab` to outdent). The user won't be able
   to tab out of the textarea once it's focused.

 - ### `editor.ignoreTab()`
   Makes the editor ignore the `Tab` key. Indentation is still possible
   using the `Ctrl+I` and `Ctrl+O` key combination (`Cmd+I` and `Cmd+O`
   on a Mac).

 - ### `editor.isInlineEnabled()`
   Checks whether inline helpers are enabled. On by default.

 - ### `editor.enableInline()`
   Enables inline helpers (insert pair `` ` ``, `*` and `_` characters
   and automatically insert closing parentheses).

 - ### `editor.disableInline()`
   Disables inline helpers.

 - ### `editor.destroy()`
   Destroys the editor instance. This will unbind the keydown event handler
   and nullify all references to objects which might keep the editor
   in memory including the active textarea element. Remember to clear
   the reference to the editor instance that you kept until calling the
   `destroy()` method - the easiest way to do so is to call `destroy()`
   like this:
   ```javascript
   editor = editor.destroy();
   ```



[Releases]: https://github.com/jahudka/mdarea/releases
[demo]: https://jahudka.github.io/mdarea
[keyboardevent-key-polyfill]: https://github.com/cvan/keyboardevent-key-polyfill
