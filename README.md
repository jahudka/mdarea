# The tiniest Markdown editor for the web

This project provides the simplest imaginable writing aid
for Markdown-enabled `<textarea>` elements.

It only supports a handful of features, mostly to save you keystrokes.
There's no GUI, no WYSIWYG features, and no preview.

It is also quite small at 2.5 KB minified & gzipped.

Check out the [demo]!

# Installation

```bash
npm install --save mdarea
```

Or you can download the raw archive from the [Releases] section.

Add the `mdarea.js` or `mdarea.min.js` script to your page. You might
need to use something like the [keyboardevent-key-polyfill] if you wish
to support older browsers.

Since version 2.0 `mdarea` is written in TypeScript and therefore includes
native typings out of the box. The package exposes the editor class
as the default export and type declarations for the options object
are available as named exports:

```typescript
import MarkdownArea, { EditorOptions } from 'mdarea';
```

Initialise your textareas like this:

```html
<textarea id="mdarea"></textarea>

<script type="application/javascript">
    var editor = new MarkdownArea(document.getElementById('mdarea'));
</script>
```

# API

 - `new MarkdownArea(element[, options])`

   Creates a new editor instance for the given element. See below
   for the constructor options.

 - `editor.getElement()`

   Returns the DOM element the editor instance is attached to.

 - `editor.setElement(element)`

   Reattaches the editor instance to another textarea element.

 - `editor.getValue()`

   Returns the current contents of the editor. Same as `editor.getElement().value`.

 - `editor.setValue(value)`

   Sets the editor contents. Use this instead of `editor.getElement().value = value`,
   otherwise undo history will break!

 - `editor.destroy()`

   Destroys the editor instance. This will unbind all event handlers
   and nullify all references to objects which might keep the editor
   in memory including the active textarea element. Remember to clear
   the reference to the editor instance that you kept until calling the
   `destroy()` method - the easiest way to do so is to call `destroy()`
   like this:
   ```javascript
   editor = editor.destroy();
   ```

# Constructor options

 - `indent` (`number | string`, default: `4`)

   How many spaces to use for indentation. If you specify a string,
   its length will be used - beware that the tab character has
   a length of 1!

 - `keyMap` (`object`)

   Lets you customize the default key mapping of the editor.
   The keys of the object are action names, and the values
   are the key combinations as either comma-separated strings
   or arrays. See below for an explanation of the known actions
   and the default key combinations attached to them.

# Key bindings

Shortcuts in the `keyMap` are specified as strings (or arrays
thereof). Each shortcut is a combination of zero or more _modifiers_
and a single _key_, separated by `+`. There are five supported modifiers:
`Ctrl`, `Shift`, `Alt`, `Meta` and `Cmd`. The `Cmd` modifier
represents the `Cmd` key on a Mac and the `Ctrl` key otherwise;
the `Ctrl` modifier always means the `Ctrl` key and the `Meta`
modifier always means the `Windows` / `Cmd` meta key. You'll
probably always want to use the `Cmd` modifier in place of `Ctrl`
or `Meta`. The _key_ should be one of the [known key values].
Note that regular character keys `a` to `z` should be specified
in lowercase, regardless of the presence or absence of the
`Shift` modifier.

The four currently supported actions of the editor are:

 - `enter` (default keys: `Enter`, `Shift+Enter`)

   This action takes care of smart `Enter` key handling.
   Invoked inside of a list item it will insert a new item
   at the current level, incrementing its number if applicable,
   or an indented newline within the current item if the `Shift`
   key is pressed. If invoked at the start of an empty list item
   it will remove the current item and place the cursor at the
   start of the line (exit the list, similarly to visual document
   editors). If invoked after an opening parenthesis an indented
   newline is inserted, similarly to common code editors.

 - `inline` (default keys: `"`, `'`, `` ` ``, `*`, `_`, `[`, `]`, `(`, `)`, `{`, `}`, `<`, `>`)

   This action inserts smart pairs of inline formatting characters.
   If the current selection is already surrounded by a formatting
   character and this action is invoked with the same character,
   the existing characters are removed (so selecting a word and
   pressing `*` will behave as "toggle bold").

 - `indent` (default keys: `Tab`, `Ctrl+m`)

   This action indents the current line or the currently selected
   block of text. Note that the default key mapping for this action
   includes the `Tab` key, which will prevent navigation between
   form elements once the editor gains focus.

 - `outdent` (default keys: `Shift+Tab`, `Ctrl+Shift+m`)

   This action performs the inverse of `indent`. The `Shift+Tab`
   default mapping will also similarly hamper form navigation.


[Releases]: https://github.com/jahudka/mdarea/releases
[demo]: https://jahudka.github.io/mdarea
[keyboardevent-key-polyfill]: https://github.com/cvan/keyboardevent-key-polyfill
[known key values]: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values
