import sqlite3

# Connect to database
conn = sqlite3.connect('foodtech.db')
cursor = conn.cursor()

# Add verified column to risk_zones if it doesn't exist
try:
    cursor.execute("ALTER TABLE risk_zones ADD COLUMN verified BOOLEAN DEFAULT 1")
    print("Added 'verified' column to risk_zones table")
except sqlite3.OperationalError:
    print("'verified' column already exists in risk_zones")

# Create sos_alerts table
try:
    cursor.execute('''
        CREATE TABLE sos_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            reason TEXT NOT NULL,
            sender_name TEXT NOT NULL,
            sender_type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            is_official BOOLEAN DEFAULT 0,
            timestamp TEXT NOT NULL
        )
    ''')
    print("Created sos_alerts table")
except sqlite3.OperationalError:
    print("sos_alerts table already exists")

conn.commit()
conn.close()

print("\nDatabase migration completed successfully!")
print("You can now:")
print("1. Send SOS alerts from Consumer/Supplier dashboards")
print("2. View and verify alerts in Emergency portal")
print("3. Verified alerts automatically appear as danger zones on map")
