# Supplier Center Registration Implementation

## Overview
Suppliers can now register their distribution centers which will appear on the consumer map and center list.

## Features Implemented

### 1. Backend (main.py)
- **New Model**: `Center` table with fields:
  - name, address, lat, lng, phone
  - supplier_email (links center to supplier account)
  - status (open/closed), crowd (Low/Medium/High)

- **New Endpoints**:
  - `GET /centers` - Fetch all registered centers
  - `POST /centers` - Register a new center
  - `GET /centers/supplier/{email}` - Get center for specific supplier

### 2. Supplier Dashboard
- **One-time Setup Modal**: Shows automatically on first login if no center registered
- **Form Fields**:
  - Center Name (required)
  - Full Address (required)
  - Latitude & Longitude (required)
  - Contact Phone (required)
- **Validation**: Prevents duplicate center registration per supplier
- **Storage**: Center details saved to database and linked to supplier email

### 3. Login Page
- Stores `supplier_email` in localStorage when supplier logs in
- Used to check if center is registered and link new centers

### 4. Consumer Dashboard
- Fetches registered centers from backend
- Merges with existing hardcoded centers
- Displays all centers on map with markers
- Shows in center list with crowd indicator

## User Flow

1. **Supplier Registration/Login**
   - Supplier logs in with credentials
   - Email stored in localStorage

2. **First-Time Setup**
   - If no center registered, modal appears automatically
   - Cannot access dashboard until center is registered
   - Fills in center details (name, address, location, phone)
   - Submits form

3. **Center Activation**
   - Center saved to database
   - Linked to supplier's email
   - Modal closes, dashboard loads

4. **Consumer View**
   - Registered center appears on map
   - Shows in center list
   - Displays crowd level set by supplier
   - Consumers can request food from the center

## Database Schema

```sql
CREATE TABLE centers (
    id INTEGER PRIMARY KEY,
    name VARCHAR,
    address VARCHAR,
    lat FLOAT,
    lng FLOAT,
    phone VARCHAR,
    supplier_email VARCHAR,
    status VARCHAR DEFAULT 'open',
    crowd VARCHAR DEFAULT 'Low'
);
```

## API Examples

### Register Center
```bash
POST http://localhost:8000/centers
{
  "name": "Imphal Community Kitchen",
  "address": "Thangal Bazar, Imphal West",
  "lat": 24.8170,
  "lng": 93.9368,
  "phone": "+91 9876543210",
  "supplier_email": "supplier@test.com"
}
```

### Get Supplier's Center
```bash
GET http://localhost:8000/centers/supplier/supplier@test.com
```

## Testing Steps

1. **Start Backend**:
   ```bash
   cd backend
   python -m uvicorn main:app --reload
   ```

2. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow**:
   - Login as supplier (supplier@test.com / demo123)
   - Registration modal should appear
   - Fill in center details
   - Submit form
   - Dashboard should load
   - Login as consumer
   - Check map - new center should appear
   - Check center list - new center should be visible

## Future Enhancements
- Allow suppliers to edit center details
- Add center images/photos
- Operating hours management
- Multiple centers per supplier
- Center verification by admin
