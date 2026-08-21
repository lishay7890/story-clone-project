const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const ONE_DAY = 24 * 60 * 60 * 1000;


/* =========================
   MIDDLEWARE
========================= */

app.use(
    express.json({
        limit: "20mb"
    })
);


/* =========================
   FRONTEND
========================= */

app.use(
    express.static(__dirname)
);


/* =========================
   STORY MODEL
========================= */

const storySchema = new mongoose.Schema({

    image: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    expiresAt: {
        type: Date,
        required: true,
        index: true,
        expires: 0
    }

});


const Story = mongoose.model(
    "Story",
    storySchema
);


/* =========================
   GET STORIES
========================= */

app.get("/api/stories", async (req, res) => {

    try {

        const stories = await Story
            .find({
                expiresAt: {
                    $gt: new Date()
                }
            })
            .sort({
                createdAt: -1
            });

        res.json(stories);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to load stories."
        });

    }

});


/* =========================
   CREATE STORY
========================= */

app.post("/api/stories", async (req, res) => {

    try {

        const { image } = req.body;

        if (!image) {

            return res.status(400).json({
                message: "Image is required."
            });

        }

        const now = new Date();

        const story = await Story.create({

            image: image,

            createdAt: now,

            expiresAt: new Date(
                now.getTime() + ONE_DAY
            )

        });

        res.status(201).json(story);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to save story."
        });

    }

});


/* =========================
   DELETE ONE STORY
========================= */

app.delete("/api/stories/:id", async (req, res) => {

    try {

        const deletedStory =
            await Story.findByIdAndDelete(
                req.params.id
            );

        if (!deletedStory) {

            return res.status(404).json({
                message: "Story not found."
            });

        }

        res.json({
            message: "Story deleted."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to delete story."
        });

    }

});


/* =========================
   DELETE ALL STORIES
========================= */

app.delete("/api/stories", async (req, res) => {

    try {

        await Story.deleteMany({});

        res.json({
            message: "All stories deleted."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: "Failed to delete stories."
        });

    }

});


/* =========================
   MONGODB CONNECTION
========================= */

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {

        console.log("MongoDB Atlas connected");

        app.listen(PORT, () => {

            console.log(
                `Server running at http://localhost:${PORT}`
            );

        });

    })
    .catch((error) => {

        console.error(
            "MongoDB connection failed:"
        );

        console.error(
            error.message
        );

    });