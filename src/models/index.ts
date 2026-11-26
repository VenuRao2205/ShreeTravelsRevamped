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
    customerPhone: { type: String, trim: true },
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
          billId: { type: Schema.Types.ObjectId }, // the saved bill (PDF) shown with this invoice
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

const billItemSchema = new Schema(
  {
    start: String, end: String, passenger: String, from: String, taxiNo: String, carType: String, dutySlip: String,
    kind: String, rateLabel: String, kms: Number, hours: Number, rate: Number, amount: Number, toll: Number, parking: Number,
    batta: Number, nightBata: Number, permit: Number, bookingId: String, tripDate: String, startKm: Number, endKm: Number, route: String, employeeId: String, empEmail: String,
  },
  { _id: false },
);

// A tax invoice (bill) made in the admin. The PDF is drawn from this data on demand, so no files are stored.
const billSchema = new Schema(
  {
    billNo: { type: String, required: true, unique: true, index: true, trim: true },
    billDate: { type: String, required: true }, // YYYY-MM-DD
    customerName: { type: String, required: true, trim: true },
    customerCity: String, bookedBy: String, customerGstin: String, customerEmail: String, customerPhone: String,
    items: { type: [billItemSchema], default: [] },
    gstMode: { type: String, enum: ["cgst_sgst", "igst", "none"], default: "cgst_sgst" },
    gstRate: { type: Number, default: 5 },
    rcm: { type: Boolean, default: false },
    notes: String,
    showStamp: { type: Boolean, default: true },
    company: { type: Schema.Types.Mixed, default: {} },
    totals: {
      subtotal: Number, kms: Number, toll: Number, parking: Number, cgst: Number, sgst: Number, igst: Number,
      rcmCgst: Number, rcmSgst: Number, rcmIgst: Number, rcmTax: Number, total: Number,
    },
  },
  { timestamps: true },
);

// A customer's own MIS Excel sheet, kept as a template with the column mapping for it. One per customer.
const misTemplateSchema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerKey: { type: String, required: true, unique: true, index: true }, // lower-case customer name
    fileName: String,
    file: { type: Buffer, required: true },
    headerRow: Number,
    dataStartRow: Number,
    columns: [{ _id: false, col: Number, header: String, source: String, text: String, formula: String }],
    people: [{ _id: false, name: String, employeeId: String, email: String, department: String }],
  },
  { timestamps: true },
);

export type Lead = InferSchemaType<typeof leadSchema>;
export type PaymentDoc = InferSchemaType<typeof paymentSchema>;
export type Review = InferSchemaType<typeof reviewSchema>;
export type BillDoc = InferSchemaType<typeof billSchema>;
export type PaymentRequestDoc = InferSchemaType<typeof paymentRequestSchema>;

export const MisTemplateModel: Model<InferSchemaType<typeof misTemplateSchema>> =
  mongoose.models.MisTemplate || mongoose.model("MisTemplate", misTemplateSchema);
export const LeadModel: Model<Lead> =
  mongoose.models.Lead || mongoose.model<Lead>("Lead", leadSchema);
export const PaymentModel: Model<PaymentDoc> =
  mongoose.models.Payment || mongoose.model<PaymentDoc>("Payment", paymentSchema);
export const ReviewModel: Model<Review> =
  mongoose.models.Review || mongoose.model<Review>("Review", reviewSchema);
export const PaymentRequestModel: Model<PaymentRequestDoc> =
  mongoose.models.PaymentRequest || mongoose.model<PaymentRequestDoc>("PaymentRequest", paymentRequestSchema);
export const BillModel: Model<BillDoc> =
  mongoose.models.Bill || mongoose.model<BillDoc>("Bill", billSchema);
