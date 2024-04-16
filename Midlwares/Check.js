// Assuming `check` is coming from express-validator
const { check } = require("express-validator");

const validateEmail = check("email")
  .isEmpty()
  .withMessage("Fields is Empty")
  .isEmail()
  .withMessage("this is not a email address");

const validatePassword = check("password")
  .isEmpty()
  .withMessage("Fields is Empty")
  .isStrongPassword()
  .withMessage("Your password must be much strong");

module.exports = {
  validateEmail,
  validatePassword,
};
