const { Router } = require("express");
const charactersController = require("../controllers/charactersController");

const routes = Router();

routes.get("/", charactersController.index);
routes.get("/search", charactersController.search);
routes.get("/:id", charactersController.show);


module.exports = routes;
