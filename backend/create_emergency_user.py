from database import SessionLocal, User

db = SessionLocal()

# Check if emergency user exists
emergency_user = db.query(User).filter(User.email == "emergency@test.com").first()

if emergency_user:
    print("Emergency user already exists!")
    print(f"Email: {emergency_user.email}")
    print(f"Password: {emergency_user.password}")
else:
    # Create emergency user
    new_user = User(
        email="emergency@test.com",
        password="demo123",
        full_name="Emergency Command Center",
        role="emergency",
        phone="112"
    )
    db.add(new_user)
    db.commit()
    print("Emergency user created successfully!")
    print("Email: emergency@test.com")
    print("Password: demo123")

db.close()
