# Moment.js bundle size optimization

If you require `moment.js` in your client-side code `webpack` will put all of `moment.js`'s locale files into your bundle (over 90 different locales). This causes a significant bundle increase and it's usually unnecessary.

To avoid it, we're changing it so a require to `moment.js` will only load `moment.js` without any locales. If you need to have some of it's locales, you can require them yourself like that:

```js
const moment = require('moment');
require('moment/locale/ja');

moment.locale('ja');
...
```

To avoid breaking existing projects, we're will only do the previous optimization if you tell us to by configuring `yoshi`:

```json
{
  "yoshi": {
    "optimizeMoment": true
  }
}
```

***Please enable it and adjust your code, because those changes will be applied to all projects soon.***

You can read more about it here: https://github.com/jmblog/how-to-optimize-momentjs-with-webpack/blob/master/README.md


