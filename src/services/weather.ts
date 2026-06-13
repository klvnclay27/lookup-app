

export async function getWeather() {
    const response = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true&temperature_unit=fahrenheit"
        
    );
    const data = await response.json();

    return {
        temperature: Math.round(data.current_weather.temperature),
        weatherCode: data.current_weather.weathercode,
    };
}