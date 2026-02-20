const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const User = require('../models/User');

// GET all comments (sorted by newest, maybe limited)
router.get('/', async (req, res) => {
    try {
        const comments = await Comment.find().sort({ createdAt: -1 }).limit(50);
        // Calculate average rating
        const allRatings = await Comment.find({}, 'rating');
        const avg = allRatings.length > 0
            ? (allRatings.reduce((acc, c) => acc + c.rating, 0) / allRatings.length).toFixed(1)
            : 0;

        res.json({
            comments,
            averageRating: avg,
            totalComments: allRatings.length
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new comment
router.post('/', async (req, res) => {
    try {
        const { userId, text, rating } = req.body;

        if (!userId || !text) return res.status(400).json({ error: 'Faltan datos' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

        // Optional: Check if user already commented to prevent spam
        // const existing = await Comment.findOne({ userId });
        // if (existing) return res.status(400).json({ error: 'Ya has comentado' });

        const newComment = new Comment({
            userId,
            userName: user.name,
            text,
            rating: rating || 5
        });

        await newComment.save();
        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
