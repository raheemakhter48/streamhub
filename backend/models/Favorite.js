import mongoose from 'mongoose';

const favoriteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channelName: {
    type: String,
    required: true
  },
  channelUrl: {
    type: String,
    required: true
  },
  channelLogo: {
    type: String,
    default: null
  },
  category: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  unique: true,
  uniqueCaseInsensitive: true
});

// Compound index to prevent duplicates
favoriteSchema.index({ user: 1, channelUrl: 1 }, { unique: true });

const Favorite = mongoose.model('Favorite', favoriteSchema);

export default Favorite;

