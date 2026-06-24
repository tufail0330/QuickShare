const mongoose = require("mongoose");
const bikeSchema = mongoose.Schema({
  bikeName: String,
  bikeNumber: String,
  pricePerDay: Number,
  description: String,
  image: String,
  ownerEmail: String,
  availability: {
    type: String,
    default: "available",
  },
});

module.exports = mongoose.model("bike", bikeSchema);
