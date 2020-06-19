/* env vars */
if (process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const mongoose = require("mongoose");

mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: true,
});

/* logs */
mongoose.connection.on("connected", () => {
    console.log(`Mongoose connection is open to ${process.env.DB_URI}`);
});

mongoose.connection.on("error", (err) => {
    console.log(`Mongoose connection error: ${err}`);
});

mongoose.connection.on("disconnected", () => {
    console.log("Mongoose connection is disconnected");
});

process.on("SIGINT", () => {
    mongoose.connection.close(() => {
        console.log(
            "Mongooseconnection is disconnected due to application termination"
        );
        process.exit(0);
    });
});

module.exports = mongoose.connection;
