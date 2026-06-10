const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Models
const Salon = require('./models/Salon');
const Barber = require('./models/Barber');
const ScheduleSlot = require('./models/ScheduleSlot');

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

const debugSlots = async () => {
    await connectDB();

    try {
        // 1. Get a salon (likely the one being used, but we'll list the first few)
        const salons = await Salon.find().limit(1);
        if (salons.length === 0) {
            console.log("No salons found!");
            process.exit(0);
        }

        const salon = salons[0];
        console.log(`Checking Salon: ${salon.name} (ID: ${salon._id})`);
        console.log(`Opening Hours: ${salon.openingTime} - ${salon.closingTime}`);

        // 2. Check Barbers
        const barbers = await Barber.find({ salonId: salon._id });
        console.log(`Found ${barbers.length} barbers for this salon.`);

        if (barbers.length === 0) {
            console.warn("WARNING: No barbers found for this salon. This is likely the cause of 'no slots'.");
        } else {
            console.log("Barbers:", barbers.map(b => b._id));
        }

        // 3. Simulate getAvailableSlots logic for TODAY
        const dateStr = new Date().toISOString().split('T')[0]; // Today
        console.log(`\nSimulating getAvailableSlots for date: ${dateStr}`);

        let targetBarberId = 'default';

        // Logic from controller
        let realBarberId = targetBarberId;
        if (targetBarberId === 'default') {
            const firstBarber = await Barber.findOne({ salonId: salon._id });
            if (!firstBarber) {
                console.log("Controller Logic: No barbers found for this salon to show available slots (404 expected).");
            } else {
                realBarberId = firstBarber._id;
                console.log(`Controller Logic: Defaulting to barber ${realBarberId}`);
            }
        }

        if (realBarberId !== 'default') {
            const startOfDay = new Date(dateStr);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(dateStr);
            endOfDay.setHours(23, 59, 59, 999);

            let slots = await ScheduleSlot.find({
                barberId: realBarberId,
                salonId: salon._id,
                date: { $gte: startOfDay, $lte: endOfDay },
                isBooked: false
            }).sort({ startTime: 1 });

            console.log(`Found ${slots.length} existing slots in DB.`);

            if (slots.length === 0) {
                console.log("Generating virtual slots...");
                const generatedSlots = [];
                let [openHour, openMin] = salon.openingTime.split(':').map(Number);
                const [closeHour, closeMin] = salon.closingTime.split(':').map(Number);

                console.log(`Parsing hours: Open ${openHour}:${openMin}, Close ${closeHour}:${closeMin}`);

                let currentHour = openHour;
                let currentMin = openMin;

                while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
                    const nextMin = (currentMin + 30) % 60;
                    const nextHour = currentHour + Math.floor((currentMin + 30) / 60);

                    if (nextHour > closeHour || (nextHour === closeHour && nextMin > closeMin)) break;

                    const startTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
                    const endTimeStr = `${nextHour.toString().padStart(2, '0')}:${nextMin.toString().padStart(2, '0')}`;

                    generatedSlots.push({
                        startTime: startTimeStr,
                        endTime: endTimeStr
                    });

                    currentHour = nextHour;
                    currentMin = nextMin;
                }
                console.log(`Generated ${generatedSlots.length} virtual slots.`);
                if (generatedSlots.length > 0) {
                    console.log("First 3 slots:", generatedSlots.slice(0, 3));
                }
            }
        }

    } catch (error) {
        console.error("Error during debug:", error);
    } finally {
        mongoose.connection.close();
    }
};

debugSlots();
