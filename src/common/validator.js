/* eslint-disable import/order */
const JoiDate = require("@hapi/joi-date");
// const messages = require('./joiTranslation.json');
const Joi = require("joi").defaults((schema) =>
  schema.options({
    abortEarly: false,
    // messages,
    errors: { language: "en" },
  })
);

const JoiLib = Joi.extend(JoiDate);

const validateRequest = (req, validationFields) => {
  const validationConfig = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown props
    stripUnknown: false, // false: don't remove unknown props
  };
  const validationSchema = JoiLib.object(validationFields);
  const { error, value } = validationSchema.validate(
    req.body,
    validationConfig
  );
  console.log({ error, value });
  return { error, value };
};

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

const validate = (req, validationFields) => {
  const validationConfig = {
    abortEarly: false, // include all errors
    allowUnknown: true, // ignore unknown props
    stripUnknown: false, // false: don't remove unknown props
  };
  const validationSchema = JoiLib.object(validationFields);
  const { error, value } = validationSchema.validate(req, validationConfig);
  console.log({ error, value });

  let errorsText = null;
  if (error) {
    errorsText = getCommaSeparatedErrors(error);
  }
  return { error, value, errorsText };
};

module.exports = {
  validateRequest,
  getCommaSeparatedErrors,
  JoiLib,
  joi: {
    validate,
  },
};
