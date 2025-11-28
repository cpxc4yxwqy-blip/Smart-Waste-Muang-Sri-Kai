import mongoose from 'mongoose';

export interface ISubscription extends mongoose.Document {
  userId: string;
  role: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  lastNotified?: Date;
}

const subscriptionSchema = new mongoose.Schema<ISubscription>({
  userId: { type: String, required: true, index: true },
  role: { type: String, required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true }
  },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  lastNotified: { type: Date }
});

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
