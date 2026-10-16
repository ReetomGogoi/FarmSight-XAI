import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({ latitude: String(lat), longitude: String(lon), current: "temperature_2m,relative_humidity_2m,wind_speed_10m", daily: "precipitation_sum,precipitation_probability_max", forecast_days: "3", timezone: "auto" }).toString();
    const response = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 900 } });
    if (!response.ok) throw new Error(`Weather provider returned ${response.status}`);
    const data = await response.json();
    const precipitation: number[] = data.daily?.precipitation_sum ?? [];
    const probabilities: number[] = data.daily?.precipitation_probability_max ?? [];
    return NextResponse.json({ temperature: Math.round(data.current.temperature_2m * 10) / 10, humidity: Math.round(data.current.relative_humidity_2m), wind: Math.round(data.current.wind_speed_10m * 10) / 10, rainProbability: Math.max(0, ...probabilities), rainNext3Days: Math.round(precipitation.reduce((sum, value) => sum + value, 0) * 10) / 10, updatedAt: new Date().toISOString(), source: "Open-Meteo" });
  } catch (error) {
    console.error("weather_fetch_failed", error);
    return NextResponse.json({ error: "Weather service unavailable" }, { status: 503 });
  }
}
