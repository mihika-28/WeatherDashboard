# SkyCast — Weather Information Dashboard

A polished, responsive weather dashboard built for the 2-week Frontend Development internship assignment.

## Features

### Required
- City search
- Current temperature
- Weather condition and icon
- Humidity
- Wind speed
- Loading state
- Error handling
- Responsive design

### Bonus
- 5-day forecast
- Current location weather
- Dark mode
- Recent searches
- Celsius/Fahrenheit switch
- Pressure, visibility, rain chance and wind direction
- Dynamic weather tips

## Tech Stack
- HTML5
- CSS3
- Vanilla JavaScript
- Fetch API
- Open-Meteo public weather and geocoding APIs

## Run in VS Code

1. Open this folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

You can also deploy the folder to GitHub Pages, Netlify or Vercel.

## API
This project uses Open-Meteo:
- Weather: https://api.open-meteo.com/
- Geocoding: https://geocoding-api.open-meteo.com/

No API key is required for this demo.

## Suggested project presentation
Explain the project in this order:
1. Problem: users need quick, readable weather information.
2. Solution: a responsive dashboard with search and location support.
3. API flow: city → geocoding → latitude/longitude → weather API → UI.
4. UI: current conditions, weather metrics and 5-day forecast.
5. Bonus features: dark mode, recent searches and unit switching.
6. Error/loading handling.
