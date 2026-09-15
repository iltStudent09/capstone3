import mongoose, { Schema, Document, Types } from 'mongoose';

interface INote {
  author: Types.ObjectId;
  text: string;
  createdAt: Date;
}

export interface IClaim extends Document {
  claimNumber: string;
  policy: Types.ObjectId;
  description: string;
  incidentDate: Date;
  amount: number;
  status: 'submitted' | 'under-review' | 'approved' | 'denied' | 'closed';
  assignedTo: Types.ObjectId;
  notes: INote[];
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const claimSchema = new Schema<IClaim>(
  {
    claimNumber: {
      type: String,
      unique: true,
    },
    policy: {
      type: Schema.Types.ObjectId,
      ref: 'Policy',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    incidentDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ['submitted', 'under-review', 'approved', 'denied', 'closed'],
      default: 'submitted',
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: [noteSchema],
  },
  { timestamps: true }
);

// Pre-save hook to generate claimNumber
claimSchema.pre('save', async function () {
  if (!this.isNew) {
    return;
  }

  if (this.claimNumber) {
    return;
  }

  const lastClaim = await mongoose.model('Claim').findOne().sort({ _id: -1 });
  let nextNumber = 1001;

  if (lastClaim && lastClaim.claimNumber) {
    const lastNumber = parseInt(lastClaim.claimNumber.split('-')[1], 10);
    nextNumber = Number.isNaN(lastNumber) ? 1001 : lastNumber + 1;
  }

  this.claimNumber = `CLM-${nextNumber}`;
});

export default mongoose.model<IClaim>('Claim', claimSchema);
