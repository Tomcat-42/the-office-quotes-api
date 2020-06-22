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
     * Quotes Index, returns a document with a field "result" containing:
     * the quotes, the total number of quotes, total number of pages,
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
            ).populate({
                path: "conversations",
                model: "Conversation",
                select: "quotes",
            });

            const quotes = await Quote.paginate(
                {},
                {
                    sort: { _id: 1 },
                    select: "_id quote character",
                    page: Number(page),
                    limit: 20,
                    populate: {
                        path: "character",
                        model: "Character",
                        select: "_id name",
                    },
                }
            );

            const result = {};

            result.quotes = quotes.docs.map((quote) => {
                const retObj = {};
                const epObj = {};

                retObj._id = quote._id;
                retObj.character = quote.character;
                retObj.quote = quote.quote;

                /* NOTE: not nice */
                let breakFlag = false;
                for (const ep of episodes) {
                    for (const conv of ep.conversations)
                        if (conv.quotes.includes(quote._id)) {
                            epObj.name = ep.name;
                            epObj.number = ep.number;
                            epObj.season = ep.season;

                            breakFlag = true;

                            break;
                        }
                    if (breakFlag) break;
                }
                retObj.episode = epObj;

                return retObj;
            });

            result.limit = quotes.limit;
            result.page = quotes.page;
            result.pages = quotes.pages;
            result.total = quotes.total;

            return await res.status(200).json({ status: "ok", result });
        } catch (error) {
            console.error(`Error on listing characters: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Quotes searching by names, quote content, episodes and seasons,
     *
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
            const { page = 1, seasons, episodes, names, quotes } = req.query;

            /* The collections queries initialy all empty,
             * so will match all quotes */
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
                page: Number(page),
                limit: 20,
                populate: {
                    path: "character",
                    model: "Character",
                    select: "_id name",
                },
            });

            const result = {};

            result.quotes = quotesSearch.docs.map((quote) => {
                const retObj = {};
                const epObj = {};

                retObj._id = quote._id;
                retObj.character = quote.character;
                retObj.quote = quote.quote;

                /* NOTE: not nice */
                let breakFlag = false;
                for (const ep of episodesMatched) {
                    for (const conv of ep.conversations)
                        if (conv.quotes.includes(quote._id)) {
                            epObj.name = ep.name;
                            epObj.number = ep.number;
                            epObj.season = ep.season;

                            breakFlag = true;

                            break;
                        }
                    if (breakFlag) break;
                }
                retObj.episode = epObj;

                return retObj;
            });

            result.limit = quotesSearch.limit;
            result.page = quotesSearch.page;
            result.pages = quotesSearch.pages;
            result.total = quotesSearch.total;

            return await res.status(200).json({ status: "ok", result });
        } catch (error) {
            console.error(`Error on listing characters: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Individual Quote listing by id, returns a json with
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

            const quote = await Quote.findOne(
                { _id },
                { _id: 1, character: 1, quote: 1 }
            ).populate({
                path: "character",
                model: "Character",
                select: "_id name",
            });

            const conversation = await Conversation.findOne(
                { quotes: { _id } },
                { _id: 1 }
            );

            const episode = await Episode.findOne({
                conversations: { _id: conversation._id },
            });

            // const episode = await Episode.aggregate([
            //     {
            //         $lookup: {
            //             from: "conversations",
            //             localField: "conversations",
            //             foreignField: "_id",
            //             as: "conversations",
            //         },
            //     },
            //     { $match: { conversations: { $elemMatch: { quotes: _id } } } },
            // ]);

            if (quote && episode) {
                const q = {};
                q._id = quote._id;
                q.episode = {
                    name: episode.name,
                    season: episode.season,
                    number: episode.number,
                };
                q.quote = quote.quote;
                q.character = quote.character;

                return await res.status(200).json({ status: "ok", result: q });
            } else {
                return res.status(400).json({ status: "not found" });
            }
        } catch (error) {
            console.error(`Error on showing character: ${error.message}`);
            return res.status(500).json({ status: "error" });
        }
    }

    /**
     * Returns a random quote.
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
            const size = await Quote.countDocuments();
            const rnd = Math.floor(Math.random() * size);

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

            const conversation = await Conversation.findOne(
                { quotes: quote._id },
                { _id: 1 }
            );

            const episode = await Episode.findOne({
                conversations: { _id: conversation._id },
            });

            if (quote && episode) {
                const q = {};
                q._id = quote._id;
                q.episode = {
                    name: episode.name,
                    season: episode.season,
                    number: episode.number,
                };
                q.quote = quote.quote;
                q.character = quote.character;

                return res.status(200).json({
                    status: "ok",
                    result: { "quote": q },
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

module.exports = QuoteController;
