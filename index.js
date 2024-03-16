import express from "express";
import cors from "cors";
import { config } from "dotenv";
import mongoose from "mongoose";
import User from "./models/User.model.js";
import Camp from "./models/Camp.model.js";
import Acceptance from "./models/Acceptance.model.js";

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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
