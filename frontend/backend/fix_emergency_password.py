from database import SessionLocal, User

db = SessionLocal()

# Update emergency user password to demo123
emergency_user = db.query(User).filter(User.phone == "112").first()

if emergency_user:
    print(f"Found emergency user: {emergency_user.phone}")
    print(f"Current password: {emergency_user.password}")
    
    # Update password to demo123
    emergency_user.password = "demo123"
    db.commit()
    
    print("Updated password to: demo123")
    print("\nEmergency login credentials:")
    print("Phone: 112")
    print("Password: demo123")
    print("Role: emergency")
else:
    print("Emergency user not found!")

db.close()