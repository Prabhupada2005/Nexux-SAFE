from fastapi import FastAPI, HTTPException, Depends
from typing import Optional
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
    email = Column(String, index=True, nullable=True)
    password = Column(String)
    full_name = Column(String)
    role = Column(String)  # consumer, supplier, emergency, admin
    phone = Column(String, unique=True, index=True)

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

# --- 3. Pydantic Schemas (Data Validation) ---
class UserCreate(BaseModel):
    email: Optional[str] = None
    password: str
    full_name: str
    role: str
    phone: str

class LoginRequest(BaseModel):
    phone: str
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

class CenterCreate(BaseModel):
    name: str
    address: str
    lat: float
    lng: float
    phone: str
    supplier_email: str

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
    db_user = db.query(User).filter(User.phone == user.phone).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    new_user = User(email=user.email, password=user.password, full_name=user.full_name, role=user.role, phone=user.phone)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    # First check if user exists
    user = db.query(User).filter(User.phone == creds.phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this phone number")
    
    # Then check password
    if user.password != creds.password:
        raise HTTPException(status_code=401, detail="Incorrect password")
    
    return {"success": True, "user": {"email": user.email, "phone": user.phone, "name": user.full_name, "role": user.role}}

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
    try:
        return db.query(FoodRequest).all()
    except Exception as e:
        print(f"Error fetching food requests: {e}")
        return []

@app.post("/request-food")
def request_food(req: RequestItem, db: Session = Depends(get_db)):
    try:
        new_req = FoodRequest(consumer_name=req.consumer_name, item_name=req.item_name, quantity=req.quantity)
        db.add(new_req)
        db.commit()
        db.refresh(new_req)
        return new_req
    except Exception as e:
        print(f"Error creating food request: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

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

# Centers & Risk
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

@app.get("/risk-zones")
def get_risk_zones(db: Session = Depends(get_db)):
    try:
        return db.query(RiskZone).filter(RiskZone.verified == True).all()
    except Exception as e:
        print(f"Error fetching risk zones: {e}")
        return []

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

# AI Chat Schema
class AIChatRequest(BaseModel):
    query: str
    context: dict = {}
    language: str = "en"  # Default to English

# AI Chat Endpoint
@app.post("/ai-chat")
def ai_chat(request: AIChatRequest):
    query = request.query.lower()
    lang = request.language
    
    # Multi-language responses
    responses = {
        "en": {
            "nearest": "I can help you find the nearest food center! Check the map above to see centers near your location. The closest ones are marked with distance indicators.",
            "open": "Most food centers are currently open. Look for centers with 'Open' status on the map. You can also check crowd levels to avoid busy locations.",
            "menu": "Food centers offer rice meals, vegetables, water, and emergency supplies. Click on any center marker on the map to see their specific menu and availability.",
            "request": "To request food, click on a food center marker on the map and use the 'Request Food' button. Specify the item and quantity you need.",
            "sos": "If you're in danger, use the SOS Alert button (red button with warning icon) to report your location. Emergency services will be notified immediately.",
            "crowd": "Check the crowd level indicator on each food center. Green means low crowd, yellow is moderate, and red indicates high crowd. Plan your visit accordingly!",
            "safe": "Red zones on the map indicate danger areas. Avoid these zones when traveling. The system will suggest safe routes automatically.",
            "default": "I'm here to help! You can ask me about: nearest food centers, what's available, how to request food, SOS alerts, crowd levels, or safe routes. What would you like to know?"
        },
        "hi": {
            "nearest": "मैं आपको निकटतम खाद्य केंद्र खोजने में मदद कर सकता हूं! अपने स्थान के पास केंद्र देखने के लिए ऊपर का नक्शा देखें। निकटतम वाले दूरी संकेतक के साथ चिह्नित हैं।",
            "open": "अधिकांश खाद्य केंद्र वर्तमान में खुले हैं। नक्शे पर 'खुला' स्थिति वाले केंद्रों को देखें। आप व्यस्त स्थानों से बचने के लिए भीड़ स्तर भी जांच सकते हैं।",
            "menu": "खाद्य केंद्र चावल के भोजन, सब्जियां, पानी और आपातकालीन आपूर्ति प्रदान करते हैं। उनके विशिष्ट मेनू और उपलब्धता देखने के लिए नक्शे पर किसी भी केंद्र मार्कर पर क्लिक करें।",
            "request": "भोजन का अनुरोध करने के लिए, नक्शे पर एक खाद्य केंद्र मार्कर पर क्लिक करें और 'भोजन अनुरोध करें' बटन का उपयोग करें। आपको आवश्यक वस्तु और मात्रा निर्दिष्ट करें।",
            "sos": "यदि आप खतरे में हैं, तो अपने स्थान की रिपोर्ट करने के लिए SOS अलर्ट बटन (चेतावनी आइकन के साथ लाल बटन) का उपयोग करें। आपातकालीन सेवाओं को तुरंत सूचित किया जाएगा।",
            "crowd": "प्रत्येक खाद्य केंद्र पर भीड़ स्तर संकेतक की जांच करें। हरा मतलब कम भीड़, पीला मध्यम है, और लाल उच्च भीड़ को इंगित करता है। तदनुसार अपनी यात्रा की योजना बनाएं!",
            "safe": "नक्शे पर लाल क्षेत्र खतरे वाले क्षेत्रों को इंगित करते हैं। यात्रा करते समय इन क्षेत्रों से बचें। सिस्टम स्वचालित रूप से सुरक्षित मार्गों का सुझाव देगा।",
            "default": "मैं मदद के लिए यहां हूं! आप मुझसे पूछ सकते हैं: निकटतम खाद्य केंद्र, क्या उपलब्ध है, भोजन का अनुरोध कैसे करें, SOS अलर्ट, भीड़ स्तर, या सुरक्षित मार्ग। आप क्या जानना चाहेंगे?"
        },
        "mni": {
            "nearest": "ꯑꯩꯅꯥ ꯅꯍꯥꯀꯄꯨ ꯈ꯭ꯋꯥꯏꯗꯒꯤ ꯅꯀꯄꯥ ꯆꯥꯅꯕꯥ ꯁꯦꯟꯇꯔ ꯊꯤꯕꯗꯥ ꯃꯇꯦꯡ ꯄꯥꯡꯕꯥ ꯉꯃꯒꯅꯤ! ꯅꯍꯥꯛꯀꯤ ꯃꯐꯝ ꯃꯅꯥꯛꯇꯥ ꯂꯩꯕꯥ ꯁꯦꯟꯇꯔꯁꯤꯡ ꯎꯅꯕꯥ ꯃꯊꯛꯇꯥ ꯂꯩꯕꯥ ꯃꯦꯞ ꯌꯦꯡꯕꯤꯌꯨ꯫",
            "open": "ꯆꯥꯅꯕꯥ ꯁꯦꯟꯇꯔ ꯑꯌꯥꯝꯕꯥ ꯍꯧꯖꯤꯛ ꯍꯥꯡꯗꯣꯛꯂꯤ꯫ ꯃꯦꯞꯇꯥ 'ꯍꯥꯡꯗꯣꯛꯂꯕꯥ' ꯍꯥꯌꯕꯥ ꯁꯦꯟꯇꯔꯁꯤꯡ ꯊꯤꯌꯨ꯫",
            "menu": "ꯆꯥꯅꯕꯥ ꯁꯦꯟꯇꯔꯁꯤꯡꯅꯥ ꯆꯦꯡ ꯆꯥꯕꯥ, ꯎꯍꯩ-ꯊꯥꯡꯖꯤꯡ, ꯏꯁꯤꯡ ꯑꯃꯁꯨꯡ ꯈꯨꯗꯣꯡꯊꯤꯕꯥ ꯃꯇꯃꯒꯤ ꯄꯣꯠꯂꯃꯁꯤꯡ ꯄꯤꯔꯤ꯫",
            "request": "ꯆꯥꯅꯕꯥ ꯂꯧꯅꯕꯥ, ꯃꯦꯞꯇꯥ ꯆꯥꯅꯕꯥ ꯁꯦꯟꯇꯔ ꯃꯥꯔꯀꯔ ꯑꯃꯗꯥ ꯀ꯭ꯂꯤꯛ ꯇꯧ ꯑꯃꯁꯨꯡ 'ꯆꯥꯅꯕꯥ ꯂꯧꯕꯥ' ꯕꯇꯟ ꯁꯤꯖꯤꯟꯅꯧ꯫",
            "sos": "ꯀꯔꯤꯒꯨꯝꯕꯥ ꯅꯍꯥꯛ ꯈꯨꯗꯣꯡꯊꯤꯕꯥ ꯃꯇꯃꯗꯥ ꯂꯩꯔꯕꯗꯤ, SOS ꯑꯦꯂꯔꯠ ꯕꯇꯟ ꯁꯤꯖꯤꯟꯅꯧ꯫",
            "crowd": "ꯆꯥꯅꯕꯥ ꯁꯦꯟꯇꯔ ꯈꯨꯗꯤꯡꯃꯛꯇꯥ ꯃꯤꯌꯥꯝꯒꯤ ꯆꯥꯡ ꯌꯦꯡꯕꯤꯌꯨ꯫ ꯒ꯭ꯔꯤꯟ ꯍꯥꯌꯕꯁꯤ ꯃꯤꯌꯥꯝ ꯈꯔꯥ, ꯌꯦꯂꯣ ꯍꯥꯌꯕꯁꯤ ꯃꯌꯥꯏ ꯑꯣꯏ꯫",
            "safe": "ꯃꯦꯞꯇꯥ ꯂꯩꯕꯥ ꯂꯥꯜ ꯖꯣꯅꯁꯤꯡꯅꯥ ꯈꯨꯗꯣꯡꯊꯤꯕꯥ ꯃꯐꯃꯁꯤꯡ ꯇꯥꯛꯂꯤ꯫ ꯆꯠꯄꯥ ꯃꯇꯃꯗꯥ ꯖꯣꯅ ꯑꯁꯤꯗꯒꯤ ꯂꯥꯞꯅꯥ ꯂꯩꯌꯨ꯫",
            "default": "ꯑꯩꯅꯥ ꯃꯇꯦꯡ ꯄꯥꯡꯅꯕꯥ ꯃꯐꯝ ꯑꯁꯤꯗꯥ ꯂꯩ! ꯅꯍꯥꯛꯅꯥ ꯑꯩꯗꯒꯤ ꯍꯪꯕꯥ ꯌꯥꯏ: ꯈ꯭ꯋꯥꯏꯗꯒꯤ ꯅꯀꯄꯥ ꯆꯥꯅꯕꯥ ꯁꯦꯟꯇꯔ, ꯀꯔꯤ ꯂꯩꯔꯤꯕꯥ, ꯆꯥꯅꯕꯥ ꯀꯔꯝꯅꯥ ꯂꯧꯒꯗꯒꯦ꯫"
        },
        "or": {
            "nearest": "ମୁଁ ଆପଣଙ୍କୁ ନିକଟତମ ଖାଦ୍ୟ କେନ୍ଦ୍ର ଖୋଜିବାରେ ସାହାଯ୍ୟ କରିପାରିବି! ଆପଣଙ୍କ ଅବସ୍ଥାନ ନିକଟରେ କେନ୍ଦ୍ରଗୁଡିକ ଦେଖିବା ପାଇଁ ଉପରେ ମାନଚିତ୍ର ଯାଞ୍ଚ କରନ୍ତୁ।",
            "open": "ଅଧିକାଂଶ ଖାଦ୍ୟ କେନ୍ଦ୍ର ବର୍ତ୍ତମାନ ଖୋଲା ଅଛି। ମାନଚିତ୍ରରେ 'ଖୋଲା' ସ୍ଥିତି ସହିତ କେନ୍ଦ୍ରଗୁଡିକ ଖୋଜନ୍ତୁ।",
            "menu": "ଖାଦ୍ୟ କେନ୍ଦ୍ରଗୁଡିକ ଚାଉଳ ଭୋଜନ, ପନିପରିବା, ପାଣି ଏବଂ ଜରୁରୀକାଳୀନ ଯୋଗାଣ ପ୍ରଦାନ କରନ୍ତି।",
            "request": "ଖାଦ୍ୟ ଅନୁରୋଧ କରିବାକୁ, ମାନଚିତ୍ରରେ ଏକ ଖାଦ୍ୟ କେନ୍ଦ୍ର ମାର୍କର୍ ଉପରେ କ୍ଲିକ୍ କରନ୍ତୁ ଏବଂ 'ଖାଦ୍ୟ ଅନୁରୋଧ' ବଟନ୍ ବ୍ୟବହାର କରନ୍ତୁ।",
            "sos": "ଯଦି ଆପଣ ବିପଦରେ ଅଛନ୍ତି, ତେବେ ଆପଣଙ୍କ ଅବସ୍ଥାନ ରିପୋର୍ଟ କରିବାକୁ SOS ଆଲର୍ଟ ବଟନ୍ (ଲାଲ୍ ବଟନ୍) ବ୍ୟବହାର କରନ୍ତୁ।",
            "crowd": "ପ୍ରତ୍ୟେକ ଖାଦ୍ୟ କେନ୍ଦ୍ରରେ ଭିଡ଼ ସ୍ତର ସୂଚକ ଯାଞ୍ଚ କରନ୍ତୁ। ସବୁଜ ଅର୍ଥ କମ୍ ଭିଡ଼, ହଳଦିଆ ମଧ୍ୟମ, ଏବଂ ଲାଲ୍ ଉଚ୍ଚ ଭିଡ଼ ସୂଚିତ କରେ।",
            "safe": "ମାନଚିତ୍ରରେ ଲାଲ୍ ଜୋନ୍ ବିପଦ କ୍ଷେତ୍ର ସୂଚିତ କରେ। ଯାତ୍ରା କରିବା ସମୟରେ ଏହି ଜୋନ୍ଗୁଡିକରୁ ଦୂରେଇ ରୁହନ୍ତୁ।",
            "default": "ମୁଁ ସାହାଯ୍ୟ କରିବାକୁ ଏଠାରେ ଅଛି! ଆପଣ ମୋତେ ପଚାରିପାରିବେ: ନିକଟତମ ଖାଦ୍ୟ କେନ୍ଦ୍ର, କଣ ଉପଲବ୍ଧ, ଖାଦ୍ୟ କିପରି ଅନୁରୋଧ କରିବେ, SOS ଆଲର୍ଟ, ଭିଡ଼ ସ୍ତର, କିମ୍ବା ସୁରକ୍ଷିତ ମାର୍ଗ।"
        }
    }
    
    # Get language responses (default to English if language not found)
    lang_responses = responses.get(lang, responses["en"])
    
    # Match query to response
    if "nearest" in query or "closest" in query or "near" in query:
        return {"response": lang_responses["nearest"]}
    elif "open" in query or "available" in query:
        return {"response": lang_responses["open"]}
    elif "menu" in query or "food" in query or "meal" in query:
        return {"response": lang_responses["menu"]}
    elif "request" in query or "order" in query:
        return {"response": lang_responses["request"]}
    elif "sos" in query or "emergency" in query or "danger" in query:
        return {"response": lang_responses["sos"]}
    elif "crowd" in query or "busy" in query:
        return {"response": lang_responses["crowd"]}
    elif "safe" in query or "route" in query:
        return {"response": lang_responses["safe"]}
    else:
        return {"response": lang_responses["default"]}

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