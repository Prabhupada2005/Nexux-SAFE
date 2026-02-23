from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
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

# Create Tables
Base.metadata.create_all(bind=engine)

# --- 3. Pydantic Schemas (Data Validation) ---
class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    phone: str

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

# --- 4. APP & CORS ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"], 
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
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = User(email=user.email, password=user.password, full_name=user.full_name, role=user.role, phone=user.phone)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    # First check if user exists
    user = db.query(User).filter(User.email == creds.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email address")
    
    # Then check password
    if user.password != creds.password:
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    return {"success": True, "user": {"email": user.email, "name": user.full_name, "role": user.role}}

@app.put("/reset-password")
def reset_password(data: PasswordReset, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")
    user.password = data.new_password
    db.commit()
    return {"message": "Password updated successfully"}

# Inventory
@app.get("/inventory")
def get_inventory(db: Session = Depends(get_db)):
    return db.query(Inventory).all()

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
    new_req = FoodRequest(consumer_name=req.consumer_name, item_name=req.item_name, quantity=req.quantity)
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
    # Return empty list for now - centers are hardcoded in frontend
    return []

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

# Safe Route Calculation (avoiding danger zones)
@app.get("/safe-route")
def get_safe_route(start_lat: float, start_lng: float, end_lat: float, end_lng: float, db: Session = Depends(get_db)):
    """Calculate route avoiding verified risk zones"""
    risk_zones = db.query(RiskZone).filter(RiskZone.verified == True).all()
    
    return {
        "start": {"lat": start_lat, "lng": start_lng},
        "end": {"lat": end_lat, "lng": end_lng},
        "danger_zones": [{
            "lat": zone.lat,
            "lng": zone.lng,
            "radius": zone.radius,
            "reason": zone.reason
        } for zone in risk_zones],
        "message": "Use OSRM with waypoints to avoid danger zones"
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)