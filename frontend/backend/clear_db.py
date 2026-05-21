from database import SessionLocal, engine, Base
from sqlalchemy import text

def clear_database():
    """Clear all data from database tables"""
    db = SessionLocal()
    try:
        # Get all table names
        tables = ['sos_alerts', 'risk_zones', 'messages', 'food_requests', 'inventory', 'users']
        
        # Delete all records from each table
        for table in tables:
            try:
                db.execute(text(f"DELETE FROM {table}"))
                print(f"✓ Cleared {table}")
            except Exception as e:
                print(f"✗ Error clearing {table}: {e}")
        
        db.commit()
        print("\n✅ Database cleared successfully!")
        print("Run 'python seed.py' to add demo users back.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🗑️  Clearing database...")
    clear_database()
