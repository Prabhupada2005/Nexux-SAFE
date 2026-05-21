from database import SessionLocal, User

db = SessionLocal()

print("=== All Users in Database ===")
users = db.query(User).all()

if not users:
    print("No users found! Run 'python seed.py' first.")
else:
    for user in users:
        print(f"Email: {user.email}")
        print(f"   Name: {user.full_name}")
        print(f"   Role: {user.role}")
        print(f"   Password: {user.password}")
        print()

print(f"Total users: {len(users)}")

# Check specifically for emergency user
emergency_user = db.query(User).filter(User.role == "emergency").first()
if emergency_user:
    print("Emergency user found!")
    print(f"   Email: {emergency_user.email}")
    print(f"   Password: {emergency_user.password}")
else:
    print("No emergency user found!")

db.close()