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

app.post("/add-camp", async (req, res) => {
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

app.get("/organizer-profile", async (req, res) => {
  const camps = await Camp.find({ organizer_id: req.query._id });
  res.status(200).send(camps);
});

app.get("/manage-camps", async (req, res) => {
  let camps = await Camp.find({ organizer_id: req.query._id });
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

        const count = await Registration.countDocuments({ camp_id: camp._id });

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

app.put("/update-payment", async (req, res) => {
  const { _id, payment_status } = req.body;
  const result = await Registration.updateOne(
    { _id: _id },
    {
      $set: { payment_status },
    }
  );
  return res.status(200).send(result);
});

app.delete("/cancel-registrasion/:_id", async (req, res) => {
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
