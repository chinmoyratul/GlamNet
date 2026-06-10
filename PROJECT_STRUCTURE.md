# GlamNet Project Structure

## Overview
This document describes the complete structure of the GlamNet MERN stack application.

## Directory Structure

```
GlamNet/
├── backend/                    # Node.js/Express Backend
│   ├── config/                # Configuration files
│   │   └── db.js              # MongoDB connection
│   ├── controllers/           # Request handlers
│   │   ├── authController.js
│   │   ├── customerController.js
│   │   ├── salonController.js
│   │   ├── appointmentController.js
│   │   ├── reviewController.js
│   │   ├── recommendationController.js
│   │   ├── serviceController.js
│   │   ├── offerController.js
│   │   └── scheduleController.js
│   ├── middleware/             # Custom middleware
│   │   ├── auth.js            # JWT authentication
│   │   └── errorHandler.js    # Error handling
│   ├── models/                # MongoDB schemas
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
│   │   ├── SentimentAnalysis.js
│   │   └── SalonStaff.js
│   ├── routes/                # API routes
│   │   ├── auth.js
│   │   ├── customers.js
│   │   ├── salons.js
│   │   ├── appointments.js
│   │   ├── reviews.js
│   │   ├── recommendations.js
│   │   ├── services.js
│   │   ├── offers.js
│   │   └── schedules.js
│   ├── utils/                 # Utility functions
│   │   ├── sentimentAnalysis.js  # AI sentiment analysis
│   │   └── recommendations.js   # AI recommendations
│   └── server.js              # Express server entry point
│
├── frontend/                   # React Frontend
│   ├── public/                # Static files
│   │   └── index.html
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── Navbar.js
│   │   │   └── PrivateRoute.js
│   │   ├── context/           # React Context
│   │   │   └── AuthContext.js
│   │   ├── pages/             # Page components
│   │   │   ├── Home.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── Salons.js
│   │   │   ├── SalonDetail.js
│   │   │   ├── Dashboard.js
│   │   │   ├── Booking.js
│   │   │   ├── Reviews.js
│   │   │   └── SalonDashboard.js
│   │   ├── utils/             # Utility functions
│   │   │   └── api.js         # Axios configuration
│   │   ├── App.js             # Main App component
│   │   ├── index.js           # React entry point
│   │   └── index.css          # Global styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── .gitignore                 # Git ignore rules
├── package.json               # Root package.json
├── README.md                  # Project documentation
├── SETUP.md                   # Setup instructions
└── PROJECT_STRUCTURE.md       # This file

```

## Backend Architecture

### Models (Database Schemas)
All models follow the UML class diagram structure:
- **User**: Authentication and user information
- **Customer**: Customer-specific data
- **Barber**: Barber profiles and specialties
- **Salon**: Salon information and details
- **Service**: Services offered by salons
- **Appointment**: Booking records
- **Review**: Customer reviews with sentiment analysis
- **Offer**: Promotional offers
- **ScheduleSlot**: Barber availability slots
- **ChatSession**: Customer support chat
- **SentimentAnalysis**: AI analysis results
- **SalonStaff**: Staff management

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /logout` - Logout user
- `GET /me` - Get current user
- `PUT /updateprofile` - Update profile

#### Salons (`/api/salons`)
- `GET /` - Get all salons (with filters)
- `GET /:id` - Get salon details
- `GET /featured` - Get featured salons
- `POST /` - Create salon (protected)
- `PUT /:id` - Update salon (protected)

#### Appointments (`/api/appointments`)
- `GET /` - Get user appointments
- `GET /:id` - Get appointment details
- `POST /` - Create appointment (protected)
- `PUT /:id` - Update appointment (protected)
- `DELETE /:id` - Cancel appointment (protected)
- `PUT /:id/payment` - Confirm payment (protected)

#### Reviews (`/api/reviews`)
- `GET /salon/:salonId` - Get salon reviews
- `POST /` - Submit review (protected)
- `PUT /:id` - Edit review (protected)
- `DELETE /:id` - Delete review (protected)

#### Recommendations (`/api/recommendations`)
- `GET /` - Get personalized recommendations (protected)
- `GET /popular-services` - Get popular services

#### Services (`/api/services`)
- `GET /` - Get all services
- `GET /salon/:salonId` - Get services by salon
- `GET /:id/duration` - Get service duration
- `POST /` - Create service (protected)
- `PUT /:id` - Update service (protected)

#### Offers (`/api/offers`)
- `GET /` - Get all offers
- `GET /active` - Get active offers
- `GET /:id/validity` - Check offer validity
- `POST /` - Create offer (protected)
- `PUT /:id` - Update offer (protected)

#### Schedules (`/api/schedules`)
- `GET /` - Get schedule slots (protected)
- `GET /available` - Get available slots
- `GET /check-availability` - Check slot availability
- `POST /` - Add schedule (protected)
- `PUT /:id` - Update schedule (protected)
- `DELETE /:id` - Delete schedule (protected)

## Frontend Architecture

### Components
- **Navbar**: Navigation bar with authentication state
- **PrivateRoute**: Route protection component

### Pages
- **Home**: Landing page with featured salons and offers
- **Login**: User login page
- **Register**: User registration page
- **Salons**: Browse all salons with search/filter
- **SalonDetail**: Detailed salon view with services and reviews
- **Dashboard**: User dashboard with appointments and recommendations
- **Booking**: Appointment booking page
- **Reviews**: Review listing and submission
- **SalonDashboard**: Salon staff management dashboard

### Context
- **AuthContext**: Global authentication state management

### Utilities
- **api.js**: Axios instance with interceptors for authentication

## Key Features Implementation

### 1. Authentication
- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- Role-based access control

### 2. AI Features
- **Sentiment Analysis**: Uses `sentiment` npm package
- **Recommendations**: Rule-based recommendation engine
  - Based on previous bookings
  - Popular services
  - Ratings and feedback

### 3. Real-time Updates
- Schedule slot availability updates
- Appointment status changes
- Review submissions

### 4. Security
- Password encryption
- JWT token validation
- Input validation
- Protected API endpoints

## Data Flow

1. **User Registration/Login**
   - Frontend → Backend API → MongoDB
   - JWT token returned and stored

2. **Browse Salons**
   - Frontend → GET /api/salons → MongoDB
   - Display salon list

3. **Book Appointment**
   - Frontend → GET /api/schedules/available
   - Frontend → POST /api/appointments
   - Backend updates ScheduleSlot

4. **Submit Review**
   - Frontend → POST /api/reviews
   - Backend analyzes sentiment
   - Updates salon/barber ratings

5. **Get Recommendations**
   - Frontend → GET /api/recommendations
   - Backend analyzes user history
   - Returns personalized suggestions

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT (jsonwebtoken)
- Bcrypt
- Sentiment (AI)
- CORS

### Frontend
- React.js
- React Router
- Axios
- TailwindCSS
- React Icons
- React Toastify

## Development Workflow

1. Start MongoDB (local or Atlas)
2. Start backend: `npm run dev`
3. Start frontend: `npm run client`
4. Access: http://localhost:3000

## Testing Strategy

### Manual Testing
- Test all user flows
- Test authentication
- Test booking process
- Test review submission

### API Testing
- Use Postman for API testing
- Test all endpoints
- Verify authentication
- Check error handling

## Future Enhancements

- Unit tests (Jest)
- Integration tests
- Email notifications
- Payment integration
- Real-time chat
- Advanced ML recommendations
- Analytics dashboard

