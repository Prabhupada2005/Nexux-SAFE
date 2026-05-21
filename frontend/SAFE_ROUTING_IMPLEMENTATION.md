# Safe Routing Implementation - Consumer Dashboard

## Backend Changes (COMPLETED ✓)
The backend `/safe-route` endpoint now:
- Detects if direct route intersects danger zones
- Calculates waypoints to avoid danger zones
- Returns safe route with waypoints

## Frontend Changes Needed

### 1. Update route calculation when center is selected

Find the code that sets `routePath` and replace with:

```javascript
const calculateSafeRoute = async (centerLat, centerLng) => {
  try {
    const response = await axios.get('http://localhost:8000/safe-route', {
      params: {
        start_lat: userLocation.lat,
        start_lng: userLocation.lng,
        end_lat: centerLat,
        end_lng: centerLng
      }
    });
    
    const { waypoints, has_danger_zones } = response.data;
    
    // Build route path with waypoints
    const path = [[userLocation.lat, userLocation.lng]];
    
    if (waypoints && waypoints.length > 0) {
      waypoints.forEach(wp => path.push([wp.lat, wp.lng]));
    }
    
    path.push([centerLat, centerLng]);
    
    setRoutePath(path);
    
    if (has_danger_zones) {
      // Show notification that route avoids danger zones
      console.log('Route calculated to avoid danger zones');
    }
  } catch (error) {
    // Fallback to direct route
    setRoutePath([[userLocation.lat, userLocation.lng], [centerLat, centerLng]]);
  }
};
```

### 2. Call this function when center is selected

Replace the existing route calculation with:
```javascript
calculateSafeRoute(center.lat, center.lng);
```

## How It Works

1. Consumer selects a food center
2. Frontend calls `/safe-route` with start (user location) and end (center location)
3. Backend checks if direct route intersects any danger zones
4. If yes, calculates waypoints to detour around danger zones
5. Frontend displays the safe route as a green polyline with waypoints
6. Route automatically avoids all verified danger zones

## Visual Result

- **Direct route (no dangers)**: Straight green line
- **Safe route (with dangers)**: Green line with curves avoiding red danger zones
- Danger zones remain visible as red circles
- Route intelligently navigates around them
