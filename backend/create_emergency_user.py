from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

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
    print(f"Password: emergency123")
else:
    emergency_user = User(
        email="emergency@manipur.gov.in",
        password="emergency123",
        full_name="Emergency Command Center",
        role="emergency",
        phone="1800-XXX-XXXX"
    )
    db.add(emergency_user)
    db.commit()
    print("✅ Emergency user created successfully!")
    print(f"Email: emergency@manipur.gov.in")
    print(f"Password: emergency123")

db.close()
