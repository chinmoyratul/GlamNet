# Authentication Features Documentation

This document describes the new authentication features added to GlamNet.

## Features Added

### 1. Forgot Password Module
- Users can request a password reset via email
- Secure token-based password reset flow
- Email sent with reset link (expires in 10 minutes)

**Routes:**
- `POST /api/auth/forgotpassword` - Request password reset
- `PUT /api/auth/resetpassword/:resettoken` - Reset password with token

**Frontend Pages:**
- `/forgot-password` - Forgot password form
- `/reset-password/:resettoken` - Reset password form

### 2. CAPTCHA Module
- Google reCAPTCHA v2 integration for login security
- Prevents automated login attempts
- Optional (only active if configured)

**Configuration:**
- Frontend: `REACT_APP_RECAPTCHA_SITE_KEY`
- Backend: `RECAPTCHA_SECRET_KEY`

### 3. Google Sign-In
- OAuth 2.0 authentication with Google
- Automatic user creation for new Google users
- Seamless login experience

**Route:**
- `POST /api/auth/google` - Google OAuth login

**Configuration:**
- Frontend: `REACT_APP_GOOGLE_CLIENT_ID`
- Backend: `GOOGLE_CLIENT_ID`

### 4. Apple Sign-In
- OAuth authentication with Apple
- Support for Apple ID login
- Automatic user creation for new Apple users

**Route:**
- `POST /api/auth/apple` - Apple OAuth login

**Note:** Apple Sign-In requires additional configuration in Apple Developer Console.

## Environment Variables

Add these to your `.env` file:

### Backend (.env in root)
```env
# Existing variables
PORT=5000
MONGODB_URI=mongodb://localhost:27017/glamnet
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
NODE_ENV=development

# Email configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
FRONTEND_URL=http://localhost:3000

# CAPTCHA
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# Apple OAuth (if needed)
# APPLE_CLIENT_ID=your_apple_client_id
# APPLE_TEAM_ID=your_apple_team_id
# APPLE_KEY_ID=your_apple_key_id
# APPLE_PRIVATE_KEY=your_apple_private_key
```

### Frontend (.env in frontend/)
```env
# API URL
REACT_APP_API_URL=http://localhost:5000/api

# CAPTCHA
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key

# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

## Setup Instructions

### 1. Google reCAPTCHA Setup
1. Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Create a new site (reCAPTCHA v2)
3. Add your domain (localhost for development)
4. Copy the Site Key to `REACT_APP_RECAPTCHA_SITE_KEY`
5. Copy the Secret Key to `RECAPTCHA_SECRET_KEY`

### 2. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized JavaScript origins: `http://localhost:3000`
6. Add authorized redirect URIs: `http://localhost:3000`
7. Copy Client ID to both frontend and backend `.env` files

### 3. Apple Sign-In Setup (Optional)
1. Go to [Apple Developer Console](https://developer.apple.com/)
2. Create an App ID with Sign in with Apple capability
3. Create a Service ID
4. Configure domains and redirect URLs
5. Generate a private key
6. Add credentials to backend `.env`

### 4. Email Configuration
For password reset emails, configure SMTP settings:
- **Gmail**: Use App Password (not regular password)
- **Other providers**: Use appropriate SMTP settings

## User Model Updates

The User model now includes:
- `googleId`: Google user ID
- `appleId`: Apple user ID
- `provider`: Authentication provider ('local', 'google', 'apple')
- `resetPasswordToken`: Token for password reset
- `resetPasswordExpire`: Expiration time for reset token

## Security Notes

1. **CAPTCHA**: Only active when both frontend and backend keys are configured
2. **Password Reset**: Tokens expire after 10 minutes
3. **OAuth Users**: Cannot use password login (must use OAuth)
4. **Email Verification**: Ensure SMTP credentials are secure

## Testing

### Test Forgot Password
1. Go to `/forgot-password`
2. Enter registered email
3. Check email for reset link
4. Click link and set new password

### Test Google Sign-In
1. Ensure `REACT_APP_GOOGLE_CLIENT_ID` is set
2. Click "Sign in with Google" on login page
3. Complete Google authentication
4. Should redirect to dashboard

### Test CAPTCHA
1. Ensure both CAPTCHA keys are set
2. Attempt to login
3. Complete CAPTCHA verification
4. Login should proceed

## Troubleshooting

### CAPTCHA not showing
- Check `REACT_APP_RECAPTCHA_SITE_KEY` is set in frontend `.env`
- Verify domain is registered in reCAPTCHA console

### Google Sign-In not working
- Verify `REACT_APP_GOOGLE_CLIENT_ID` matches backend `GOOGLE_CLIENT_ID`
- Check authorized origins in Google Cloud Console
- Ensure OAuth consent screen is configured

### Password reset email not sending
- Verify SMTP credentials
- Check email service allows SMTP (Gmail requires App Password)
- Check spam folder

### OAuth users can't login with password
- This is expected behavior
- OAuth users must use their OAuth provider to login

