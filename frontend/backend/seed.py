# backend/seed.py
from database import SessionLocal, User, InventoryItem, engine, Base

# 1. Reset Database (Optional - un-comment to wipe data every time)
# Base.metadata.drop_all(bind=engine)
# Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed_users():
    # ⚠️ DEMO CREDENTIALS - FOR DEVELOPMENT ONLY
    # In production: Use password hashing (bcrypt) and environment variables
    users = [
        {"email": "admin@foodtech.com", "password": "demo123", "role": "admin", "name": "Admin User", "phone": "0000000000"},
        {"email": "consumer@test.com", "password": "demo123", "role": "consumer", "name": "Test Consumer", "phone": "9876543210"},
        {"email": "supplier@test.com", "password": "demo123", "role": "supplier", "name": "Moirang Food Center", "phone": "9876543211"},
        {"email": "emergency@manipur.gov.in", "password": "demo123", "role": "emergency", "name": "Emergency Command Center", "phone": "112"},
        {"email": "emergency@test.com", "password": "demo123", "role": "emergency", "name": "Emergency Coordinator", "phone": "1800-XXX-XXXX"}
    ]

    print("Seeding Users...")
    for user_data in users:
        # Check if exists
        exists = db.query(User).filter(User.phone == user_data["phone"]).first()
        if not exists:
            new_user = User(
                email=user_data["email"],
                password=user_data["password"], # In production, hash this!
                full_name=user_data["name"],
                role=user_data["role"],
                phone=user_data["phone"]
            )
            db.add(new_user)
            print(f"   Created: {user_data['phone']} ({user_data['email']})")
        else:
            print(f"   Skipped (Exists): {user_data['phone']}")

    db.commit()

def seed_inventory():
    # Initial inventory for the supplier
    items = [
        {"name": "Rice", "quantity": 150, "unit": "kg", "category": "Grains"},
        {"name": "Dal", "quantity": 80, "unit": "kg", "category": "Pulses"},
        {"name": "Cooking Oil", "quantity": 25, "unit": "liters", "category": "Oil"},
        {"name": "Vegetables", "quantity": 45, "unit": "kg", "category": "Fresh"},
    ]
    
    # Assign these to the first user for simplicity (or specifically the supplier)
    supplier = db.query(User).filter(User.role == "supplier").first()
    
    if supplier:
        print("\nSeeding Inventory for Supplier...")
        for item in items:
            exists = db.query(InventoryItem).filter(InventoryItem.name == item["name"]).first()
            if not exists:
                new_item = InventoryItem(
                    name=item["name"],
                    quantity=item["quantity"],
                    unit=item["unit"],
                    category=item["category"],
                    owner_id=supplier.id
                )
                db.add(new_item)
                print(f"   Added: {item['name']}")
        db.commit()

if __name__ == "__main__":
    seed_users()
    seed_inventory()
    print("\nDatabase seeding complete!")
    db.close()