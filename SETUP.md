# GlamNet Setup Guide

## Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas account)
- npm or yarn

### Step-by-Step Setup

1. **Install Backend Dependencies**
   ```bash
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

   Or use the combined command:
   ```bash
   npm run install-all
   ```

3. **Configure Environment Variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/glamnet
   JWT_SECRET=your_super_secret_jwt_key_change_this
   JWT_EXPIRE=7d
   NODE_ENV=development
   ```

4. **Start MongoDB**
   
   If using local MongoDB:
   ```bash
   # Windows
   net start MongoDB
   
   # Mac/Linux
   mongod
   ```

   Or use MongoDB Atlas (cloud) - no local installation needed.

5. **Start the Backend Server**
   ```bash
   npm run dev
   ```
   
   The server will run on http://localhost:5000

6. **Start the Frontend (in a new terminal)**
   ```bash
   npm run client
   ```
   
   The frontend will run on http://localhost:3000

## Testing the Application

### 1. Register a New User
- Navigate to http://localhost:3000/register
- Fill in the registration form
- Choose account type: Customer, Barber, or Salon Staff

### 2. Create a Salon (for Salon Staff/Admin)
- Login as salon staff or admin
- Use the API endpoint: `POST /api/salons`
- Or create directly in MongoDB

### 3. Create Services
- Login as salon staff
- Navigate to Salon Dashboard
- Add services for your salon

### 4. Book an Appointment (as Customer)
- Browse salons
- Select a salon
- Choose service and time slot
- Complete booking

## API Testing with Postman

1. **Register User**
   ```
   POST http://localhost:5000/api/auth/register
   Body (JSON):
   {
     "firstName": "John",
     "lastName": "Doe",
     "email": "john@example.com",
     "phoneNumber": "1234567890",
     "password": "password123",
     "role": "customer"
   }
   ```

2. **Login**
   ```
   POST http://localhost:5000/api/auth/login
   Body (JSON):
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```
   Copy the token from response.

3. **Get Salons**
   ```
   GET http://localhost:5000/api/salons
   ```

4. **Create Appointment (with token)**
   ```
   POST http://localhost:5000/api/appointments
   Headers:
   Authorization: Bearer YOUR_TOKEN_HERE
   Body (JSON):
   {
     "barberId": "barber_id",
     "salonId": "salon_id",
     "serviceId": "service_id",
     "scheduleSlotId": "slot_id",
     "appointmentDateTime": "2024-01-15T10:00:00Z"
   }
   ```

## Database Schema Overview

The application uses MongoDB with the following main collections:
- Users (authentication)
- Customers (customer profiles)
- Barbers (barber profiles)
- Salons (salon information)
- Services (salon services)
- Appointments (booking records)
- Reviews (customer reviews)
- Offers (promotional offers)
- ScheduleSlots (barber availability)
- ChatSessions (customer support)
- SentimentAnalysis (AI analysis results)

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify network connectivity for MongoDB Atlas

### Port Already in Use
- Change PORT in .env file
- Or kill the process using the port

### Frontend Not Connecting to Backend
- Check proxy setting in frontend/package.json
- Verify backend is running on correct port
- Check CORS settings in backend/server.js

### Authentication Issues
- Verify JWT_SECRET is set in .env
- Check token expiration
- Ensure token is included in Authorization header

## Production Deployment

### Backend (Render/Railway/Heroku)
1. Set environment variables
2. Connect MongoDB Atlas
3. Deploy code

### Frontend (Vercel/Netlify)
1. Set REACT_APP_API_URL environment variable
2. Build and deploy

## Next Steps

- Add email verification
- Implement payment integration
- Add real-time notifications
- Enhance AI recommendations
- Add more analytics

