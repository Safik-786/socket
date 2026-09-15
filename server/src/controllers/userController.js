import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key';

export const loginUser = async (req, res) => {
  try {
    const { username } = req.body;
    let user = await User.findOne({ username });
    if (!user) {
      user = new User({ username });
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: '30d',
    });

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { exclude } = req.query; // Allow excluding current user
    const query = exclude ? { _id: { $ne: exclude } } : {};
    const users = await User.find(query).select('-__v');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
