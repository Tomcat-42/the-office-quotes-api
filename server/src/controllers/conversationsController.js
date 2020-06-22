const Conversation = require("../models/Conversation");
const Quote = require("../models/Quote");
const Episode = require("../models/Episode");
const Character = require("../models/Character");

/**
 * Conversation Controller Class
 * @class ConversationController
 */
class ConversationController {
    /**
     * Conversations Index, returns a document with the fields:
     *
     * result: the conversations in the current page;
     * total: the total number of conversations;
     * limit: the number of conversations per page;
     * pages: the total number of pages;
     * page: the current page;
     * status: "ok" if any conversations has returned,
     * "not found" if no conversations returned or
     * "error" if a error occured in the server;
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
            /* Pagination number and limit*/
            const page = Number(req.query.page) || 1;
            const limit = Number(process.env.PAGINATION_LIMIT);

            /* Query the episodes informations */
            const episodes = await Episode.find(
                {},
                { conversations: 1, name: 1, number: 1, season: 1 }
            );

            /*
             * Query all the conversations and deep populate
             * the subfields
             */
            const conversations = await Conversation.paginate(
                {},
                {
                    sort: { _id: 1 },
                    select: "_id quotes",
                    page,
                    limit,
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

            /* returns the conversations, if any */
            if (conversations.total !== 0) {
                const responseObject = {
                    limit: conversations.limit,
                    page: conversations.page,
                    pages: conversations.pages,
                    total: conversations.total,
                    status: "ok",
                };

                /* Appends episode information to the conversations */
                responseObject.result = conversations.docs.map((conv) => {
                    const conversationObj = {
                        _id: conv._id,
                        quotes: conv.quotes,
                    };
                    const episodeObj = {};

                    for (const ep of episodes) {
                        if (ep.conversations.includes(conv._id)) {
                            episodeObj.name = ep.name;
                            episodeObj.number = ep.number;
                            episodeObj.season = ep.season;

                            break;
                        }
                    }
                    conversationObj.episode = episodeObj;

                    return conversationObj;
                });

                return await res.status(200).json(responseObject);
            } else {
                return res.status(400).json({ status: "not found" });
            }
        } catch (error) {
            console.error(`Error on listing characters: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Conversation searching by the parameters:
     *
     * req.query.seasons: Array containing a list of integers, will match all conversations
     * which is in any of the seasons in the array.
     * req.query.episodes: Array containing a list of integers, will match all conversations
     * which is in any of the episodes in the array.
     * req.query.names: Array containing a list of strings, will match all conversations
     * which has a quote that character name match any of the regexes in the array
     * names (names[i] => /names[i]/i).
     * req.query.quotes : Array containing a list of strings, will match all conversations
     * which has a quote that content match any of the regexes in the array
     * quotes(quotes[i] => /quotes[i]/i).
     *
     * returns a document with a fields:
     *
     * result: the conversations;
     * status: "ok" if any conversations has returned,
     * "not found" if no conversations returned or
     * "error" if a error occured in the server (for example a invalid query string);
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
            /* Pagination number and limit */
            const page = Number(req.query.page) || 1;
            const limit = Number(process.env.PAGINATION_LIMIT);

            /*
             * The collections queries initialy all empty,
             * so will match all conversations
             */
            const episodeQuery = {};
            const characterQuery = {};
            const quoteQuery = {};
            const conversationQuery = {};

            /* If search parameters are present, narrows the queries */
            if (req.query.seasons) {
                const seasons = Array(req.query.seasons).flat(1);
                seasons.forEach((s, i) => {
                    seasons[i] = Number(s);
                });
                episodeQuery.season = { $in: seasons };
            }

            if (req.query.episodes) {
                const episodes = Array(req.query.episodes).flat(1);
                episodes.forEach((e, i) => {
                    episodes[i] = Number(e);
                });
                episodeQuery.number = { $in: episodes };
            }

            if (req.query.names) {
                const names = Array(req.query.names).flat(1);
                names.forEach((n, i) => {
                    names[i] = new RegExp(n, "i");
                });
                characterQuery.name = { $in: names };
            }

            if (req.query.quotes) {
                const quotes = Array(req.query.quotes).flat(1);
                quotes.forEach((q, i) => {
                    quotes[i] = new RegExp(q, "i");
                });
                quoteQuery.quote = { $in: quotes };
            }

            /*
             * NOTE: Future me, This is slow garbage,
             * instead use the mongo aggregation framework
             */
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
                    page,
                    limit,
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

            /* returns the conversations, if any */
            if (conversations.total !== 0) {
                const responseObject = {
                    limit: conversations.limit,
                    page: conversations.page,
                    pages: conversations.pages,
                    total: conversations.total,
                    status: "ok",
                };

                /* Appends episode information to the conversations */
                responseObject.result = conversations.docs.map((conv) => {
                    const conversationObj = {};
                    const episodeObj = {};

                    conversationObj._id = conv._id;
                    conversationObj.quotes = conv.quotes;

                    for (const ep of episodesMatched) {
                        if (ep.conversations.includes(conv._id)) {
                            episodeObj.name = ep.name;
                            episodeObj.number = ep.number;
                            episodeObj.season = ep.season;

                            break;
                        }
                    }
                    conversationObj.episode = episodeObj;

                    return conversationObj;
                });

                return await res.status(200).json(responseObject);
            } else {
                return res.status(400).json({ status: "not found" });
            }
        } catch (error) {
            console.error(`Error on listing characters: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Individual Conversation listing by id, returns a document wit the fields:
     *
     * result: the conversations in the current page;
     * status: "ok" if a conversation has returned,
     * "not found" if no conversation returned or
     * "error" if a error occured in the server;
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

            /* Query the conversation */
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

            /* Query the episode of the conversation */
            const episode = await Episode.findOne(
                { conversations: _id },
                { _id: 0, number: 1, season: 1, name: 1 }
            );

            /* returns the conversation, if found */
            if (conversation) {
                conversation.episode = {
                    name: episode.name,
                    season: episode.season,
                    number: episode.number,
                };

                const responseObject = {
                    result: {
                        _id: conversation._id,
                        quotes: conversation.quotes,
                        episode: conversation.episode,
                    },

                    status: "ok",
                };

                return await res.status(200).json(responseObject);
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
     * result: a random conversation;
     * status: "ok" if the conversation has returned,
     * "not found" if no conversation returned or
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
            /* Total number of conversations */
            const size = await Conversation.countDocuments();
            /* random number in the interval [0, size) */
            const rnd = Math.floor(Math.random() * size);

            /* Query a random conversation */
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

            /* Returns the conversation, if found */
            if (conversation) {
                const responseObject = {
                    result: conversation,
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

module.exports = ConversationController;
