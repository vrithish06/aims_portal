# OTP Login Implementation - Deployment Checklist

## Pre-Deployment Setup

### Email Configuration
- [ ] Have Gmail account with 2FA enabled
- [ ] Generated App Password in Gmail settings
- [ ] Created `.env` file in `/backend` directory
- [ ] Added `EMAIL_SERVICE=gmail`
- [ ] Added `EMAIL_USER=your-email@gmail.com`
- [ ] Added `EMAIL_PASSWORD=app-password` (16 characters from Gmail)
- [ ] Verified `.env` is in `.gitignore`

### Dependencies
- [ ] Ran `npm install nodemailer` in backend
- [ ] Verified `nodemailer` in `package.json` dependencies
- [ ] Ran `npm install` to update lock files

### Backend Code
- [ ] `/backend/config/mailer.js` exists and contains transporter config
- [ ] `/backend/utils/otpUtils.js` exists with OTP helper functions
- [ ] `/backend/controllers/aimsController.js` has `sendOTP` and `verifyOTP` exports
- [ ] `/backend/routes/AimsRoutes.js` imports `sendOTP` and `verifyOTP`
- [ ] `/backend/routes/AimsRoutes.js` has routes `/send-otp` and `/verify-otp`

### Frontend Code
- [ ] `/frontend/src/store/authStore.js` has `sendOTP` and `verifyOTP` methods
- [ ] `/frontend/src/pages/LoginPage.jsx` implements 2-step flow
- [ ] No syntax errors in modified files

### Database
- [ ] Verified `otp_codes` table exists in Supabase
- [ ] Confirmed table has all required columns: `id`, `email`, `otp_code`, `expires_at`, `is_used`, `created_at`, `created_ip`
- [ ] Table has foreign key constraint to `users` table

---

## Local Testing

### Backend Testing
- [ ] Run `npm run dev` in backend directory
- [ ] Check console for "[MAILER] ✅ Server is ready to send emails"
- [ ] No connection errors in logs

### Frontend Testing
- [ ] Run `npm run dev` in frontend directory
- [ ] Navigate to `http://localhost:5173/login` (or appropriate login route)
- [ ] See email input form

### Send OTP Flow
- [ ] Enter valid user email (e.g., `student@iitrpr.ac.in`)
- [ ] Click "Send OTP" button
- [ ] See success toast notification
- [ ] Check inbox for email with OTP
- [ ] Email contains 6-digit OTP code
- [ ] Form switches to OTP input screen

### OTP Verification Flow
- [ ] Receive OTP in email
- [ ] Enter OTP (6 digits) in login form
- [ ] Click "Verify & Login"
- [ ] See success notification
- [ ] Redirected to dashboard
- [ ] Session cookie set (check browser DevTools → Network tab)

### Error Testing
- [ ] Try non-existent email: should show "User not found"
- [ ] Try wrong OTP: should show "Invalid OTP"
- [ ] Try expired OTP (wait 10+ min): should show "OTP expired"
- [ ] Try empty fields: should show validation error

### Session Testing
- [ ] After login, refresh page: session persists
- [ ] Click logout: session cleared
- [ ] Visit protected route after logout: redirected to login

---

## API Testing

### Test Send OTP Endpoint
```bash
curl -X POST http://localhost:3000/send-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@iitrpr.ac.in"}'
```
- [ ] Returns `{"success": true, "message": "OTP sent to your email"}`
- [ ] Email is received
- [ ] OTP is 6 digits

### Test Verify OTP Endpoint
```bash
curl -X POST http://localhost:3000/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "test@iitrpr.ac.in", "otp": "123456"}'
```
- [ ] Returns user data and success message
- [ ] Session cookie included in response
- [ ] Database shows `is_used = true` for used OTP

### Test /me Endpoint After Login
```bash
curl -X GET http://localhost:3000/me \
  -H "Cookie: aims.sid=..."
```
- [ ] Returns authenticated user data
- [ ] No 401 error

---

## Production Deployment

### Environment Variables
- [ ] Updated `.env` with production email credentials
- [ ] `SESSION_SECRET` is strong and random (not "dev-secret-key-change-in-production")
- [ ] `VITE_API_BASE_URL` points to production backend
- [ ] `FRONTEND_URL` points to production frontend
- [ ] `.env` file is NOT committed to git

### Backend Deployment
- [ ] Code pushed to production branch
- [ ] Dependencies installed (`npm install`)
- [ ] Build successful
- [ ] Environment variables configured in hosting platform
- [ ] Email service verified working in production
- [ ] Logs accessible for debugging

### Frontend Deployment
- [ ] Code pushed to production branch
- [ ] Build successful (`npm run build`)
- [ ] Deployed to production
- [ ] CORS settings allow production domain
- [ ] HTTPS enforced

### Database
- [ ] `otp_codes` table accessible from production backend
- [ ] Backup scheduled for database
- [ ] Indexes present on frequently queried columns

### HTTPS/Security
- [ ] SSL certificate valid
- [ ] Cookies set to `secure: true` in production
- [ ] CORS headers correct for production domains
- [ ] Session cookie `sameSite` set appropriately

---

## Post-Deployment Testing

### Production Login Test
- [ ] Navigate to production login page
- [ ] Enter valid email
- [ ] Receive OTP in email
- [ ] Enter OTP and login
- [ ] Access protected pages
- [ ] Session persists across page refreshes

### Email Verification
- [ ] Check email received with OTP
- [ ] Email uses correct template
- [ ] OTP is visible and clear
- [ ] Expiration time mentioned (10 minutes)

### Error Handling
- [ ] Invalid email shows error
- [ ] Invalid OTP shows error
- [ ] Expired OTP handled correctly
- [ ] Network errors caught and displayed

### Monitoring
- [ ] Check application logs for errors
- [ ] Monitor email sending success rate
- [ ] Track login conversion rate
- [ ] Monitor database for orphaned OTP records

---

## Maintenance Tasks

### Regular (Weekly)
- [ ] Check email delivery logs
- [ ] Verify no unhandled errors in logs
- [ ] Monitor OTP_codes table size

### Regular (Monthly)
- [ ] Review failed login attempts
- [ ] Clean up old expired OTP records
  ```sql
  DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '7 days';
  ```
- [ ] Verify email service credit balance

### Regular (Quarterly)
- [ ] Security audit of email credentials
- [ ] Review OTP generation algorithm
- [ ] Check for any OTP reuse attempts
- [ ] Verify session timeout settings

---

## Documentation Review

- [ ] [OTP_LOGIN_SUMMARY.md](OTP_LOGIN_SUMMARY.md) - Overview ✓
- [ ] [OTP_QUICK_START.md](OTP_QUICK_START.md) - Setup guide ✓
- [ ] [OTP_LOGIN_IMPLEMENTATION.md](OTP_LOGIN_IMPLEMENTATION.md) - Detailed docs ✓
- [ ] [OTP_API_EXAMPLES.md](OTP_API_EXAMPLES.md) - API reference ✓

---

## Team Communication

- [ ] Notify team of login method change
- [ ] Share Quick Start guide with developers
- [ ] Update user documentation
- [ ] Provide support contact for issues
- [ ] Create FAQ or troubleshooting guide

---

## Rollback Plan

If issues occur in production:

1. **Minor Issues**: Check logs and fix in code
2. **Email Problems**: 
   - [ ] Verify email credentials in production `.env`
   - [ ] Check email service status
   - [ ] Revert to alternative email service if needed

3. **Session Issues**:
   - [ ] Verify `SESSION_SECRET` is set
   - [ ] Check CORS and cookie settings
   - [ ] Verify Redis/session store running

4. **Complete Rollback**:
   - [ ] Revert to previous version with password auth
   - [ ] Old `/login` endpoint still available
   - [ ] No database schema changes required

---

## Final Sign-Off

- [ ] All checklist items completed
- [ ] Local testing passed
- [ ] Production testing passed
- [ ] Team notified
- [ ] Documentation updated
- [ ] Monitoring configured
- [ ] Ready for production

---

## Support Contact

If issues occur:
1. Check [OTP_LOGIN_IMPLEMENTATION.md](OTP_LOGIN_IMPLEMENTATION.md) Troubleshooting section
2. Check application logs for errors
3. Verify email configuration
4. Check database connection
5. Review OTP_API_EXAMPLES.md for API issues

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Tested By:** _______________  
**Notes:** _______________________________________________
