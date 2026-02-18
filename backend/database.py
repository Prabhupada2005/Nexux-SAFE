from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Database Connection
SQLALCHEMY_DATABASE_URL = "sqlite:///./foodtech.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- DATABASE MODELS ---

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)
    phone = Column(String)

class InventoryItem(Base):
    __tablename__ = "inventory"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    quantity = Column(Float)
    unit = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    last_updated = Column(String, default=datetime.now().strftime("%Y-%m-%d"))

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String)
    content = Column(String)
    timestamp = Column(DateTime, default=datetime.now)

class FoodRequest(Base):
    __tablename__ = "food_requests"
    id = Column(Integer, primary_key=True, index=True)
    consumer_name = Column(String)
    item_name = Column(String)
    quantity = Column(Float)
    status = Column(String, default="pending") 
    timestamp = Column(DateTime, default=datetime.now)

class RiskZone(Base):
    __tablename__ = "risk_zones"
    id = Column(Integer, primary_key=True, index=True)
    lat = Column(Float)
    lng = Column(Float)
    radius = Column(Float) # meters
    reason = Column(String) # e.g. "Flood"

# Create tables
Base.metadata.create_all(bind=engine)