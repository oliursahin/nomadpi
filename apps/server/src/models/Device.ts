import mongoose from 'mongoose';
import { Device } from '@nomadpi/shared';

interface DeviceDocument extends mongoose.Document, Omit<Device, 'id' | 'userId'> {
  user: mongoose.Types.ObjectId;
}

const deviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  configGenerated: {
    type: Boolean,
    default: false
  },
  configPath: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const DeviceModel = mongoose.model<DeviceDocument>('Device', deviceSchema);
