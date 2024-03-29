import express from "express";
import cors from "cors";
import { config } from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.model.js";
import Camp from "./models/Camp.model.js";
import Acceptance from "./models/Acceptance.model.js";
import Registration from "./models/Registration.model.js";

config({
  path: ".env.local",
});

const app = express();
import Stripe from "stripe";
// eslint-disable-next-line no-undef
const stripe = new Stripe(process.env.apiKey_stripe);

// eslint-disable-next-line no-undef
const port = process.env.port || 3000;

// eslint-disable-next-line no-undef
mongoose.connect(process.env.DB_URI);

app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  return res.send("MedCamp server is Running");
});

app.post("/users", async (req, res) => {
  try {
    const user = new User(req.body);
    const result = await user.save();
    return res.status(201).send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(409).send("User already exists");
    }
  }
});

app.get("/users", async (req, res) => {
  try {
    return res.send(await User.find(req.query));
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.get("/professionals", async (req, res) => {
  try {
    return res.send(await User.find({ status: "professional" }));
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.put("/users", async (req, res) => {
  const data = {};
  if (req?.body?.name) data.name = req.body.name;
  if (req?.body?.phone) data.phone = req.body.phone;
  if (req?.body?.photo) data.photo = req.body.photo;
  if (req?.body?.address) data.address = req.body.address;
  if (req?.body?.preferences) data.preferences = req.body.preferences;

  try {
    const result = await User.updateOne(
      { _id: req.body._id },
      {
        $set: data,
      }
    );
    return res.status(200).send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.post("/add-a-camp", async (req, res) => {
  try {
    const camp = new Camp(req.body);
    const result = await camp.save();
    const camp_id = result._id;

    req.body.professionals.forEach(async (item) => {
      const professional_id = new mongoose.Types.ObjectId(item);

      const acc = new Acceptance({ professional_id, camp_id });
      await acc.save();
    });

    return res.status(201).send("Camp added successfully");
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(401).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.get("/manage-camps", async (req, res) => {
  let camps = await Camp.find(req.query);
  camps = await Promise.all([
    ...camps.map(async (camp) => {
      let pros = await Acceptance.find({ camp_id: camp._id });
      pros = await Promise.all([
        ...pros.map(async (pro) => {
          const pro_names = await User.find({ _id: pro.professional_id });
          return pro_names[0].name;
        }),
      ]);

      return { pros, ...camp.toObject() };
    }),
  ]);
  // console.log(camps);
  res.status(200).send(camps);
});

app.put("/update-camp", async (req, res) => {
  const { _id, ...rest } = req.body;
  try {
    const result = await Camp.updateOne({ _id: _id }, { $set: { ...rest } });
    return res.status(200).send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.delete("/delete-camp/:_id", async (req, res) => {
  const { _id } = req.params;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    await Acceptance.deleteMany({ camp_id: _id });
    const result = await Camp.deleteOne({ _id: _id });
    await session.commitTransaction();
    return res.status(200).send(result);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.get("/available-camps", async (req, res) => {
  try {
    let camps = await Camp.find({ status: "publish" });
    camps = await Promise.all([
      ...camps.map(async (camp) => {
        let pros = await Acceptance.find({ camp_id: camp._id });
        pros = await Promise.all([
          ...pros.map(async (pro) => {
            const pro_names = await User.find({ _id: pro.professional_id });
            return pro_names[0].name;
          }),
        ]);

        const count = await Registration.countDocuments({
          camp_id: camp._id,
        });

        return { pros, count, ...camp.toObject() };
      }),
    ]);

    return res.status(200).send(camps);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.get("/camp-details/:_id", async (req, res) => {
  const { _id } = req.params;
  try {
    let camps = await Camp.find({ _id: _id });
    camps = await Promise.all([
      ...camps.map(async (camp) => {
        let pros = await Acceptance.find({ camp_id: camp._id });
        pros = await Promise.all([
          ...pros.map(async (pro) => {
            const pro_names = await User.find({ _id: pro.professional_id });
            return pro_names[0].name;
          }),
        ]);

        return { pros, ...camp.toObject() };
      }),
    ]);
    return res.status(200).send(camps);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.post("/register", async (req, res) => {
  try {
    const reg = new Registration(req.body);
    const result = await reg.save();
    return res.status(201).send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(409).send("Already registered!");
    }
  }
});

app.get("/registered-camps", async (req, res) => {
  const user_id = req.query._id;
  let registrations = await Registration.find({ user_id: user_id });
  registrations = await Promise.all([
    ...registrations.map(async (reg) => {
      let camp = await Camp.find({ _id: reg.camp_id });
      return {
        ...reg.toObject(),
        camp_name: camp[0].name,
        camp_date_and_time: camp[0].date_and_time,
        camp_venue: camp[0].venue,
      };
    }),
  ]);
  return res.status(200).send(registrations);
});

app.post("/create-payment-intent", async (req, res) => {
  try {
    const { fees } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: fees * 100,
      currency: "usd", // Or your desired currency
      payment_method_types: ["card"],
    });

    res.status(200).send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: "Failed to create payment intent" });
  }
});

app.get("/registrations", async (req, res) => {
  let registrations = await Registration.find(req.query);

  registrations = await Promise.all([
    ...registrations.map(async (reg) => {
      const newReg = { ...reg.toObject() };

      const camp = (await Camp.find({ _id: newReg.camp_id }))[0];
      const user = (await User.find({ _id: newReg.user_id }))[0];
      const organizer = (await User.find({ _id: newReg.organizer_id }))[0];

      // update userInfo
      newReg.name = user.name;
      newReg.phone = user.phone;
      newReg.address = user.address;
      newReg.photo = user.photo;

      // update campInfo
      newReg.camp_name = camp.name;
      newReg.camp_venue = camp.venue;
      newReg.camp_status = camp.status;

      newReg.organizer_name = organizer.name;

      return newReg;
    }),
  ]);

  return res.status(200).send(registrations);
});

app.put("/registrations", async (req, res) => {
  const { _id, ...rest } = req.body;
  const result = await Registration.updateOne(
    { _id: _id },
    {
      $set: { ...rest },
    }
  );
  return res.status(200).send(result);
});

app.delete("/registrations/:_id", async (req, res) => {
  const { _id } = req.params;
  try {
    const result = await Registration.deleteOne({ _id: _id });
    return res.status(200).send(result);
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).send(err.message);
    } else {
      return res.status(500).send("Something went wrong");
    }
  }
});

app.get("/home", async (req, res) => {
  let imgs = await Camp.aggregate([
    { $match: { photo: { $ne: "" } } },
    { $sample: { size: 4 } },
    { $project: { _id: 0, photo: 1 } },
  ]);
  imgs = imgs.map((camp) => camp.photo);

  let camps = await Camp.find();
  camps = await Promise.all([
    ...camps.map(async (camp) => {
      let pros = await Acceptance.find({ camp_id: camp._id });
      pros = await Promise.all([
        ...pros.map(async (pro) => {
          const pro_names = await User.find({ _id: pro.professional_id });
          return pro_names[0].name;
        }),
      ]);
      const count = await Registration.countDocuments({
        camp_id: camp._id,
      });
      return { pros, count, ...camp.toObject() };
    }),
  ]);

  camps.sort((a, b) => b.count - a.count);
  camps = camps.slice(0, 6);

  const letest_reviews = await Registration.aggregate([
    {
      $match: {
        rating: { $ne: 0 },
        review: { $ne: "" },
      },
    },
    { $sort: { updatedAt: -1 } },
    { $limit: 4 },
  ]);

  const totalUsers = await User.countDocuments();
  const totalCamps = await Camp.countDocuments();
  const totalRegistrations = await Registration.countDocuments();

  const organizerPipeline = [
    {
      $group: {
        _id: "$organizer_id",
        totalRegistrations: { $sum: 1 },
      },
    },
    {
      $sort: { totalRegistrations: -1 },
    },
    {
      $lookup: {
        from: "users", // Assuming your user collection name is "users"
        localField: "_id",
        foreignField: "_id",
        as: "organizer",
      },
    },
    {
      $project: {
        _id: 1,
        totalRegistrations: 1,
        organizerName: { $arrayElemAt: ["$organizer.name", 0] },
      },
    },
  ];

  const topOrganizers = await Registration.aggregate(organizerPipeline);

  const participantPipeline = [
    {
      $group: {
        _id: "$user_id",
        totalRegistrations: { $sum: 1 },
      },
    },
    {
      $sort: { totalRegistrations: -1 },
    },
    {
      $lookup: {
        from: "users", // Assuming your user collection name is "users"
        localField: "_id",
        foreignField: "_id",
        as: "participant",
      },
    },
    {
      $project: {
        _id: 1,
        totalRegistrations: 1,
        participantName: { $arrayElemAt: ["$participant.name", 0] },
      },
    },
  ];

  const topParticipants = await Registration.aggregate(participantPipeline);

  res.status(200).json({
    imgs,
    camps,
    letest_reviews,
    totalUsers,
    totalCamps,
    totalRegistrations,
    topParticipants,
    topOrganizers,
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
