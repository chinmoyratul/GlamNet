const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Models
const Salon = require('./models/Salon');
const Barber = require('./models/Barber');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/glamnet', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const createTestBarber = async () => {
    await connectDB();

    try {
        // 1. Get a salon
        const salon = await Salon.findOne();
        if (!salon) {
            console.log("No salons found! Cannot create barber.");
            process.exit(0);
        }
        console.log(`Using Salon: ${salon.name} (ID: ${salon._id})`);

        // 2. Find or Create User
        let user = await User.findOne({ email: 'staff@example.com' });
        if (!user) {
            console.log("Creating test user for barber...");
            user = await User.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'staff@example.com',
                password: 'password123',
                phoneNumber: '1234567890',
                role: 'barber',
                isEmailVerified: true
            });
            console.log("User created.");
        } else {
            console.log(`Found existing user: ${user.email} (ID: ${user._id})`);
        }

        // 3. Find or Create Barber
        let barber = await Barber.findOne({ salonId: salon._id, userId: user._id });
        if (!barber) {
            console.log("Creating barber profile...");
            barber = await Barber.create({
                userId: user._id,
                salonId: salon._id,
                specialty: 'General Haircuts',
                experienceYears: 5,
                rating: 4.8,
                totalReviews: 10
            });
            console.log(`Barber profile created with ID: ${barber._id}`);
        } else {
            console.log(`Barber profile already exists: ${barber._id}`);
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        mongoose.connection.close();
    }
};

createTestBarber();
