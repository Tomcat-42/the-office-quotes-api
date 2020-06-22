/** 
 * Express router for quotes routes.
 * @module routes/quotes
 * @requires express
 */

const { Router } = require("express");
const quotesController = require("../controllers/quotesController");

const routes = Router();

/**
 * Route serving quotes listing.
 * @name /
 * @function
 * @inner
 */
routes.get("/", quotesController.index);

/**
 * Route serving quotes searching.
 * @name /search
 * @function
 * @inner
 */
routes.get("/search", quotesController.search);

/**
 * Route serving a random quotes.
 * @name /random
 * @function
 * @inner
 */
routes.get("/random", quotesController.random);

/**
 * Route serving a quotes listing by id.
 * @name /:id
 * @function
 * @inner
 */
routes.get("/:id", quotesController.show);

module.exports = routes;
