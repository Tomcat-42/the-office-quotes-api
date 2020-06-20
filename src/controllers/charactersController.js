const Character = require("../models/Character");

/**
 * Character Controller Class
 * @class CharacterController
 */
class CharacterController {
    /**
     * Character Index, returns a document with a field "result" containing: the characters,
     * the total number of characters, total number of pages,
     * current page and the total number of documents in the current page.
     *
     * @async
     * @static
     * @method
     * @param {Request} req - req.body.page contains a optional page value(default 1)
     * @param {Response} res - the body is a JSON with the information to be returned
     * @returns {Response}
     */
    static async index(req, res) {
        try {
            const { page = 1 } = req.query;
            const result = await Character.paginate(
                {},
                { page: Number(page), limit: 20, select: "_id name" }
            );

            result.characters = result.docs;
            delete result.docs;

            return res.status(200).json({ status: "ok", result });
        } catch (error) {
            console.error(`Error on listing characters: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Individual Character listing by id, returns a json with
     * the individual character in result.character.
     *
     * @async
     * @static
     * @method
     * @param {Request} req - req.params.id contains the id to list
     * @param {Response} res - the body is a JSON with the information to be returned
     * @returns {Response}
     */
    static async show(req, res) {
        try {
            const _id = String(req.params.id);

            const character = await Character.findById(_id, {
                _id: 1,
                name: 1,
            });

            if (character) {
                const result = { character };
                return res.status(200).json({ status: "ok", result });
            } else {
                return res.status(400).json({ status: "not found" });
            }
        } catch (error) {
            console.error(`Error on showing character: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Character searching by name, returns a document with a field "result"
     * containing: the matching characters,
     * the total number of characters, total number of pages,
     * current page and the  total number of documents in the current page.
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
            const { names, page = 1 } = req.query;

            if (names) {
                names.forEach((name, index) => {
                    names[index] = new RegExp(name, "i");
                });
            }

            const result = await Character.paginate(
                {
                    name: { $in: names },
                },
                { page: Number(page), limit: 20, select: "_id name" }
            );

            if (result) {
                result.characters = result.docs;
                delete result.docs;
                return res.status(200).json({ status: "ok", result });
            } else {
                return res.status(400).json({ status: "not found" });
            }
        } catch (error) {
            console.error(`Error on showing character: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Returns a random character.
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
            const character = await Character.aggregate([
                { $project: { _id: 1, name: 1 } },
                { $sample: { size: 1 } },
            ]);

            if (character) {
                return res.status(200).json({
                    status: "ok",
                    result: { character: character[0] },
                });
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
