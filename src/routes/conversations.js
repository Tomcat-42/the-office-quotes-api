/** Express router for conversations routes.
 * @module routes/conversations
 * @requires express
 */
const { Router } = require("express");
const conversationsController = require("../controllers/conversationsController");

const routes = Router();

/**
 * Route serving conversations listing.
 * @name /
 * @function
 * @inner
 */
routes.get("/", conversationsController.index);

/**
 * Route serving conversations searching.
 * @name /search
 * @function
 * @inner
 */
routes.get("/search", conversationsController.search);

/**
 * Route serving a random conversations.
 * @name /random
 * @function
 * @inner
 */
routes.get("/random", conversationsController.random);

/**
 * Route serving a conversations listing by id.
 * @name /:id
 * @function
 * @inner
 */
routes.get("/:id", conversationsController.show);

module.exports = routes;
