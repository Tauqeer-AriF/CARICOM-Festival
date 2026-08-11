import React, { useState, useEffect } from 'react';
import { Sun, CloudSun, CloudRain, CloudLightning, Wind, Droplets, MapPin, RefreshCw } from 'lucide-react';

interface WeatherData {
  tempC: number;
  tempF: number;
  humidity: number;
  windKm: number;
  weatherCode: number;
  condition: string;
  isDay: boolean;
}

interface GrenadaWeatherWidgetProps {
  variant?: 'badge' | 'hero' | 'card';
  className?: string;
}

export const GrenadaWeatherWidget: React.FC<GrenadaWeatherWidgetProps> = ({ 
  variant = 'hero',
  className = ''
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchWeather = async () => {
    setIsRefreshing(true);
    try {
      // St. George's, Grenada coordinates
      const res = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=12.0561&longitude=-61.7485&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&timezone=America%2FPuerto_Rico'
      );
      if (!res.ok) throw new Error('Failed to fetch weather');
      const data = await res.json();
      
      const current = data.current;
      const tempC = Math.round(current.temperature_2m);
      const tempF = Math.round((tempC * 9) / 5 + 32);
      const humidity = current.relative_humidity_2m || 76;
      const windKm = Math.round(current.wind_speed_10m || 15);
      const code = current.weather_code ?? 0;
      const isDay = current.is_day !== 0;

      let condition = 'Tropical Sunshine';
      if (code === 0) condition = isDay ? 'Tropical Sunshine' : 'Clear Caribbean Night';
      else if (code <= 3) condition = 'Partly Cloudy & Breeze';
      else if (code <= 55) condition = 'Warm Tropical Drizzle';
      else if (code <= 65) condition = 'Passing Tropical Shower';
      else if (code <= 82) condition = 'Island Rain Shower';
      else if (code >= 95) condition = 'Tropical Thunderstorm';

      setWeather({
        tempC,
        tempF,
        humidity,
        windKm,
        weatherCode: code,
        condition,
        isDay,
      });
    } catch (err) {
      console.warn('Using default Grenada weather fallback:', err);
      // Fallback realistic Grenada weather data
      setWeather({
        tempC: 29,
        tempF: 84,
        humidity: 74,
        windKm: 18,
        weatherCode: 1,
        condition: 'Tropical Sunshine',
        isDay: true,
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 600000); // refresh every 10 min
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = (code: number, isDay: boolean) => {
    if (code === 0) return isDay ? <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" /> : <CloudSun className="w-5 h-5 text-indigo-300" />;
    if (code <= 3) return <CloudSun className="w-5 h-5 text-amber-300" />;
    if (code <= 82) return <CloudRain className="w-5 h-5 text-sky-400" />;
    if (code >= 95) return <CloudLightning className="w-5 h-5 text-purple-400" />;
    return <Sun className="w-5 h-5 text-amber-400" />;
  };

  if (loading) {
    return (
      <div className={`inline-flex items-center gap-2 bg-[#0E1420]/80 border border-amber-500/20 px-3.5 py-1.5 rounded-full backdrop-blur-md text-slate-400 text-xs animate-pulse ${className}`}>
        <Sun className="w-4 h-4 text-amber-400/50" />
        <span>Fetching St. George's Weather...</span>
      </div>
    );
  }

  if (!weather) return null;

  const displayTemp = unit === 'C' ? `${weather.tempC}°C` : `${weather.tempF}°F`;

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-2.5 bg-[#0A0E17]/90 hover:bg-[#101726] border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs shadow-lg backdrop-blur-md transition-all ${className}`}>
        <div className="flex items-center gap-1.5 font-bold text-amber-300">
          {getWeatherIcon(weather.weatherCode, weather.isDay)}
          <span>{displayTemp}</span>
        </div>
        <span className="w-1 h-1 bg-amber-500/50 rounded-full" />
        <span className="text-slate-300 font-medium">{weather.condition}</span>
        <button
          onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
          className="ml-1 text-[10px] font-extrabold text-amber-400/80 hover:text-amber-300 uppercase px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
          title="Toggle Celsius / Fahrenheit"
        >
          °{unit === 'C' ? 'F' : 'C'}
        </button>
      </div>
    );
  }

  if (variant === 'hero') {
    return (
      <div className={`inline-flex flex-wrap items-center justify-center gap-3 bg-[#0B0F19]/90 border border-amber-500/35 px-4 py-2 rounded-2xl text-xs shadow-2xl backdrop-blur-xl ${className}`}>
        {/* Location & Icon */}
        <div className="flex items-center gap-2 border-r border-white/10 pr-3">
          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-bold text-white tracking-wide">St. George's, Grenada</span>
        </div>

        {/* Temperature & Condition */}
        <div className="flex items-center gap-2">
          {getWeatherIcon(weather.weatherCode, weather.isDay)}
          <span className="font-extrabold text-amber-300 text-sm tracking-tight">{displayTemp}</span>
          <span className="text-slate-300 font-medium hidden sm:inline">({weather.condition})</span>
        </div>

        {/* Details: Humidity & Wind */}
        <div className="hidden md:flex items-center gap-3 border-l border-white/10 pl-3 text-slate-400">
          <div className="flex items-center gap-1" title="Humidity">
            <Droplets className="w-3 h-3 text-sky-400" />
            <span>{weather.humidity}%</span>
          </div>
          <div className="flex items-center gap-1" title="Trade Winds">
            <Wind className="w-3 h-3 text-emerald-400" />
            <span>{weather.windKm} km/h</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 border-l border-white/10 pl-2">
          <button
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            className="text-[10px] font-extrabold text-amber-400 hover:text-amber-300 uppercase px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-colors cursor-pointer"
            title="Switch Temperature Unit"
          >
            °{unit === 'C' ? 'F' : 'C'}
          </button>
          <button
            onClick={fetchWeather}
            disabled={isRefreshing}
            className="p-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Weather Data"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  // Card variant
  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br from-[#0D131F] to-[#0A0D14] border border-amber-500/30 shadow-2xl space-y-3.5 backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            {getWeatherIcon(weather.weatherCode, weather.isDay)}
          </div>
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
              <MapPin className="w-3 h-3" /> ST. GEORGE'S, GRENADA
            </div>
            <h4 className="text-sm font-bold text-white tracking-tight">{weather.condition}</h4>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-black text-amber-300 tracking-tight">{displayTemp}</div>
          <button
            onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}
            className="text-[10px] font-bold text-slate-400 hover:text-amber-300 underline cursor-pointer"
          >
            Switch to °{unit === 'C' ? 'F' : 'C'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
        <div className="p-2 rounded-xl bg-white/5 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-sky-400" /> Humidity</span>
          <span className="font-bold text-white">{weather.humidity}%</span>
        </div>
        <div className="p-2 rounded-xl bg-white/5 flex items-center justify-between">
          <span className="text-slate-400 flex items-center gap-1"><Wind className="w-3.5 h-3.5 text-emerald-400" /> Trade Winds</span>
          <span className="font-bold text-white">{weather.windKm} km/h</span>
        </div>
      </div>
    </div>
  );
};
