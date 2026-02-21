from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import getpass

# Database setup
DATABASE_URL = "sqlite:///./foodtech.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    full_name = Column(String)
    role = Column(String)
    phone = Column(String)

# Create emergency user
db = SessionLocal()

# Check if emergency user already exists
existing = db.query(User).filter(User.email == "emergency@manipur.gov.in").first()

if existing:
    print("Emergency user already exists!")
    print(f"Email: emergency@manipur.gov.in")
else:
    # Prompt for password securely
    print("Creating Emergency Command Center account...")
    password = input("Enter password for emergency account: ")
    
    emergency_user = User(
        email="emergency@manipur.gov.in",
        password=password,
        full_name="Emergency Command Center",
        role="emergency",
        phone="1800-XXX-XXXX"
    )
    db.add(emergency_user)
    db.commit()
    print("✅ Emergency user created successfully!")
    print(f"Email: emergency@manipur.gov.in")
    print(f"Password: [HIDDEN]")

db.close()
