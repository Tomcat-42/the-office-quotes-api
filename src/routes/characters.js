/** Express router for character routes.
 * @module routes/characters
 * @requires express
 */

const { Router } = require("express");

const routes = Router();
const charactersController = require("../controllers/charactersController");

/**
 * Route serving characters listing.
 * @name /
 * @function
 * @inner
 */
routes.get("/", charactersController.index);

/**
 * Route serving characters searching.
 * @name /search
 * @function
 * @inner
 */
routes.get("/search", charactersController.search);

/**
 * Route serving a random character.
 * @name /random
 * @function
 * @inner
 */
routes.get("/random", charactersController.random);

/**
 * Route serving characters listing by id.
 * @name /:id
 * @function
 * @inner
 */
routes.get("/:id", charactersController.show);

module.exports = routes;
