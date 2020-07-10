const { model, Schema } = require("mongoose");

const userSchema = new Schema({
  username: { type: String, required: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  membership: { type: String, enum: ["None", "Member"], default: "None" },
  admin: { type: Boolean, default: false }
})

// Virtual for full name
userSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`;
})

module.exports = model("User", userSchema);
