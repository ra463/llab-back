import mongoose from "mongoose";

const schema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Title is required"],
    minLength: [8, "Title must be at least 8 characters"],
    maxLength: [50, "Title must be less than 50 characters"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    minLength: [20, "Title must be at least 20 characters"],
  },
  lectures: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      video: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    },
  ],
  poster: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  views: {
    type: Number,
    default: 0,
  },
  numOfVideos: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: [true, "CreatedBy is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Course = mongoose.model("Course", schema);
