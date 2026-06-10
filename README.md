# GlamNet - Smart Salon Network System

A smart, AI-assisted web platform designed to connect customers with salons, barbers, and beauty service providers. Built with the MERN stack (MongoDB, Express.js, React.js, Node.js).

## 🎯 Features

- **Smart Recommendation Module**: AI-powered salon and service recommendations
- **Online Appointment Booking**: Easy booking system with real-time availability
- **Salon Schedule Management**: Complete schedule management for salon staff
- **Service & Offer Management**: Create and manage services and promotional offers
- **Customer Feedback & Rating System**: Review system with sentiment analysis
- **Secure Authentication**: JWT-based authentication system
- **Real-time Updates**: Live schedule updates and notifications

## 🛠️ Tech Stack

### Backend
- Node.js & Express.js
- MongoDB & Mongoose
- JWT Authentication
- Sentiment Analysis (AI)
- Bcrypt for password hashing

### Frontend
- React.js
- React Router
- Axios
- TailwindCSS

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GlamNet
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

   Or use the combined command:
   ```bash
   npm run install-all
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/glamnet
   # Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/glamnet
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRE=7d
   NODE_ENV=development
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   FRONTEND_URL=http://localhost:3000
   ```

5. **Run the application**
   
   Development mode (with nodemon):
   ```bash
   npm run dev
   ```
   
   In a separate terminal, start the frontend:
   ```bash
   npm run client
   ```

## 📁 Project Structure

```
GlamNet/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Barber.js
│   │   ├── Salon.js
│   │   ├── Appointment.js
│   │   ├── Service.js
│   │   ├── Review.js
│   │   ├── Offer.js
│   │   ├── ScheduleSlot.js
│   │   ├── ChatSession.js
│   │   └── SentimentAnalysis.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── customers.js
│   │   ├── salons.js
│   │   ├── appointments.js
│   │   ├── reviews.js
│   │   └── recommendations.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── salonController.js
│   │   ├── appointmentController.js
│   │   ├── reviewController.js
│   │   └── recommendationController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── utils/
│   │   ├── sentimentAnalysis.js
│   │   └── recommendations.js
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🚀 Usage

### Customer Flow
1. Register/Login
2. Browse salons
3. View salon details and services
4. Select service and time slot
5. Book appointment
6. View bookings in dashboard
7. Add review after completion

### Salon Staff Flow
1. Login
2. Access salon dashboard
3. Manage services & offers
4. Manage schedule
5. View appointments

## 🔒 Security Features

- Password encryption with bcrypt
- JWT token-based authentication
- Input validation
- Secure API endpoints
- Protected routes

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/logout` - Logout user
- `PUT /api/auth/profile` - Update profile

### Salons
- `GET /api/salons` - Get all salons
- `GET /api/salons/:id` - Get salon details
- `POST /api/salons` - Create salon (admin)
- `PUT /api/salons/:id` - Update salon

### Appointments
- `GET /api/appointments` - Get user appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Reviews
- `GET /api/reviews/salon/:salonId` - Get salon reviews
- `POST /api/reviews` - Submit review
- `PUT /api/reviews/:id` - Edit review
- `DELETE /api/reviews/:id` - Delete review

## 🤖 AI Features

- **Recommendation Engine**: Suggests salons based on user history, ratings, and popular services
- **Sentiment Analysis**: Analyzes review text to determine sentiment (positive/negative/neutral)

## 📝 License

This project is created for educational purposes.

## 👥 Contributors

Created for Software Engineering Course

