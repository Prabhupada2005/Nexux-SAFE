from database import SessionLocal, User

db = SessionLocal()

# Update emergency user password to demo123
emergency_user = db.query(User).filter(User.email == "emergency@test.com").first()

if emergency_user:
    print(f"Found emergency user: {emergency_user.email}")
    print(f"Current password: {emergency_user.password}")
    
    # Update password to demo123
    emergency_user.password = "demo123"
    db.commit()
    
    print("Updated password to: demo123")
    print("\nEmergency login credentials:")
    print("Email: emergency@test.com")
    print("Password: demo123")
    print("Role: emergency")
else:
    print("Emergency user not found!")

db.close()