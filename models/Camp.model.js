import mongoose from "mongoose";
const { Schema } = mongoose;

const campSchema = new Schema(
  {
    organizer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    name: {
      type: String,
      require: true,
    },
    details: {
      type: String,
      require: true,
    },
    purpose: {
      type: String,
      require: true,
    },
    photo: {
      require: false,
      type: String,
      default: ''
    },
    fees: {
      type: Number,
      min: 1,
      require: true,
    },
    date_and_time: {
      type: Date,
      require: true,
    },
    venue: {
      type: String,
      default: "",
    },
    services: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["upcoming", "publish", "complete"],
      default: "publish",
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

const Camp = mongoose.model("Camp", campSchema);
export default Camp;
