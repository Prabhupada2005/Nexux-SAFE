import requests
import time
import random

# Your backend URL
BACKEND_URL = "http://localhost:8000/iot/update"

print("🔥 Hackathon Demo Mode: Simulating Real-Time Sensor Data for Backend...")

while True:
    # Mimic physical world fluctuations
    # Sensor 1: Warehouse A (Fluctuating)
    temp1 = round(random.uniform(24.5, 33.0), 1)
    humidity1 = random.randint(60, 80)
    mq135_1 = random.randint(800, 2200) # Air Quality
    mq4_1 = random.randint(400, 1200)   # Methane
    
    # Logic to trigger dashboard warnings live
    status1 = "normal"
    quality1 = "Fresh"
    if temp1 > 30 or mq135_1 > 1800:
        status1 = "warning"
        quality1 = "Spoiled"

    # Sensor 2: Cold Storage (Stable Low)
    temp2 = round(random.uniform(2.0, 6.0), 1)
    humidity2 = random.randint(85, 95)

    # Create a list of sensor data objects, matching the backend's expected format
    payload = [
        {
            "id": 1,
            "location": "Warehouse A (Realtime)",
            "temp": temp1,
            "humidity": humidity1,
            "status": status1,
            "food_quality": quality1,
            "gas": "High" if mq135_1 > 1800 else "Normal",
            "smoke": "High" if mq4_1 > 1000 else "Normal"
        },
        {
            "id": 2,
            "location": "Cold Storage B (Realtime)",
            "temp": temp2,
            "humidity": humidity2,
            "status": "normal",
            "food_quality": "Fresh",
            "gas": "Normal",
            "smoke": "Normal"
        }
    ]

    try:
        requests.post(BACKEND_URL, json=payload)
        print(f"📡 Update Sent: {len(payload)} sensors active")
    except Exception as e:
        print(f"❌ Connection Error to Backend: {e}")

    # Update every 3 seconds for a "fast" real-time feel during demo
    time.sleep(3)