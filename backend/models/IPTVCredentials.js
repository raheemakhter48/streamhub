import mongoose from 'mongoose';

const iptvCredentialsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  providerName: {
    type: String,
    default: null
  },
  username: {
    type: String,
    default: null
  },
  password: {
    type: String,
    default: null
  },
  serverUrl: {
    type: String,
    default: null
  },
  m3uUrl: {
    type: String,
    default: null
  },
  m3uContent: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

iptvCredentialsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const IPTVCredentials = mongoose.model('IPTVCredentials', iptvCredentialsSchema);

export default IPTVCredentials;

