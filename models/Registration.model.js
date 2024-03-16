import mongoose from "mongoose";
const { Schema } = mongoose;

const registrationSchema = new Schema(
  {
    organizer: {
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
    participant_count: {
      type: Number,
      require: true,
    },
    status: {
      type: String,
      enum: ["upcoming", "publish", "complete"],
      default: "publish",
      require: true,
    },
    
    // payment_status: {
    //   type: String,
    //   enum: ["paid", "unpaid"],
    //   default: "unpaid",
    //   require: true,
    // },
    // rating: {
    //   type: Number,
    //   default: 0,
    // },
    // review_giving_date: {
    //   type: Date,
    // },
  },
  {
    timestamps: true,
  }
);

const Registration = mongoose.model("Registration", registrationSchema);
export default Registration;
