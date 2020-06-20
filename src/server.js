const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

/* Routes files */
const charactersRoutes = require("./routes/characters");
const conversationsRoutes = require("./routes/conversations");

const app = express();

/* mongoose connection */
require("./database/connection");

/* Middlewares */
app.use(helmet());
app.use(cors());
app.use(express.json());

/* Routes */

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

app.listen(process.env.PORT, () => {
    console.log(`App Listening at ${process.env.PORT}`);
});
