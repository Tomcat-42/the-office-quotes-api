const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const app = express();

/** mongoose connection */
require("./database/connection");

/* Middlewares */
app.use(helmet());
app.use(cors());
app.use(express.json());

app.listen(process.env.PORT, () => {
    console.log(`App Listening at ${process.env.PORT}`);
});
