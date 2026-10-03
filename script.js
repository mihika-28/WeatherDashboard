const API = "https://api.open-meteo.com/v1/forecast";
const GEO = "https://geocoding-api.open-meteo.com/v1/search";

const $ = id => document.getElementById(id);
let weatherData = null;
let unit = localStorage.getItem("unit") || "c";
let lastPlace = localStorage.getItem("lastPlace") || "Indore";
let recent = JSON.parse(localStorage.getItem("recentCities") || "[]");

const weatherMap = {
  0:["Clear sky","☀️"],1:["Mainly clear","🌤️"],2:["Partly cloudy","⛅"],3:["Overcast","☁️"],
  45:["Fog","🌫️"],48:["Rime fog","🌫️"],51:["Light drizzle","🌦️"],53:["Drizzle","🌦️"],55:["Heavy drizzle","🌧️"],
  61:["Light rain","🌦️"],63:["Rain","🌧️"],65:["Heavy rain","🌧️"],71:["Light snow","🌨️"],73:["Snow","🌨️"],75:["Heavy snow","❄️"],
  80:["Rain showers","🌦️"],81:["Rain showers","🌧️"],82:["Heavy showers","⛈️"],95:["Thunderstorm","⛈️"],96:["Storm + hail","⛈️"],99:["Storm + hail","⛈️"]
};

document.addEventListener("DOMContentLoaded", () => {
  $("unitToggle").textContent = unit === "c" ? "°C" : "°F";
  renderRecent();
  applyTheme();
  $("searchForm").addEventListener("submit", e => { e.preventDefault(); searchCity($("cityInput").value.trim()); });
  $("locationBtn").addEventListener("click", getLocation);
  $("themeToggle").addEventListener("click", toggleTheme);
  $("unitToggle").addEventListener("click", () => { unit = unit === "c" ? "f" : "c"; localStorage.setItem("unit", unit); $("unitToggle").textContent = unit === "c" ? "°C" : "°F"; if(weatherData) render(weatherData); });
  searchCity(lastPlace);
});

async function searchCity(city) {
  if (!city) return showError("Please enter a city name.");
  setLoading(true); hideError();
  try {
    const res = await fetch(`${GEO}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    if (!res.ok) throw new Error("Unable to search right now.");
    const data = await res.json();
    if (!data.results?.length) throw new Error(`We couldn't find "${city}". Try another city.`);
    const p = data.results[0];
    const w = await fetchWeather(p.latitude, p.longitude);
    w.place = p;
    lastPlace = p.name;
    localStorage.setItem("lastPlace", p.name);
    addRecent(p.name);
    weatherData = w;
    render(w);
  } catch(err) { showError(err.message || "Something went wrong. Please try again."); }
  finally { setLoading(false); }
}

async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude:lat,longitude:lon,timezone:"auto",
    current:"temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m",
    hourly:"visibility,precipitation_probability",
    daily:"weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max"
  });
  const res = await fetch(`${API}?${params}`);
  if(!res.ok) throw new Error("Weather service is unavailable. Please try again.");
  return res.json();
}

function render(w) {
  const c=w.current, d=w.daily, place=w.place;
  const [condition, emoji]=weatherMap[c.weather_code] || ["Unknown","🌡️"];
  $("placeName").textContent = `${place.name}${place.country ? ", "+place.country : ""}`;
  $("currentDate").textContent = formatDate(new Date());
  $("condition").textContent = condition;
  $("weatherEmoji").textContent = emoji;
  $("temperature").textContent = temp(c.temperature_2m);
  $("feelsLike").textContent = `Feels like ${temp(c.apparent_temperature)}`;
  $("minMax").textContent = `H ${temp(d.temperature_2m_max[0])} • L ${temp(d.temperature_2m_min[0])}`;
  $("humidity").textContent = `${Math.round(c.relative_humidity_2m)}%`;
  $("wind").textContent = `${Math.round(c.wind_speed_10m)} km/h`;
  $("pressure").textContent = `${Math.round(c.pressure_msl)} hPa`;
  const hour = new Date().getHours();
  const visibility = w.hourly.visibility?.[Math.min(hour,w.hourly.visibility.length-1)];
  $("visibility").textContent = visibility ? `${(visibility/1000).toFixed(1)} km` : "--";
  $("rainChance").textContent = `${d.precipitation_probability_max[0] ?? 0}%`;
  $("windDirection").textContent = compass(c.wind_direction_10m);
  $("sunrise").textContent = clock(d.sunrise[0]);
  $("sunset").textContent = clock(d.sunset[0]);
  const progress = sunriseProgress(d.sunrise[0], d.sunset[0]);
  $("sunProgress").style.width = `${progress}%`;
  $("updatedAt").textContent = `Updated ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`;
  renderForecast(d);
  $("weatherTip").textContent = tip(c.weather_code, c.temperature_2m, d.precipitation_probability_max[0]);
}

function renderForecast(d) {
  $("forecast").innerHTML = d.time.slice(0,5).map((date,i)=>{
    const [condition,emoji]=weatherMap[d.weather_code[i]]||["Weather","🌡️"];
    return `<article class="forecast-card"><div class="day">${i===0?"Today":new Date(date).toLocaleDateString([], {weekday:"short"})}</div><div class="emoji">${emoji}</div><div class="fc-temp">${temp(d.temperature_2m_max[i])}<span class="low">${temp(d.temperature_2m_min[i])}</span></div><div class="muted" style="margin-top:8px">${d.precipitation_probability_max[i] ?? 0}% rain</div></article>`;
  }).join("");
}

function temp(c){ return unit==="c" ? `${Math.round(c)}°` : `${Math.round(c*9/5+32)}°`; }
function clock(s){ return new Date(s).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}); }
function formatDate(d){return d.toLocaleDateString([], {weekday:"long",month:"long",day:"numeric"});}
function compass(deg){const a=["N","NE","E","SE","S","SW","W","NW"];return a[Math.round(deg/45)%8];}
function sunriseProgress(a,b){const now=Date.now(),x=new Date(a).getTime(),y=new Date(b).getTime();return Math.max(0,Math.min(100,(now-x)/(y-x)*100));}
function tip(code,temp,rain){if(rain>60)return"Rain is likely today — carrying an umbrella would be a smart choice.";if(code>=80)return"Showers are around. Keep outdoor plans flexible.";if(temp>=35)return"It's a hot day. Stay hydrated and limit prolonged midday exposure.";if(temp<=10)return"Cold conditions today. A warm layer will help.";return"Weather looks manageable. A quick forecast check before heading out is still worthwhile.";}

function getLocation(){
  if(!navigator.geolocation)return showError("Geolocation is not supported by this browser.");
  setLoading(true); hideError();
  navigator.geolocation.getCurrentPosition(async pos=>{
    try{
      const w=await fetchWeather(pos.coords.latitude,pos.coords.longitude);
      w.place={name:"Your Location",country:""};
      weatherData=w;render(w);
    }catch(e){showError(e.message)}
    finally{setLoading(false)}
  },()=>{showError("Location access was denied. Search for your city instead.");setLoading(false)});
}
function addRecent(city){recent=[city,...recent.filter(x=>x.toLowerCase()!==city.toLowerCase())].slice(0,4);localStorage.setItem("recentCities",JSON.stringify(recent));renderRecent();}
function renderRecent(){$("recentSearches").innerHTML=recent.map(c=>`<button type="button" data-city="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");$("recentSearches").querySelectorAll("button").forEach(b=>b.onclick=()=>searchCity(b.dataset.city));}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}
function setLoading(v){$("loading").classList.toggle("hidden",!v);$("dashboard").style.opacity=v?".45":"1";}
function showError(m){$("errorBox").textContent=m;$("errorBox").classList.remove("hidden");}
function hideError(){$("errorBox").classList.add("hidden");}
function toggleTheme(){document.body.classList.toggle("dark");localStorage.setItem("theme",document.body.classList.contains("dark")?"dark":"light");$("themeToggle").textContent=document.body.classList.contains("dark")?"☀":"☾";}
function applyTheme(){if(localStorage.getItem("theme")==="dark"){document.body.classList.add("dark");$("themeToggle").textContent="☀";}}
