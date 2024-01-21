/* eslint-disable import/order */

// Import Joi extensions.

const JoiDate = require("@hapi/joi-date");

const JoiHtmlStrip = require("./htmlStrip");

// Set Joi defaults.

// const messages = require('./joiTranslation.json');

const Joi = require("joi").defaults((schema) =>
  schema.options({
    abortEarly: false,
    // messages,
    errors: { language: "en" },
  })
);

// Apply extensions.

const JoiLib = Joi.extend(JoiDate).extend(JoiHtmlStrip);

const getCommaSeparatedErrors = (joiErrors) => {
  let msg = "Validation errors: ";
  joiErrors.details.forEach((error) => console.log(error));
  joiErrors.details.forEach((error) => {
    const message = error?.context?.message
      ? error.context.message
      : error.message;
    msg = `${msg + message}. `;
  });
  return msg;
};

const validate = (fields, validationFields, validationConfig = {}) => {
  const {
    abortEarly = false, // include all errors
    allowUnknown = true, // ignore unknown props
    stripUnknown = false, // false: don't remove unknown props
  } = validationConfig;

  const validationSchema = JoiLib.object(validationFields);

  const { error, value } = validationSchema.validate(fields, {
    abortEarly,
    allowUnknown,
    stripUnknown,
  });

  let commaSeparatedErrors = null;

  if (error) {
    commaSeparatedErrors = getCommaSeparatedErrors(error);
  }

  return { joiErrors: error, commaSeparatedErrors, transformedFields: value };
};

module.exports = {
  JoiLib,
  validate,
};
