const { model, Schema } = require("mongoose");
const format = require("date-fns/format")

const messageSchema = new Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now() },
  author: { type: Schema.Types.ObjectId, ref: "User", required: true }
});

// Virtual for formatted date
messageSchema.virtual("timestampFormatted").get(function () {
  return format(this.timestamp, "PPpp");
})

module.exports = model("Message", messageSchema);
