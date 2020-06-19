const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

/* Routes files */
const charactersRoutes = require("./routes/characters");

const app = express();

/* mongoose connection */
require("./database/connection");

/* Middlewares */
app.use(helmet());
app.use(cors());
app.use(express.json());

/* Routes */
app.use("/characters", charactersRoutes);

app.listen(process.env.PORT, () => {
    console.log(`App Listening at ${process.env.PORT}`);
});
