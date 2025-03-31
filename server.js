const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your_jwt_secret_key'; // Replace with your own secret key

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/streamflix', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define User schema and model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    subscription: { type: String, default: null },
});

const User = mongoose.model('User', userSchema);

// Define Subscription schema and model
const subscriptionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    features: { type: [String], required: true },
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

// User registration endpoint
app.post('/register', async (req, res) => {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: 'User registration failed' });
    }
});

// User login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, message: 'Login successful' });
});

// Subscription endpoint
app.post('/subscribe', async (req, res) => {
    const { token, subscriptionName } = req.body;

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const subscription = await Subscription.findOne({ name: subscriptionName });
        if (!subscription) {
            return res.status(400).json({ error: 'Invalid subscription' });
        }

        await User.findByIdAndUpdate(userId, { subscription: subscriptionName });
        res.json({ message: 'Subscription updated successfully' });
    } catch (error) {
        res.status(400).json({ error: 'Subscription update failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});