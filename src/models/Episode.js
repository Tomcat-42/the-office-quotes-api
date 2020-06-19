/**
 * Episode Model
 * @module Episode
 * @class Episode
 */

const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");

/**
 * Episode Schema: Contains an array of Conversation, a name and a season number
 * @class EpisodeSchema
 * @returns mongoose.Schema
 */
const EpisodeSchema = new mongoose.Schema({
    name: { type: String },
    number: { type: Number },
    season: { type: Number },
    conversations: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Conversation",
    },
});

EpisodeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Episode", EpisodeSchema);
