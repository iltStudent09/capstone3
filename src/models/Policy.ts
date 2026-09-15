import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPolicy extends Document {
  policyNumber: string;
  holderName: string;
  type: 'auto' | 'home' | 'life';
  premium: number;
  status: 'active' | 'expired' | 'cancelled';
  effectiveDate: Date;
  expirationDate: Date;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const policySchema = new Schema<IPolicy>(
  {
    policyNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    holderName: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['auto', 'home', 'life'],
      required: true,
    },
    premium: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      required: true,
    },
    effectiveDate: {
      type: Date,
    },
    expirationDate: {
      type: Date,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<IPolicy>('Policy', policySchema);
