export async function getWeather() {

  const latitude = 26.1445;
  const longitude = 91.7362;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,rain,precipitation,weather_code`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Weather data fetch failed");
  }

  const data = await response.json();

  return data.current;
}