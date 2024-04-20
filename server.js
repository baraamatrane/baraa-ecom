const express = require("express");
const app = express();
const userRouter = require("./Routers/UserRouter");
const CartRouter = require("./Routers/CartItemRoute");
const BrandRouter = require("./Routers/BrandRoute");
const Productroute = require("./Routers/ProductRoute");
const db = require("./mongodb");
const geoip = require("geoip-lite");
const PORT = process.env.PORT || 4000;
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const mongoSanatize = require("express-mongo-sanitize");
const rate = require("express-rate-limit");
const csrf = require("csurf");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const Route = require("./Routers/Categotyroute");
const ReviewRoute = require("./Routers/ReviewsRoute");
const OrderRoute = require("./Routers/OrderRoute");
const server = require("http").createServer(app);
const SubCategotyRoute = require("./Routers/SubCategoryRoute");
app.use(
  bodyParser.urlencoded({ extended: true, parameterLimit: 5, limit: "1MB" })
);
app.use(
  cors({
    origin: "https://next-js-tailwind-css-ecommerce-web-app-seven.vercel.app", // Replace with your frontend origin
    credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  })
);
app.use(helmet());
app.use(mongoSanatize());

app.use(
  rate.rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 10000,
    message: {
      message: "Too many request from this IP, please try again after an hour",
    },
  })
);
app.use(cookieParser());
// Then apply csurf middleware
// const csrfProtection = csrf({ cookie: true });
// app.use(csrfProtection);
app.use(hpp());
// Use middlewares

app.use(express.json());
db.on("connection", () => {
  console.log("someone connected!");
});
db.on("error", (err) => {
  console.log(err);
});
app.use("/user", userRouter);
app.use("/Review", ReviewRoute);
app.use("/Order", OrderRoute);
app.use("/Cart", CartRouter);
app.use("/Category", Route);
app.use("/Brand", BrandRouter);
app.use("/Product", Productroute);
app.use("/Subcategory", SubCategotyRoute);
app.get("/", (req, res) => {
  const ipAddress =
    req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const geo = geoip.lookup(ipAddress);

  if (geo && geo.country) {
    res.end(
      `Your IP address is: ${ipAddress}\nYour country is: ${geo.country}`
    );
  } else {
    res.end(`Unable to determine country for IP address: ${ipAddress}`);
  }
});
app.all("*", (req, res, next) => {
  return res
    .status(500)
    .json({ error: `We can't find this Route ${req.originalUrl}` });
});
app.use((error, req, res, next) => {
  error.statusCode = 500 || error.statusCode;
  error.status = error.status || "error";
  console.log("Error : ", error.statusCode);
  error.message = error.message || "Internal server error";

  console.log(process.env.NODE_ENV);
  console.log(error);
  if (process.env.NODE_ENV === "development") {
    res.status(error.statusCode).json({
      status: error.status,
      error,
      message: error.message,
      stack: error.stack,
    });
  } else {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
  }

  next();
});
process.on("unhandledRejection", (error) => {
  console.log(error);
  server.close(() => {
    process.exit(1);
  });
});
app.listen(PORT, () => console.log(`Running in ${PORT}`));
