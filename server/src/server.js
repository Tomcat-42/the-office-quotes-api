/* env vars */
if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

/* Modules */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

/* Routes files */
const charactersRoutes = require("./routes/characters");
const conversationsRoutes = require("./routes/conversations");
const quotesRoutes = require("./routes/quotes");

const app = express();

/* mongoose connection */
require("./database/connection");

/* Middlewares */
app.use(helmet());
app.use(cors());
app.use(express.json());

/* Routes */

/* Default root route */
app.get("/", (req, res) => { 
    return res.status(200).json({status: "ok", result: "Yesh"});
});

/**
 * Characters routes.
 * @name characters/
 * @function
 * @inner
 */
app.use("/characters", charactersRoutes);

/**
 * Conversations routes.
 * @name conversations/
 * @function
 * @inner
 */
app.use("/conversations", conversationsRoutes);

/**
 * Quotes routes.
 * @name quotes/
 * @function
 * @inner
 */
app.use("/quotes", quotesRoutes);

app.listen(process.env.PORT, () => {
    console.log(`App Listening at ${process.env.PORT}`);
});
