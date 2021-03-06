/**
 * Conversation Model
 * @module Conversation
 * @class Conversation
 * @returns Conversation
 */

const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");

/**
 * Conversation Schema: Contain an array of Quote
 * @class ConversationSchema
 * @returns mongoose.Schema
 */
const ConversationSchema = new mongoose.Schema({
    quotes: { type: [mongoose.Schema.Types.ObjectId], ref: "Quote" },
});

ConversationSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Conversation", ConversationSchema);
