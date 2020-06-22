const Conversation = require("../models/Conversation");
const Quote = require("../models/Quote");
const Episode = require("../models/Episode");
const Character = require("../models/Character");

/**
 * Quote Controller Class
 * @class QuoteController
 */
class QuoteController {
    /**
     * Quotes Index, returns a document with the fields:
     *
     * result: the quotes in the current page;
     * total: the total number of quotes;
     * limit: the number of quotes per page;
     * pages: the total number of pages;
     * page: the current page;
     * status: "ok" if any quote has returned,
     * "not found" if no quote returned or
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

            /* query the episodes for appending in the quotes */
            const episodes = await Episode.find(
                {},
                { conversations: 1, name: 1, number: 1, season: 1 }
            ).populate({
                path: "conversations",
                model: "Conversation",
                select: "quotes",
            });

            /* query all the quotes */
            const quotes = await Quote.paginate(
                {},
                {
                    sort: { _id: 1 },
                    select: "_id quote character",
                    page,
                    limit,
                    populate: {
                        path: "character",
                        model: "Character",
                        select: "_id name",
                    },
                }
            );

            /* returns the conversations, if any */
            if (quotes.total !== 0) {
                const responseObject = {
                    limit: quotes.limit,
                    page: quotes.page,
                    pages: quotes.pages,
                    total: quotes.total,
                    status: "ok",
                };

                responseObject.result = quotes.docs.map((quote) => {
                    const quoteObject = {
                        _id: quote._id,
                        character: quote.character,
                        quote: quote.quote,
                    };
                    const episodeObject = {};

                    /* NOTE: not nice , change it later */
                    let breakFlag = false;
                    for (const ep of episodes) {
                        for (const conv of ep.conversations)
                            if (conv.quotes.includes(quote._id)) {
                                episodeObject.name = ep.name;
                                episodeObject.number = ep.number;
                                episodeObject.season = ep.season;

                                breakFlag = true;

                                break;
                            }
                        if (breakFlag) break;
                    }
                    quoteObject.episode = episodeObject;

                    return quoteObject;
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
     * Quotes searching by names, quote content, episodes and seasons,
     *
     * req.query.seasons: Array containing a list of integers, will match all quotes
     * which is in any of the seasons in the array.
     * req.query.episodes: Array containing a list of integers, will match all quotes
     * which is in any of the episodes in the array.
     * req.query.names: Array containing a list of strings, will match all quotes which
     * character name match any of the regexes in the array names (names[i] => /names[i]/i).
     * req.query.quotes : Array containing a list of strings, will match all quotes
     * which content match any of the regexes in the array quotes(quotes[i] => /quotes[i]/i).
     *
     * returns a document with a fields:
     *
     * result: the conversations;
     * status: "ok" if any conversations has returned,
     * "not found" if no conversations returned or
     * "error" if a error occured in the server (for example a invalid query string);
     * The seasons array will match all quotes which is in any of the
     * seasons in the array.
     * The episodes array will match all quotes which is in any of
     * the episodes in the array.
     * The names array will match all quotes that the character name
     * match any of the regexes in the array names(names[i] => /names[i]/i).
     * The quotes array will match all quotes which content match
     * any of the regexes in the array quotes(quotes[i] => /quotes[i]/i).
     *
     * @async
     * @static
     * @method
     * @param {Request} req - req.query.names, req.body.quotes, req.body.seasons
     * and req.body.episodes arrays contains the parameters used for searching;
     * @param {Response} res - the body is a JSON with the information to be returned;
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
             * NOTE: use the mongo aggregation framework.
             */

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
            }).populate({
                path: "conversations",
                model: "Conversation",
                select: "quotes",
            });

            const episodesMatchedQuotes = episodesMatched.flatMap((ep) =>
                ep.conversations.flatMap((conv) => conv.quotes)
            );

            quoteQuery._id = { $in: episodesMatchedQuotes };

            const quotesSearch = await Quote.paginate(quoteQuery, {
                sort: { _id: 1 },
                select: "_id quote character",
                page,
                limit,
                populate: {
                    path: "character",
                    model: "Character",
                    select: "_id name",
                },
            });

            /* returns the conversations, if any */
            if (quotesSearch.total !== 0) {
                const responseObject = {
                    limit: quotesSearch.limit,
                    page: quotesSearch.page,
                    pages: quotesSearch.pages,
                    total: quotesSearch.total,
                    status: "ok",
                };

                /* Appends episode information to the quotes */
                responseObject.result = quotesSearch.docs.map((quote) => {
                    const quoteObject = {
                        _id: quote._id,
                        character: quote.character,
                        quote: quote.quote,
                    };
                    const episodeObject = {};

                    /* NOTE: not nice, change it later */
                    let breakFlag = false;
                    for (const ep of episodesMatched) {
                        for (const conv of ep.conversations)
                            if (conv.quotes.includes(quote._id)) {
                                episodeObject.name = ep.name;
                                episodeObject.number = ep.number;
                                episodeObject.season = ep.season;

                                breakFlag = true;

                                break;
                            }
                        if (breakFlag) break;
                    }
                    quoteObject.episode = episodeObject;

                    return quoteObject;
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
     * Individual Quote listing by id, returns a document with the fields:
     *
     * result: the quotes in the current page;
     * status: "ok" if a quote has returned,
     * "not found" if no quote returned or
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

            /* Query  the quote */
            const quote = await Quote.findOne(
                { _id },
                { _id: 1, character: 1, quote: 1 }
            ).populate({
                path: "character",
                model: "Character",
                select: "_id name",
            });

            /* Other queries to append episode information */
            const conversation = await Conversation.findOne(
                { quotes: { _id } },
                { _id: 1 }
            );
            const episode = await Episode.findOne({
                conversations: { _id: conversation._id },
            });

            /* returns the quote, if found */
            if (quote && episode) {
                quote.episode = {
                    name: episode.name,
                    season: episode.season,
                    number: episode.number,
                };

                const responseObject = {
                    result: {
                        _id: quote._id,
                        character: quote.character,
                        quote: quote.quote,
                        episode: quote.episode,
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
     * result: a random quote;
     * status: "ok" if the quote has returned,
     * "not found" if no quote returned or
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
            /* Total number of quotes */
            const size = await Quote.countDocuments();
            /* random number in the interval [0, size) */
            const rnd = Math.floor(Math.random() * size);

            /* Query a random quote */
            const quote = await Quote.findOne(
                {},
                {
                    _id: 1,
                    quote: 1,
                    character: 1,
                }
            )
                .skip(rnd)
                .populate({
                    path: "character",
                    model: "Character",
                    select: "_id name",
                });
            
            /* Other queries to append episode information */
            const conversation = await Conversation.findOne(
                { quotes: quote._id },
                { _id: 1 }
            );
            const episode = await Episode.findOne({
                conversations: { _id: conversation._id },
            });
            
            /* returns the quote, if found */
            if (quote && episode) {
                quote.episode = {
                    name: episode.name,
                    season: episode.season,
                    number: episode.number,
                };

                const responseObject = {
                    result: {
                        _id: quote._id,
                        character: quote.character,
                        quote: quote.quote,
                        episode: quote.episode,
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
}

module.exports = QuoteController;
