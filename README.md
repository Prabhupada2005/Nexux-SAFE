# FoodTech Platform

FoodTech Platform is a full-stack food ordering and management web application developed as a hackathon project.

## ⚠️ Security Notice
**This is a DEMO/HACKATHON project with the following limitations:**
- Hardcoded demo credentials (password: `demo123` for all users)
- Plain text password storage (NO hashing)
- Not suitable for production use

**Before deploying to production:**
- Implement password hashing (bcrypt/argon2)
- Use environment variables for sensitive data
- Remove hardcoded credentials
- Add proper authentication/authorization
- Use HTTPS and secure database connections

##  Tech Stack
- Frontend: React + Vite
- Backend: FastAPI (Python)
- Database: SQLite / SQLAlchemy
- API: RESTful services

##  Features
- User authentication system
- Browse food items
- Order management
- Responsive React UI
- Secure FastAPI backend

##  Run Locally

### Backend
```bash
cd backend
python seed.py  # Initialize database with demo users
python -m uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Demo Credentials
All demo accounts use password: `demo123`
- Consumer: `consumer@test.com`
- Supplier: `supplier@test.com`
- Emergency: `emergency@test.com`
- Admin: `admin@foodtech.com`
