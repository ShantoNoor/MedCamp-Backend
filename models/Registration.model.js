import mongoose from "mongoose";
const { Schema } = mongoose;

const registrationSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    camp_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camp",
      require: true,
    },
    name: {
      type: String,
      require: true,
    },
    phone: {
      require: true,
      type: String,
      default: "",
    },
    age: {
      require: true,
      type: Number,
    },
    emergency_contact: {
      require: true,
      type: String,
      default: "",
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      require: true,
    },
    fees: {
      type: Number,
      min: 1,
      require: true,
    },
    weight: {
      type: Number,
      min: 0,
      require: true,
    },
    height: {
      type: Number,
      min: 0,
      require: true,
    },
    address: {
      require: true,
      type: String,
      default: "",
    },
    payment_status: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
      require: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    review: {
      type: String,
      default: "",
    },
    review_photos: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

registrationSchema.index({ user_id: 1, camp_id: 1 }, { unique: true });

const Registration = mongoose.model("Registration", registrationSchema);
export default Registration;
