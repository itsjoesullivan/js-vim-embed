#Embed js-vim on your site (in progress)

N.B. this is a doc for code that doesn't yet exist.

1. Create an target element
2. Include vim.js
3. Invoke vim.edit, passing the id of the element.

```html
<div id="vim"></div>
<script src="http://itsjoesullivan.github.io/js-vim-embed/vim.min.js"></script>
```
```javascript
vim.edit('vim');
```
