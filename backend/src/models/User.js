const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Ensure passwordHash is excluded from query results by default
    },
  },
  {
    timestamps: true,
  },
);

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;
