import mongoose from 'mongoose';

const recentlyWatchedSchema = new mongoose.Schema({
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
  watchedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
recentlyWatchedSchema.index({ user: 1, watchedAt: -1 });

const RecentlyWatched = mongoose.model('RecentlyWatched', recentlyWatchedSchema);

export default RecentlyWatched;

