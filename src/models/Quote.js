/**
 * Quote Model
 * @module Quote
 * @class Quote
 */

const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");

/**
 * Quote Schema: Contains a Character and a String
 * @class QuoteSchema
 * @returns mongoose.Schema
 */
const QuoteSchema = new mongoose.Schema({
    character: { type: mongoose.Schema.Types.ObjectId, require: "Character" },
    quote: { type: String, required: true },
});

QuoteSchema.plugin(mongoosePaginate);
module.exports = mongoose.model("Quote", QuoteSchema);
