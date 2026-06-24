const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema({
  bikeName: String,
  userEmail: String,

  bookingStart: Date,
  bookingEnd: Date,

  totalDays: Number,
  status: {
    type: String,
    default: "confirmed",
  },
});

module.exports = mongoose.model("booking", bookingSchema);
