const path = require('path');

// Load root .env before Babel transforms (used to inline MERCHANT_PORTAL_URL)
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      [
        'babel-plugin-transform-inline-environment-variables',
        {
          include: ['MERCHANT_PORTAL_URL', 'STORE_SIGNUP_URL'],
        },
      ],
    ],
  };
};
