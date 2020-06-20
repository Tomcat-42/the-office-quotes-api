const Conversation = require("../models/Conversation");
const Quote = require("../models/Quote");
const Episode = require("../models/Episode");
const Character = require("../models/Character");

class ConversationController {
    /**
     * Conversations Index, returns a document with a field "result" containing: 
     * the conversations, the total number of characters, total number of pages,
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

            const episodes = await Episode.find(
                {},
                { conversations: 1, name: 1, number: 1, season: 1 }
            );

            const conversations = await Conversation.paginate(
                {},
                {
                    sort: { _id: 1 },
                    select: "_id quotes",
                    page: Number(page),
                    limit: 20,
                    populate: {
                        sort: { _id: 1 },
                        path: "quotes",
                        model: "Quote",
                        select: "_id quote",
                        populate: {
                            sort: { _id: 1 },
                            path: "character",
                            model: "Character",
                            select: "_id name",
                        },
                    },
                }
            );
            const result = {};
            result.limit = conversations.limit;
            result.page = conversations.page;
            result.pages = conversations.pages;
            result.total = conversations.total;

            result.conversations = conversations.docs.map((conv) => {
                const retObj = {};
                const epObj = {};

                retObj._id = conv._id;
                retObj.quotes = conv.quotes;

                for (const ep of episodes) {
                    if (ep.conversations.includes(conv._id)) {
                        epObj.name = ep.name;
                        epObj.number = ep.number;
                        epObj.season = ep.season;

                        break;
                    }
                }
                retObj.episode = epObj;

                return retObj;
            });

            return await res.status(200).json({ status: "ok", result });
        } catch (error) {
            console.error(`Error on listing characters: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Conversation searching by names, quote content, episodes and seasons,
     *
     * The seasons array will match all conversations which is in any of the 
     * seasons in the array.
     * The episodes array will match all conversations  which is in any of 
     * the episodes in the array.
     * The names array will match all conversations which has a quote that 
     * character name match any of the regexes in the array names(names[i] => /names[i]/i).
     * The quotes array will match all conversations which has a quote that 
     * content match any of the regexes in the array quotes(quotes[i] => /quotes[i]/i).
     *
     * @async
     * @static
     * @method
     * @param {Request} req - req.query.names, req.body.quotes, req.body.seasons
     * and req.body.episodes arrays contains the parameters used for searching;
     * @param {Response} res - the body is a JSON with the information to be returned
     * @returns {Response}
     */
    static async search(req, res) {
        try {
            const { page = 1, seasons, episodes, names, quotes } = req.query;

            /* The collections queries initialy all empty,
             * so will match all conversations  */
            const episodeQuery = {};
            const characterQuery = {};
            const quoteQuery = {};
            const conversationQuery = {};

            /* If search parameters are present, narrows the queries */
            if (seasons) {
                seasons.forEach((season, index) => {
                    seasons[index] = Number(season);
                });
                episodeQuery.season = { $in: seasons };
            }

            if (episodes) {
                episodes.forEach((ep, index) => {
                    episodes[index] = Number(ep);
                });
                episodeQuery.number = { $in: episodes };
            }

            if (names) {
                names.forEach((name, index) => {
                    names[index] = new RegExp(name, "i");
                });
                characterQuery.name = { $in: names };
            }

            if (quotes) {
                quotes.forEach((quote, index) => {
                    quotes[index] = new RegExp(quote, "i");
                });
                quoteQuery.quote = { $in: quotes };
            }

            /* Scary hack to narrow the conversations to the search parameters */
            const charactersMatched = await Character.find(characterQuery, {
                _id: 1,
            });
            const charactersMatchedIds = charactersMatched.map(
                (char) => char._id
            );
            quoteQuery.character = { $in: charactersMatchedIds };

            const quotesMatched = await Quote.find(quoteQuery, {
                _id: 1,
            });
            const quotesMatchedIds = quotesMatched.map((quote) => quote._id);
            conversationQuery.quotes = { $in: quotesMatchedIds };

            const episodesMatched = await Episode.find(episodeQuery, {
                conversations: 1,
                name: 1,
                number: 1,
                season: 1,
            });
            const episodesMatchedConversations = episodesMatched.flatMap(
                (ep) => ep.conversations
            );
            conversationQuery._id = { $in: episodesMatchedConversations };

            /* query the conversations that matches the search parameters */
            const conversations = await Conversation.paginate(
                conversationQuery,
                {
                    sort: { _id: 1 },
                    select: "_id quotes",
                    page: Number(page),
                    limit: 20,
                    populate: {
                        sort: { _id: 1 },
                        path: "quotes",
                        model: "Quote",
                        select: "_id quote",
                        populate: {
                            sort: { _id: 1 },
                            path: "character",
                            model: "Character",
                            select: "_id name",
                        },
                    },
                }
            );

            const result = {};
            result.limit = conversations.limit;
            result.page = conversations.page;
            result.pages = conversations.pages;
            result.total = conversations.total;

            /* Other hack to append episode information to the quotes*/
            result.conversations = conversations.docs.map((conv) => {
                const retObj = {};
                const epObj = {};

                retObj._id = conv._id;
                retObj.quotes = conv.quotes;

                for (const ep of episodesMatched) {
                    if (ep.conversations.includes(conv._id)) {
                        epObj.name = ep.name;
                        epObj.number = ep.number;
                        epObj.season = ep.season;

                        break;
                    }
                }
                retObj.episode = epObj;

                return retObj;
            });

            return await res.status(200).json({ status: "ok", result });
        } catch (error) {
            console.error(`Error on listing characters: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Individual Conversation listing by id, returns a json with
     * the conversation in result.conversation.
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

            const conversation = await Conversation.findOne(
                { _id },
                { _id: 1, quotes: 1 }
            ).populate({
                path: "quotes",
                model: "Quote",
                select: "_id quote",
                populate: {
                    path: "character",
                    model: "Character",
                    select: "_id name",
                },
            });

            const episode = await Episode.findOne(
                { conversations: _id },
                { _id: 0, number: 1, season: 1, name: 1 }
            );

            if (conversation && episode) {
                const conv = {};
                conv._id = conversation._id;
                conv.episode = episode;
                conv.quotes = conversation.quotes;
                const result = conv;

                return await res.status(200).json({ status: "ok", result });
            } else {
                return res.status(400).json({ status: "not found" });
            }
        } catch (error) {
            console.error(`Error on showing character: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Returns a random conversation.
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
            const size = await Conversation.countDocuments();
            const rnd = Math.floor(Math.random() * size);

            const conversation = await Conversation.findOne(
                {},
                {
                    _id: 1,
                    quotes: 1,
                }
            )
                .skip(rnd)
                .populate({
                    path: "quotes",
                    model: "Quote",
                    select: "_id quote",
                    populate: {
                        path: "character",
                        model: "Character",
                        select: "_id name",
                    },
                });

            if (conversation) {
                return res.status(200).json({
                    status: "ok",
                    result: { conversation },
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

module.exports = ConversationController;
