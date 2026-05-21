import sqlite3

# Connect to database
conn = sqlite3.connect('foodtech.db')
cursor = conn.cursor()

# Add new columns to messages table
try:
    cursor.execute("ALTER TABLE messages ADD COLUMN center_id INTEGER DEFAULT 1")
    print("✓ Added center_id column")
except:
    print("center_id column already exists")

try:
    cursor.execute("ALTER TABLE messages ADD COLUMN sender_type TEXT DEFAULT 'consumer'")
    print("✓ Added sender_type column")
except:
    print("sender_type column already exists")

conn.commit()
conn.close()

print("\n✓ Database migration complete!")
print("Restart your backend server now.")
