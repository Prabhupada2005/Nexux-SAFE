from database import SessionLocal, User

# Create emergency user
db = SessionLocal()

# Check if emergency user already exists
existing = db.query(User).filter(User.email == "emergency@test.com").first()

if existing:
    print("Emergency user already exists!")
    print(f"Email: emergency@test.com")
    print(f"Password: demo123")
    print(f"Role: {existing.role}")
    print("\nYou can now login to emergency dashboard with these credentials.")
else:
    # Create emergency user with demo password
    print("Creating Emergency Command Center account...")
    
    emergency_user = User(
        email="emergency@test.com",
        password="demo123",  # Demo password for hackathon
        full_name="Emergency Command Center",
        role="emergency",
        phone="112"
    )
    db.add(emergency_user)
    db.commit()
    print("Emergency user created successfully!")
    print(f"Email: emergency@test.com")
    print(f"Password: demo123")
    print(f"Role: emergency")
    print("\nYou can now login to emergency dashboard with these credentials.")

db.close()
