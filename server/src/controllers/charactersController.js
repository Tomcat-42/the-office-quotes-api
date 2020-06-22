const Character = require("../models/Character");

/**
 * Character Controller Class
 * @class CharacterController
 */
class CharacterController {
    /**
     * Character Index, returns a document with the fields:
     *
     * result: the characters in the current page;
     * total: the total number of characters;
     * limit: the number of characters per page;
     * pages: the total number of pages;
     * page: the current page;
     * status: "ok" if any character has returned,
     * "not found" if no character returned or
     * "error" if a error occured in the server;
     *
     * @async
     * @static
     * @method
     * @param {Request} req - req.body.page contains a optional page value(default 1).
     * @param {Response} res - the body is a JSON with the information to be returned.
     * @returns {Response}
     */
    static async index(req, res) {
        try {
            /* Pagination number and limit*/
            const page = Number(req.query.page) || 1;
            const limit = Number(process.env.PAGINATION_LIMIT);

            /* Paginates the query results */
            const characters = await Character.paginate(
                {},
                {
                    page,
                    limit,
                    select: "_id name",
                }
            );

            /* Return results, if any */
            if (characters.total !== 0) {
                const responseObject = {
                    result: characters.docs,
                    total: characters.total,
                    pages: characters.pages,
                    page: characters.page,
                    limit: characters.limit,
                    status: "ok",
                };
                return res.status(200).json(responseObject);
            } else {
                return res.status(400).json({ status: "not found" });
            }
        } catch (error) {
            console.error(`Error on listing characters: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Individual Character listing by id, returns a JSON document with
     * the fields:
     *
     * result: the character;
     * status: "ok" if the character has returned,
     * "not found" if no character returned or
     * "error" if a error occured in the server (for example a invalid id format);
     *
     * @async
     * @static
     * @method
     * @param {Request} req - req.params.id contains the id of the character.
     * @param {Response} res - the body is a JSON with the information.
     * @returns {Response}
     */
    static async show(req, res) {
        try {
            /* The id to list */
            const _id = String(req.params.id);

            /* Query the character */
            const character = await Character.findById(_id, {
                _id: 1,
                name: 1,
            });

            /* returns the character, if found */
            if (character) {
                const responseObject = {
                    result: character,
                    status: "ok",
                };
                return res.status(200).json(responseObject);
            } else {
                return res.status(400).json({ status: "not found" });
            }
        } catch (error) {
            console.error(`Error on showing character: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Character searching by the parameters:
     *
     * req.query.names: Array containing one or more strings to search in
     * character names. For each element names[i] the regex /names[i]/i will be used
     * to match a name.
     *
     * returns a document with a fields:

     * result: the character;
     * status: "ok" if the character has returned,
     * "not found" if no character returned or
     * "error" if a error occured in the server (for example a invalid query string);
     *
     * @async
     * @static
     * @method
     * @param {Request} req - req.query.names array contains thes strings used for searching
     * @param {Response} res - the body is a JSON with the information to be returned
     * @returns {Response}
     */
    static async search(req, res) {
        try {
            /* Pagination number and limit and search parameters */
            const page = Number(req.query.page) || 1;
            const limit = Number(process.env.PAGINATION_LIMIT);
            const names = Array(req.query.names).flat(1);

            /* 
             * If the names array is present transforms its elements
             * in the correspondings regexes
             */
            const namesRegexes = names.map((name) => new RegExp(name, "i"));
            const characterQuery = { name: { $in: namesRegexes } };
            
            /* Paginates the results */
            const character = await Character.paginate(characterQuery, {
                page,
                limit,
                select: "_id name",
            });

            /* Return results, if any */
            if (character.total !== 0) {
                const responseObject = {
                    result: character.docs,
                    total: character.total,
                    pages: character.pages,
                    page: character.page,
                    limit: character.limit,
                    status: "ok",
                };
                return res.status(200).json(responseObject);
            } else {
                return res.status(400).json({ status: "not found" });
            }
        } catch (error) {
            console.error(`Error on showing character: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Returns a document with the fields:  
     *
     * result: a random character;
     * status: "ok" if the character has returned,
     * "not found" if no character returned or
     * "error" if a error occured in the server;
     *
     * @async
     * @static
     * @method
     * @param {Request} req - the body of the request is not used
     * @param {Response} res - the body is a JSON with the information to be returned
     * @returns {Response}
     */
    static async random(req, res) {
        try {

            /* 
             * Request a random character using the 
             * mongo aggregation framework
             * */
            const character = await Character.aggregate([
                { $project: { _id: 1, name: 1 } },
                { $sample: { size: 1 } },
            ]);

            /* returns the character, if found */
            if (character.length) {
                const responseObject = {
                    result: character[0],
                    status: "ok",
                };
                return res.status(200).json(responseObject);
            } else {
                return res.status(400).json({ status: "not found" });
            }
        } catch (error) {
            console.error(`Error on showing character: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }
}

module.exports = CharacterController;
