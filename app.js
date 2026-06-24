require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const usermodel = require("./models/user");
const bookingModel = require("./models/booking");
const bikeModel = require("./models/bike");
const multer = require("multer");
const crypto = require("crypto");

const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(cookieParser());

app.use(function (req, res, next) {
  res.locals.isLoggedIn = false;

  if (req.cookies.token) {
    try {
      let data = jwt.verify(req.cookies.token, process.env.JWT_SECRET);

      res.locals.isLoggedIn = true;
      res.locals.user = data;
    } catch (err) {
      res.cookie("token", "");
    }
  }

  next();
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images/uploads");
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12, function (err, bytes) {
      const fn = bytes.toString("hex") + path.extname(file.originalname);
      cb(null, fn);
    });
  },
});

const upload = multer({ storage: storage });

app.get("/", function (req, res) {
  res.render("index");
});

app.get("/rent", async function (req, res) {
  let search = req.query.search;
  let sort = req.query.sort;

  let query = {};

  if (search) {
    query.bikeName = {
      $regex: search,
      $options: "i",
    };
  }

  let bikesQuery = bikeModel.find(query);

  if (sort === "low") {
    bikesQuery = bikesQuery.sort({
      pricePerDay: 1,
    });
  }

  if (sort === "high") {
    bikesQuery = bikesQuery.sort({
      pricePerDay: -1,
    });
  }

  let bikes = await bikesQuery;

  res.render("rent", { bikes });
});

app.get("/list", function (req, res) {
  res.render("list");
});

app.get("/rent/view/:bike", async function (req, res) {
  let bike = await bikeModel.findById(req.params.bike);

  if (!bike) {
    return res.send("bike not found");
  }
  res.render("view", { bike });
});

app.get("/rent/rent_it/:bike", async function (req, res) {
  let bike = await bikeModel.findById(req.params.bike);

  if (!bike) {
    return res.send("Bike not found");
  }

  res.render("rent_it", { bike });
});

app.get("/signup", function (req, res) {
  res.render("signup");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.post("/signup", async function (req, res) {
  let { name, email, password } = req.body;

  let user = await usermodel.findOne({ email });
  if (user) {
    return res.status(500).send("User already exist");
  }
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await usermodel.create({
        name,
        email,
        password: hash,
      });
      let token = jwt.sign(
        {
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
      );
      res.cookie("token", token);
      res.send("User is created");
    });
  });
});

app.post("/login", async function (req, res) {
  let { email, password } = req.body;

  let user = await usermodel.findOne({ email });
  if (!user) {
    return res.status(500).send("Something went wrong");
  }

  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign(
        {
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
      );
      res.cookie("token", token);
      res.redirect("/");
    } else {
      res.redirect("/login");
    }
  });
});

app.get("/logout", function (req, res) {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/profile", isLoggedIn, async function (req, res) {
  let user = await usermodel.findOne({ email: req.user.email });
  res.render("profile", { user });
});

function isLoggedIn(req, res, next) {
  if (!req.cookies.token) {
    return res.redirect("/login");
  } else {
    let data = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    req.user = data;
    next();
  }
}

function isAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.send("Admins only");
  }

  next();
}

app.get(
  "/admin/users",
  isLoggedIn,
  isAdmin,

  async function (req, res) {
    let users = await usermodel.find();

    res.render("admin-users", { users });
  },
);

app.get(
  "/admin/bikes",
  isLoggedIn,
  isAdmin,

  async function (req, res) {
    let bikes = await bikeModel.find();

    res.render("admin-bikes", { bikes });
  },
);

app.get(
  "/admin/bookings",
  isLoggedIn,
  isAdmin,

  async function (req, res) {
    let bookings = await bookingModel.find();

    res.render("admin-bookings", { bookings });
  },
);

app.get(
  "/admin/delete-bike/:id",
  isLoggedIn,
  isAdmin,

  async function (req, res) {
    await bikeModel.findByIdAndDelete(req.params.id);

    res.redirect("/admin/bikes");
  },
);

app.get("/admin", isLoggedIn, isAdmin, function (req, res) {
  res.send("Welcome Admin");
});

app.get("/my-bookings", isLoggedIn, async function (req, res) {
  let bookings = await bookingModel.find({
    userEmail: req.user.email,
  });

  res.render("my-booking", { bookings });
});

app.post("/confirm-booking", isLoggedIn, async function (req, res) {
  let { days, date, bikeName } = req.body;

  if (days <= 0) {
    return res.send("Invalid booking days");
  }

  let startDate = new Date(date);

  let endDate = new Date(date);

  endDate.setDate(endDate.getDate() + Number(days));

  let alreadyBooked = await bookingModel.findOne({
    bikeName,

    bookingStart: { $lte: endDate },

    bookingEnd: { $gte: startDate },
  });

  if (alreadyBooked) {
    return res.send("Bike already booked for this date");
  }

  let booking = await bookingModel.create({
    bikeName,
    totalDays: days,

    bookingStart: startDate,
    bookingEnd: endDate,

    userEmail: req.user.email,
  });
  await bikeModel.findOneAndUpdate(
    { bikeName },
    {
      availability: "unavailable",
    },
  );
  res.send("Booking Confirmed");
});

app.get("/my-bikes", isLoggedIn, async function (req, res) {
  let bikes = await bikeModel.find({
    ownerEmail: req.user.email,
  });

  res.render("my-bike", { bikes });
});

app.get("/edit-bike/:id", isLoggedIn, async function (req, res) {
  let bike = await bikeModel.findOne({
    _id: req.params.id,
    ownerEmail: req.user.email,
  });
  if (!bike) {
    return res.send("Unauthorized Access");
  }
  res.render("edit-bike", { bike });
});

app.post("/update-bike/:id", isLoggedIn, async function (req, res) {
  let { bikeName, bikeNumber, pricePerDay, description } = req.body;

  await bikeModel.findOneAndUpdate(
    {
      _id: req.params.id,
      ownerEmail: req.user.email,
    },
    {
      bikeName,
      bikeNumber,
      pricePerDay,
      description,
    },
  );

  res.redirect("/my-bikes");
});

app.get("/delete-bike/:id", isLoggedIn, async function (req, res) {
  await bikeModel.findOneAndDelete({
    _id: req.params.id,
    ownerEmail: req.user.email,
  });

  res.redirect("/my-bikes");
});

app.get("/cancel-booking/:id", isLoggedIn, async function (req, res) {
  await bookingModel.findByIdAndUpdate(req.params.id, {
    status: "cancelled",
  });

  res.redirect("/my-bookings");
});

app.post(
  "/add-bike",
  isLoggedIn,
  upload.single("image"),
  async function (req, res) {
    try {
      let { bikeName, bikeNumber, pricePerDay, description, image } = req.body;

      if (!bikeName || !bikeNumber || !pricePerDay || !description) {
        return res.send("All fields are required");
      }

      if (pricePerDay <= 0) {
        return res.send("Price must be greater than 0");
      }
      if (!req.file) {
        return res.send("Please upload an image");
      }
      await bikeModel.create({
        bikeName,
        bikeNumber,
        pricePerDay,
        description,
        image: req.file.filename,
        ownerEmail: req.user.email,
      });

      res.send("Bike Added Successfully");
    } catch (err) {
      res.send("Something went wrong");
    }
  },
);

app.get("/complete-booking/:id", isLoggedIn, async function (req, res) {
  await bookingModel.findByIdAndUpdate(req.params.id, {
    status: "completed",
  });

  res.redirect("/my-bookings");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log(`Server running on port ${PORT}`);
});
