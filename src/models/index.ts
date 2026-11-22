import mongoose, { Schema, InferSchemaType, Model } from "mongoose";

const leadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    service: { type: String, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "closed"],
      default: "new",
    },
    source: { type: String, default: "contact-form" },
  },
  { timestamps: true },
);

const paymentSchema = new Schema(
  {
    merchantOrderId: { type: String, required: true, unique: true, index: true },
    phonepeOrderId: String,
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    remarks: String,
    amount: { type: Number, required: true }, // paise
    currency: { type: String, default: "INR" },
    state: {
      type: String,
      enum: ["INITIATED", "PENDING", "COMPLETED", "FAILED"],
      default: "INITIATED",
    },
    notified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const reviewSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    company: { type: String, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    approved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type Lead = InferSchemaType<typeof leadSchema>;
export type PaymentDoc = InferSchemaType<typeof paymentSchema>;
export type Review = InferSchemaType<typeof reviewSchema>;

export const LeadModel: Model<Lead> =
  mongoose.models.Lead || mongoose.model<Lead>("Lead", leadSchema);
export const PaymentModel: Model<PaymentDoc> =
  mongoose.models.Payment || mongoose.model<PaymentDoc>("Payment", paymentSchema);
export const ReviewModel: Model<Review> =
  mongoose.models.Review || mongoose.model<Review>("Review", reviewSchema);
