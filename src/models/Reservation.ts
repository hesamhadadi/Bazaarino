import mongoose, { Schema, Document } from 'mongoose';

export type ReservationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface IReservation extends Document {
  adId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  nights: number;
  nightlyPrice: number;
  totalPrice: number;
  status: ReservationStatus;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true, index: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    nights: { type: Number, required: true, min: 1 },
    nightlyPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    approvedAt: { type: Date },
    rejectedAt: { type: Date },
    rejectionReason: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

ReservationSchema.index({ adId: 1, status: 1, startDate: 1, endDate: 1 });
ReservationSchema.index({ buyerId: 1, createdAt: -1 });
ReservationSchema.index({ sellerId: 1, createdAt: -1 });

const Reservation = mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);

export default Reservation;
