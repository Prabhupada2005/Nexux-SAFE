from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, func, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
try:
    from twilio.rest import Client
except ImportError:
    Client = None # Handle missing library gracefully
import random

# --- 1. DATABASE SETUP ---
DATABASE_URL = "sqlite:///./foodtech.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- 2. MODELS (The Tables) ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    full_name = Column(String)
    role = Column(String)  # consumer, supplier, emergency, admin
    phone = Column(String)
    age = Column(Integer, nullable=True)
    family_members = Column(Integer, nullable=True)

class Inventory(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    quantity = Column(Float)
    unit = Column(String)
    category = Column(String)

class FoodRequest(Base):
    __tablename__ = "food_requests"
    id = Column(Integer, primary_key=True, index=True)
    consumer_name = Column(String)
    item_name = Column(String)
    quantity = Column(Float)
    status = Column(String, default="pending")
    rejection_reason = Column(String, nullable=True)
    center_id = Column(Integer, nullable=True)
    center_name = Column(String, nullable=True)
    delivery_type = Column(String, default="pickup")
    phone = Column(String, nullable=True)

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    center_id = Column(Integer, default=1)
    sender = Column(String)
    sender_type = Column(String, default="consumer")
    content = Column(String)

class RiskZone(Base):
    __tablename__ = "risk_zones"
    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    radius = Column(Float)
    reason = Column(String)
    verified = Column(Boolean, default=True)  # True if added by emergency/supplier

class SOSAlert(Base):
    __tablename__ = "sos_alerts"
    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    reason = Column(String)
    sender_name = Column(String)
    sender_type = Column(String)  # consumer, supplier, emergency
    status = Column(String, default="pending")  # pending, verified, rejected
    timestamp = Column(String)
    is_official = Column(Boolean, default=False)  # True if from supplier/emergency

class Center(Base):
    __tablename__ = "centers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    address = Column(String)
    lat = Column(Float)
    lng = Column(Float)
    phone = Column(String)
    supplier_email = Column(String)
    status = Column(String, default="open")
    crowd = Column(String, default="Low")

# Create Tables
Base.metadata.create_all(bind=engine)

# --- AUTO-MIGRATION FOR DEV (Fixes "no such column" errors) ---
def run_migrations():
    try:
        inspector = inspect(engine)
        with engine.connect() as conn:
            # Users Table Migrations
            if inspector.has_table("users"):
                columns = [c['name'] for c in inspector.get_columns('users')]
                if 'age' not in columns:
                    print("--- MIGRATION: Adding 'age' to users ---")
                    conn.execute(text("ALTER TABLE users ADD COLUMN age INTEGER DEFAULT 0"))
                if 'family_members' not in columns:
                    print("--- MIGRATION: Adding 'family_members' to users ---")
                    conn.execute(text("ALTER TABLE users ADD COLUMN family_members INTEGER DEFAULT 1"))
                if 'phone' not in columns:
                    print("--- MIGRATION: Adding 'phone' to users ---")
                    conn.execute(text("ALTER TABLE users ADD COLUMN phone VARCHAR"))
            
            # Food Requests Table Migrations
            if inspector.has_table("food_requests"):
                columns = [c['name'] for c in inspector.get_columns('food_requests')]
                if 'center_id' not in columns:
                    print("--- MIGRATION: Adding 'center_id' to food_requests ---")
                    conn.execute(text("ALTER TABLE food_requests ADD COLUMN center_id INTEGER"))
                if 'center_name' not in columns:
                    print("--- MIGRATION: Adding 'center_name' to food_requests ---")
                    conn.execute(text("ALTER TABLE food_requests ADD COLUMN center_name VARCHAR"))
                if 'delivery_type' not in columns:
                    print("--- MIGRATION: Adding 'delivery_type' to food_requests ---")
                    conn.execute(text("ALTER TABLE food_requests ADD COLUMN delivery_type VARCHAR DEFAULT 'pickup'"))
                if 'phone' not in columns:
                    print("--- MIGRATION: Adding 'phone' to food_requests ---")
                    conn.execute(text("ALTER TABLE food_requests ADD COLUMN phone VARCHAR"))
                if 'rejection_reason' not in columns:
                    print("--- MIGRATION: Adding 'rejection_reason' to food_requests ---")
                    conn.execute(text("ALTER TABLE food_requests ADD COLUMN rejection_reason VARCHAR"))
            
            conn.commit()
            print("--- DATABASE MIGRATION CHECK COMPLETE ---")
    except Exception as e:
        print(f"--- MIGRATION FAILED: {e} ---")

run_migrations()

# --- 3. Pydantic Schemas (Data Validation) ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    phone: str
    age: int = 0
    family_members: int = 1

class LoginRequest(BaseModel):
    email: str
    password: str

class InventoryItem(BaseModel):
    name: str
    quantity: float
    unit: str = "kg"
    category: str = "General"

class RequestItem(BaseModel):
    consumer_name: str
    item_name: str
    quantity: float
    center_id: int = None
    center_name: str = None
    delivery_type: str = "pickup"
    phone: str = None

class MessageCreate(BaseModel):
    sender: str
    content: str
    sender_type: str = "consumer"

class RiskZoneCreate(BaseModel):
    lat: float
    lng: float
    radius: float
    reason: str

class SOSAlertCreate(BaseModel):
    lat: float
    lng: float
    reason: str
    sender_name: str
    sender_type: str

class RejectRequest(BaseModel):
    reason: str

class PasswordReset(BaseModel):
    email: str
    new_password: str

class CenterCreate(BaseModel):
    name: str
    address: str
    lat: float
    lng: float
    phone: str
    supplier_email: str

class OTPRequest(BaseModel):
    phone: str

class DeleteAccountRequest(BaseModel):
    email: str
    password: str

# --- Twilio Configuration (Replace with your credentials) ---
TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  # Replace with your Account SID
TWILIO_AUTH_TOKEN = "your_auth_token"          # Replace with your Auth Token
TWILIO_PHONE_NUMBER = "+15017122661"            # Replace with your Twilio phone number


# --- 4. APP & CORS ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 5. API ENDPOINTS ---

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    print(f"--- REGISTER ATTEMPT: {user.email} as {user.role} ---")
    try:
        db_user = db.query(User).filter(func.lower(User.email) == user.email.lower().strip()).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        new_user = User(
            email=user.email.strip(), 
            password=user.password, 
            full_name=user.full_name, 
            role=user.role, 
            phone=user.phone,
            age=user.age,
            family_members=user.family_members
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except Exception as e:
        print(f"--- REGISTER ERROR: {e} ---")
        if "no such column" in str(e).lower():
             raise HTTPException(status_code=500, detail="Database schema mismatch. Please delete foodtech.db and restart backend.")
        raise e

@app.post("/login")
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    # First check if user exists
    user = db.query(User).filter(func.lower(User.email) == creds.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")
    
    # Then check password
    if user.password != creds.password:
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    return {"success": True, "user": {
        "email": user.email, 
        "name": user.full_name, 
        "role": user.role,
        "phone": user.phone
    }}

@app.put("/reset-password")
def reset_password(data: PasswordReset, db: Session = Depends(get_db)):
    print(f"--- RESET PASSWORD REQUEST: {data.email} ---")
    # Case-insensitive email check
    user = db.query(User).filter(func.lower(User.email) == data.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    user.password = data.new_password
    db.commit()
    return {"message": "Password updated successfully"}

@app.post("/delete-supplier")
def delete_supplier(creds: DeleteAccountRequest, db: Session = Depends(get_db)):
    # 1. Verify User
    user = db.query(User).filter(User.email == creds.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.password != creds.password:
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    # 2. Find Center
    center = db.query(Center).filter(Center.supplier_email == creds.email).first()
    
    if center:
        # 3. Check for active orders (Anything not rejected. Fulfilled orders are deleted from DB in this system)
        active_count = db.query(FoodRequest).filter(
            FoodRequest.center_id == center.id,
            FoodRequest.status != "rejected"
        ).count()
        
        if active_count > 0:
             raise HTTPException(status_code=400, detail=f"Cannot delete account. You have {active_count} active orders. Please fulfill or reject them first.")
        
        db.delete(center)
    
    db.delete(user)
    db.commit()
    return {"message": "Account and Center deleted successfully"}

# Inventory
@app.get("/inventory")
def get_inventory(db: Session = Depends(get_db)):
    return db.query(Inventory).all()

@app.get("/alerts")
async def get_alerts():
    return [{"id": 1, "type": "Crisis", "location": "Ukhrul", "severity": "critical", "time": "18 min ago"}]

@app.post("/inventory")
def add_item(item: InventoryItem, db: Session = Depends(get_db)):
    db_item = Inventory(name=item.name, quantity=item.quantity, unit=item.unit, category=item.category)
    db.add(db_item)
    db.commit()
    return db_item

@app.put("/inventory/{item_id}")
def update_item(item_id: int, data: InventoryItem, db: Session = Depends(get_db)): # Simplified update
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if item:
        item.quantity = data.quantity
        db.commit()
    return item

@app.delete("/inventory/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Inventory).filter(Inventory.id == item_id).first()
    if item:
        db.delete(item)
        db.commit()
    return {"message": "Deleted"}

# Requests
@app.get("/food-requests")
def get_requests(db: Session = Depends(get_db)):
    return db.query(FoodRequest).all()

@app.post("/request-food")
def request_food(req: RequestItem, db: Session = Depends(get_db)):
    new_req = FoodRequest(
        consumer_name=req.consumer_name, 
        item_name=req.item_name, 
        quantity=req.quantity,
        center_id=req.center_id,
        center_name=req.center_name,
        delivery_type=req.delivery_type,
        phone=req.phone
    )
    db.add(new_req)
    db.commit()
    return new_req

@app.post("/reject-request/{request_id}")
def reject_request(request_id: int, data: RejectRequest, db: Session = Depends(get_db)):
    req = db.query(FoodRequest).filter(FoodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    req.status = "rejected"
    req.rejection_reason = data.reason
    db.commit()
    
    return {"message": "Request rejected", "reason": data.reason}

# --- THE FIXED FULFILL ENDPOINT ---
@app.post("/fulfill-request/{request_id}")
def fulfill_request(request_id: int, db: Session = Depends(get_db)):
    print(f"--- Processing Fulfill ID: {request_id} ---")
    
    req = db.query(FoodRequest).filter(FoodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    # Smart Match (Case Insensitive)
    item = db.query(Inventory).filter(func.lower(Inventory.name) == req.item_name.lower().strip()).first()
    
    if not item:
        print(f"FAILED: Item '{req.item_name}' is not in Inventory.")
        raise HTTPException(status_code=400, detail=f"Item '{req.item_name}' not in inventory! Add it first.")
    
    if item.quantity < req.quantity:
        print(f"FAILED: Insufficient Stock. Have {item.quantity}, Need {req.quantity}")
        raise HTTPException(status_code=400, detail=f"Insufficient Stock! Have: {item.quantity}, Need: {req.quantity}")

    # Deduct
    item.quantity -= req.quantity
    db.delete(req)
    db.commit()
    
    print(f"SUCCESS: Deducted {req.quantity}. New Balance: {item.quantity}")
    return {"message": f"Success! Deducted {req.quantity}. Remaining: {item.quantity}"}

# Chat & Risk
@app.get("/messages")
def get_messages(db: Session = Depends(get_db)):
    return db.query(Message).all()

@app.get("/centers")
def get_centers(db: Session = Depends(get_db)):
    return db.query(Center).all()

@app.post("/centers")
def create_center(center: CenterCreate, db: Session = Depends(get_db)):
    # Check if supplier already has a center
    existing = db.query(Center).filter(Center.supplier_email == center.supplier_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="You already have a registered center")
    
    new_center = Center(
        name=center.name,
        address=center.address,
        lat=center.lat,
        lng=center.lng,
        phone=center.phone,
        supplier_email=center.supplier_email
    )
    db.add(new_center)
    db.commit()
    db.refresh(new_center)
    return new_center

@app.get("/centers/supplier/{email}")
def get_supplier_center(email: str, db: Session = Depends(get_db)):
    center = db.query(Center).filter(Center.supplier_email == email).first()
    if not center:
        return {"exists": False}
    return {"exists": True, "center": center}

@app.get("/messages/{center_id}")
def get_center_messages(center_id: int, db: Session = Depends(get_db)):
    return db.query(Message).filter(Message.center_id == center_id).all()

@app.post("/messages")
def send_message(msg: MessageCreate, db: Session = Depends(get_db)):
    new_msg = Message(sender=msg.sender, content=msg.content, sender_type=msg.sender_type)
    db.add(new_msg)
    db.commit()
    return new_msg

@app.post("/messages/{center_id}")
def send_center_message(center_id: int, msg: MessageCreate, db: Session = Depends(get_db)):
    new_msg = Message(center_id=center_id, sender=msg.sender, content=msg.content, sender_type=msg.sender_type)
    db.add(new_msg)
    db.commit()
    return new_msg

@app.get("/risk-zones")
def get_risk_zones(db: Session = Depends(get_db)):
    # Only return verified risk zones
    return db.query(RiskZone).filter(RiskZone.verified == True).all()

@app.post("/risk-zones")
def add_risk_zone(zone: RiskZoneCreate, db: Session = Depends(get_db)):
    new_zone = RiskZone(lat=zone.lat, lng=zone.lng, radius=zone.radius, reason=zone.reason, verified=True)
    db.add(new_zone)
    db.commit()
    return new_zone

@app.delete("/risk-zones/{zone_id}")
def delete_risk_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(RiskZone).filter(RiskZone.id == zone_id).first()
    if zone:
        db.delete(zone)
        db.commit()
    return {"message": "Zone removed"}

# SOS Alert Endpoints
@app.post("/sos-alert")
def send_sos_alert(alert: SOSAlertCreate, db: Session = Depends(get_db)):
    from datetime import datetime
    
    # Check if sender is official (supplier/emergency)
    is_official = alert.sender_type in ['supplier', 'emergency']
    
    new_alert = SOSAlert(
        lat=alert.lat,
        lng=alert.lng,
        reason=alert.reason,
        sender_name=alert.sender_name,
        sender_type=alert.sender_type,
        status="verified" if is_official else "pending",
        is_official=is_official,
        timestamp=datetime.now().isoformat()
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)
    
    # If official source, auto-create risk zone
    if is_official:
        risk_zone = RiskZone(
            lat=alert.lat,
            lng=alert.lng,
            radius=500,
            reason=alert.reason,
            verified=True
        )
        db.add(risk_zone)
        db.commit()
    
    return new_alert

@app.get("/sos-alerts")
def get_sos_alerts(db: Session = Depends(get_db)):
    return db.query(SOSAlert).all()

@app.get("/sos-alerts/pending")
def get_pending_alerts(db: Session = Depends(get_db)):
    return db.query(SOSAlert).filter(SOSAlert.status == "pending").all()

@app.post("/sos-alerts/{alert_id}/verify")
def verify_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(SOSAlert).filter(SOSAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "verified"
    
    # Create risk zone on map
    risk_zone = RiskZone(
        lat=alert.lat,
        lng=alert.lng,
        radius=500,
        reason=alert.reason,
        verified=True
    )
    db.add(risk_zone)
    db.commit()
    
    return {"message": "Alert verified and added to map"}

@app.post("/sos-alerts/{alert_id}/reject")
def reject_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(SOSAlert).filter(SOSAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "rejected"
    db.commit()
    
    return {"message": "Alert rejected"}

@app.get("/sos-alerts/clusters")
def get_alert_clusters(db: Session = Depends(get_db)):
    """Group nearby pending alerts to detect patterns"""
    from math import radians, cos, sin, asin, sqrt
    
    def haversine(lon1, lat1, lon2, lat2):
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        km = 6371 * c
        return km
    
    pending_alerts = db.query(SOSAlert).filter(SOSAlert.status == "pending").all()
    
    clusters = []
    processed = set()
    
    for alert in pending_alerts:
        if alert.id in processed:
            continue
        
        cluster = [alert]
        processed.add(alert.id)
        
        for other in pending_alerts:
            if other.id in processed:
                continue
            
            distance = haversine(alert.lng, alert.lat, other.lng, other.lat)
            if distance < 1:  # Within 1km
                cluster.append(other)
                processed.add(other.id)
        
        if len(cluster) >= 2:  # At least 2 reports from same area
            clusters.append({
                "location": {"lat": alert.lat, "lng": alert.lng},
                "count": len(cluster),
                "reason": alert.reason,
                "alerts": [{
                    "id": a.id,
                    "sender": a.sender_name,
                    "timestamp": a.timestamp
                } for a in cluster]
            })
    
    return clusters

# IoT Simulation
@app.get("/iot/spoilage")
def get_iot_data():
    return [
        {"id": 1, "location": "Warehouse A", "temp": random.randint(20, 35), "humidity": random.randint(40, 80), "status": "normal", "food_quality": "Good"},
        {"id": 2, "location": "Transit Truck 4", "temp": random.randint(30, 45), "humidity": random.randint(60, 90), "status": "warning", "food_quality": "Risk"}
    ]

@app.post("/send-otp")
def send_otp(req: OTPRequest):
    otp = str(random.randint(1000, 9999))
    
    # Auto-format phone number (Default to India +91 if missing)
    phone_number = req.phone.strip()
    if not phone_number.startswith("+"):
        phone_number = "+91" + phone_number

    # Check if we should simulate (Missing lib, placeholder creds, or explicit dev mode)
    is_simulation = (
        Client is None or 
        TWILIO_ACCOUNT_SID.startswith("ACxxxx") or 
        "your_auth_token" in TWILIO_AUTH_TOKEN
    )

    if is_simulation:
        print(f"--- [SMS SIMULATION] OTP for {phone_number} is {otp} ---")
        return {"otp": otp, "message": "OTP sent (simulation). Check backend console."}
    
    try:
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        message = client.messages.create(body=f"Your SAFE verification code is: {otp}", from_=TWILIO_PHONE_NUMBER, to=phone_number)
        return {"otp": otp, "message": f"OTP sent to {phone_number}. SID: {message.sid}"}
    except Exception as e:
        print(f"--- TWILIO ERROR: {e} ---")
        # Fallback to simulation so the user isn't stuck
        print(f"--- [SMS SIMULATION FALLBACK] OTP for {phone_number} is {otp} ---")
        return {"otp": otp, "message": f"OTP sent (simulation fallback). Real SMS failed: {str(e)}"}

# Safe Route Calculation (avoiding danger zones)
@app.get("/safe-route")
def get_safe_route(start_lat: float, start_lng: float, end_lat: float, end_lng: float, db: Session = Depends(get_db)):
    """Calculate route avoiding verified risk zones"""
    from math import radians, cos, sin, asin, sqrt, atan2, degrees
    
    def haversine(lat1, lon1, lat2, lon2):
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        return 6371 * c  # km
    
    def point_intersects_zone(lat, lng, zone_lat, zone_lng, radius_m):
        """Check if point is within danger zone"""
        dist_km = haversine(lat, lng, zone_lat, zone_lng)
        return dist_km * 1000 < radius_m
    
    def calculate_waypoint(start, end, zone, offset_km=0.6):
        """Calculate waypoint to avoid danger zone"""
        # Calculate perpendicular offset point
        mid_lat = (start[0] + end[0]) / 2
        mid_lng = (start[1] + end[1]) / 2
        
        # Vector from start to end
        dlat = end[0] - start[0]
        dlng = end[1] - start[1]
        
        # Perpendicular vector (rotated 90 degrees)
        perp_lat = -dlng
        perp_lng = dlat
        
        # Normalize and scale
        length = (perp_lat**2 + perp_lng**2)**0.5
        if length > 0:
            perp_lat = (perp_lat / length) * offset_km / 111  # ~111km per degree
            perp_lng = (perp_lng / length) * offset_km / 111
        
        return [mid_lat + perp_lat, mid_lng + perp_lng]
    
    risk_zones = db.query(RiskZone).filter(RiskZone.verified == True).all()
    
    # Check if direct route intersects any danger zones
    waypoints = []
    route_intersects = False
    
    for zone in risk_zones:
        # Check multiple points along the direct route
        for i in range(10):
            t = i / 10.0
            check_lat = start_lat + t * (end_lat - start_lat)
            check_lng = start_lng + t * (end_lng - start_lng)
            
            if point_intersects_zone(check_lat, check_lng, zone.lat, zone.lng, zone.radius):
                route_intersects = True
                # Add waypoint to avoid this zone
                waypoint = calculate_waypoint(
                    [start_lat, start_lng],
                    [end_lat, end_lng],
                    [zone.lat, zone.lng]
                )
                waypoints.append(waypoint)
                break
    
    return {
        "start": {"lat": start_lat, "lng": start_lng},
        "end": {"lat": end_lat, "lng": end_lng},
        "waypoints": waypoints,
        "has_danger_zones": route_intersects,
        "danger_zones": [{
            "lat": zone.lat,
            "lng": zone.lng,
            "radius": zone.radius,
            "reason": zone.reason
        } for zone in risk_zones],
        "route_type": "detour" if route_intersects else "direct"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)