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
    // Set when the payment was made from a customer's invoice login
    requestId: { type: Schema.Types.ObjectId, index: true },
    invoiceKeys: { type: [String], default: undefined },
  },
  { timestamps: true },
);

// A set of invoices the owner shares with one customer, behind a short-lived login.
const paymentRequestSchema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    loginId: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true }, // scrypt, never the password itself
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    lastLoginAt: Date,
    invoices: [
      new Schema(
        {
          key: { type: String, required: true },
          number: { type: String, required: true, trim: true },
          date: { type: Date, required: true },
          amount: { type: Number, required: true }, // paise
          status: { type: String, enum: ["UNPAID", "PAID"], default: "UNPAID" },
          paidOrderId: String,
          paidAt: Date,
        },
        { _id: false },
      ),
    ],
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
export type PaymentRequestDoc = InferSchemaType<typeof paymentRequestSchema>;

export const LeadModel: Model<Lead> =
  mongoose.models.Lead || mongoose.model<Lead>("Lead", leadSchema);
export const PaymentModel: Model<PaymentDoc> =
  mongoose.models.Payment || mongoose.model<PaymentDoc>("Payment", paymentSchema);
export const ReviewModel: Model<Review> =
  mongoose.models.Review || mongoose.model<Review>("Review", reviewSchema);
export const PaymentRequestModel: Model<PaymentRequestDoc> =
  mongoose.models.PaymentRequest || mongoose.model<PaymentRequestDoc>("PaymentRequest", paymentRequestSchema);
