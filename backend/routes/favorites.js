import express from 'express';
import { protect } from '../middleware/auth.js';
import Favorite from '../models/Favorite.js';
import RecentlyWatched from '../models/RecentlyWatched.js';

const router = express.Router();

// ========== FAVORITES ==========

// @route   GET /api/favorites
// @desc    Get user's favorites
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: favorites.map(fav => ({
        id: fav._id,
        channelName: fav.channelName,
        channelUrl: fav.channelUrl,
        channelLogo: fav.channelLogo,
        category: fav.category,
        createdAt: fav.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/favorites
// @desc    Add channel to favorites
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { channelName, channelUrl, channelLogo, category } = req.body;

    if (!channelName || !channelUrl) {
      return res.status(400).json({
        success: false,
        message: 'Channel name and URL are required'
      });
    }

    // Check if already favorited
    const existing = await Favorite.findOne({
      user: req.user._id,
      channelUrl
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Channel already in favorites'
      });
    }

    const favorite = await Favorite.create({
      user: req.user._id,
      channelName,
      channelUrl,
      channelLogo: channelLogo || null,
      category: category || null
    });

    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      data: {
        id: favorite._id,
        channelName: favorite.channelName,
        channelUrl: favorite.channelUrl,
        channelLogo: favorite.channelLogo,
        category: favorite.category
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Channel already in favorites'
      });
    }
    next(error);
  }
});

// @route   DELETE /api/favorites/:channelUrl
// @desc    Remove channel from favorites
// @access  Private
router.delete('/:channelUrl', protect, async (req, res, next) => {
  try {
    const { channelUrl } = req.params;
    const decodedUrl = decodeURIComponent(channelUrl);

    const favorite = await Favorite.findOneAndDelete({
      user: req.user._id,
      channelUrl: decodedUrl
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }

    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    next(error);
  }
});

// ========== RECENTLY WATCHED ==========

// @route   GET /api/favorites/recently-watched
// @desc    Get user's recently watched channels
// @access  Private
router.get('/recently-watched', protect, async (req, res, next) => {
  try {
    const recentlyWatched = await RecentlyWatched.find({ user: req.user._id })
      .sort({ watchedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: recentlyWatched.map(item => ({
        id: item._id,
        channelName: item.channelName,
        channelUrl: item.channelUrl,
        channelLogo: item.channelLogo,
        category: item.category,
        watchedAt: item.watchedAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/favorites/recently-watched
// @desc    Add channel to recently watched
// @access  Private
router.post('/recently-watched', protect, async (req, res, next) => {
  try {
    const { channelName, channelUrl, channelLogo, category } = req.body;

    if (!channelName || !channelUrl) {
      return res.status(400).json({
        success: false,
        message: 'Channel name and URL are required'
      });
    }

    // Delete existing entry to avoid duplicates
    await RecentlyWatched.deleteOne({
      user: req.user._id,
      channelUrl
    });

    // Insert new entry
    const recentlyWatched = await RecentlyWatched.create({
      user: req.user._id,
      channelName,
      channelUrl,
      channelLogo: channelLogo || null,
      category: category || null
    });

    res.status(201).json({
      success: true,
      data: {
        id: recentlyWatched._id,
        channelName: recentlyWatched.channelName,
        channelUrl: recentlyWatched.channelUrl,
        channelLogo: recentlyWatched.channelLogo,
        category: recentlyWatched.category,
        watchedAt: recentlyWatched.watchedAt
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;

