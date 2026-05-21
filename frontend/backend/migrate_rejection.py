import sqlite3

def migrate():
    """Add rejection_reason column to food_requests table"""
    conn = sqlite3.connect('foodtech.db')
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(food_requests)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'rejection_reason' not in columns:
            cursor.execute("ALTER TABLE food_requests ADD COLUMN rejection_reason TEXT")
            conn.commit()
            print("Added rejection_reason column to food_requests table")
        else:
            print("rejection_reason column already exists")
            
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Running migration...")
    migrate()
