<<<<<<< HEAD
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
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> c043c4a73008c71fda2c4a2472bc838d43166e0e
