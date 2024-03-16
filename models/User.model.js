import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    require: true,
    type: String,
  },
  status: {
    type: String,
    enum: ["organizer", "participant", "professionals"],
    default: "participant",
    require: true,
  },
  email: {
    require: true,
    type: String,
    unique: true,
  },
  phone: {
    require: false,
    type: String,
    default: ''
  },
  photo: {
    require: false,
    type: String,
    default: ''
  },
  age: {
    require: true,
    type: Number,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
    require: true,
  },
  address: {
    require: false,
    type: String,
    default: ''
  },
});

const User = mongoose.model("User", userSchema);
export default User;
