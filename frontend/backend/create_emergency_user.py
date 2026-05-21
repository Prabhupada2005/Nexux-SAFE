from database import SessionLocal, User

db = SessionLocal()

# Check if emergency user exists
emergency_user = db.query(User).filter(User.phone == "112").first()

if emergency_user:
    print("Emergency user already exists!")
    print(f"Phone: {emergency_user.phone}")
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
    print("Phone: 112")
    print("Password: demo123")

db.close()
