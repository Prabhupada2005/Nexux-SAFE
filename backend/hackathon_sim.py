import requests
import time
import random

# Your exact Firebase URL
FIREBASE_URL = "https://foodtech-iot-default-rtdb.asia-southeast1.firebasedatabase.app/sensors.json"

print("🔥 Hackathon Demo Mode: Simulating Real-Time Sensor Data...")

while True:
    # Mimic physical world fluctuations
    temp = round(random.uniform(24.5, 33.0), 1)  # Fluctuate between 24 and 33 degrees
    humidity = random.randint(60, 80)
    mq135 = random.randint(800, 2200) # Air Quality
    mq4 = random.randint(400, 1200)   # Methane
    
    # Logic to trigger dashboard warnings live
    status = "normal"
    quality = "Good"
    if temp > 30 or mq135 > 1800:
        status = "warning"
        quality = "Risk"

    # Perfect JSON structure for your React Dashboard
    payload = {
        "sensor_1": {
            "location": "Warehouse A-1 (Realtime)",
            "temp": temp,
            "humidity": humidity,
            "status": status,
            "food_quality": quality,
            "gas": "High" if mq135 > 1800 else "Normal",
            "smoke": "High" if mq4 > 1000 else "Normal"
        }
    }

    try:
        requests.put(FIREBASE_URL, json=payload)
        print(f"📡 Update Sent: {temp}°C | {humidity}% | Status: {status.upper()}")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

    # Update every 3 seconds for a "fast" real-time feel during demo
    time.sleep(3)