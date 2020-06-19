/**
 * Character Model
 * @module Character
 * @class Character
 * @returns Character
 */

const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");

/**
 * Character Schema: Contain a name
 * @class CharacterSchema
 * @returns mongoose.Schema
 */
const CharacterSchema = new mongoose.Schema({
    name: {type: String},
});

CharacterSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Character", CharacterSchema);
