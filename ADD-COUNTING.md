# Visit counting

Page views are counted with the shared GoatCounter account (`hbedle`, https://hbedle.goatcounter.com), the same account used by the other teaching repos.

`js/main.js` adds the standard GoatCounter `count.js` tag at load, and only when the page is served from `github.io`, so local testing and the pop-out windows are not counted:

```js
const s = document.createElement('script');
s.async = true;
s.dataset.goatcounter = 'https://hbedle.goatcounter.com/count';
s.src = '//gc.zgo.at/count.js';
document.head.appendChild(s);
```

If the shared procedure calls for a static tag, this is the equivalent line for `index.html`:

```html
<script data-goatcounter="https://hbedle.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
```
