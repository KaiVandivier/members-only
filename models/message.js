const { model, Schema } = require("mongoose");

const messageSchema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now() },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true }
});

module.exports = model("Message", messageSchema);
