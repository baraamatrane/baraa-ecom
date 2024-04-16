const routeruser = require("express").Router();
const Middleware = require("../Midlwares/Autorize");
const controler = require("../Controlers/Usercontroler.js");
const Checkers = require("../Midlwares/Check");
const { body } = require("express-validator");
const validator = require("../validation/valadation.js");
routeruser
  .post(
    "/Register",
    validator.userRegister,
    validator.Middleware,
    controler.Register
  )
  .post("/login", validator.userLogin, validator.Middleware, controler.login)
  .use(Middleware.verifyJWT)
  .use(
    "/:id/AddWishlist",
    validator.AddWishlist,
    validator.IdProduct,
    validator.Middleware,
    controler.AddWishlist
  )
  .get("/information", controler.Information)
  .use(
    "/:id/DeleteWishlist",
    validator.AddWishlist,
    validator.IdProduct,
    validator.Middleware,
    controler.DeleteWishlist
  )
  .use("/GetWishlist", controler.GetWishlist)
  .get("/refrech", controler.refrech)
  .put(
    "/updateUser",
    validator.userUpdate,
    validator.Middleware,
    controler.updateUser
  )
  .put(
    "/Changepassword",
    validator.userChangePassword,
    validator.Middleware,
    controler.Changepassword
  )
  .get("/logout", controler.logout);
module.exports = routeruser;
