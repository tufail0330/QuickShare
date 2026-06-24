const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URL);

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: {
    type: String,
    default: "user",
  },
});

module.exports = mongoose.model("user", userSchema);
