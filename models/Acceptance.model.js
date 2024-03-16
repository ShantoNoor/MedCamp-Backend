import mongoose from "mongoose";
const { Schema } = mongoose;

const acceptanceSchema = new Schema(
  {
    professional_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
    },
    camp_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Camp",
      require: true,
    },
    status: {
      type: String,
      enum: ["pending", "complete"],
      default: "complete",
      require: true,
    },
  },
);

acceptanceSchema.index({ professional_id: 1, camp_id: 1 }, { unique: true });

const Acceptance = mongoose.model("Acceptance", acceptanceSchema);
export default Acceptance;
