const sanitizeHtml = require("sanitize-html");

module.exports = function htmlStrip(joi) {
  return {
    type: "string",
    base: joi.string(),
    messages: {
      "string.htmlStrip": "{{#label}} must not include HTML",
    },
    rules: {
      htmlStrip: {
        validate(value, helpers) {
          const clean = sanitizeHtml(value, {
            allowedTags: [],
            allowedAttributes: {},
          });
          return clean;
        },
      },
    },
  };
};
