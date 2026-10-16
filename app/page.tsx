"use client";

import { useEffect, useMemo, useState } from "react";
import { BrainCircuit, CloudRain, Droplets, Leaf, MapPin, PackageOpen, Plus, RefreshCw, ShieldCheck, ShoppingBasket, Sparkles, ThermometerSun, Truck, Wind } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Weather = { temperature: number; humidity: number; wind: number; rainProbability: number; rainNext3Days: number; updatedAt: string };
type Listing = { id: number | string; crop: string; quantityKg: number; pricePerKg: number; location: string; farmerName: string; fulfilment: "Pickup" | "Delivery" | "Both"; createdAt?: string };

const locations = {
  Bengaluru: { lat: 12.9716, lon: 77.5946 }, Guwahati: { lat: 26.1445, lon: 91.7362 }, Hyderabad: { lat: 17.385, lon: 78.4867 }, Pune: { lat: 18.5204, lon: 73.8567 }, Delhi: { lat: 28.6139, lon: 77.209 },
};
const demoListings: Listing[] = [
  { id: "demo-1", crop: "Tomato", quantityKg: 180, pricePerKg: 32, location: "Kolar", farmerName: "Ravi K.", fulfilment: "Both" },
  { id: "demo-2", crop: "Rice", quantityKg: 600, pricePerKg: 41, location: "Mandya", farmerName: "Meena Farms", fulfilment: "Pickup" },
  { id: "demo-3", crop: "Green chilli", quantityKg: 90, pricePerKg: 58, location: "Hassan", farmerName: "Anil G.", fulfilment: "Delivery" },
];
const featureLabel: Record<string, string> = { heat: "High temperature", dryness: "Low humidity", lowMoisture: "Low soil moisture", heavyRain: "Heavy rain forecast", poorDrainage: "Poor drainage", cropSensitivity: "Crop sensitivity" };
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export default function Home() {
  const [city, setCity] = useState<keyof typeof locations>("Bengaluru");
  const [weather, setWeather] = useState<Weather | null>(null);
  const [weatherError, setWeatherError] = useState("");
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [crop, setCrop] = useState("Tomato");
  const [soilMoisture, setSoilMoisture] = useState(42);
  const [drainage, setDrainage] = useState("Moderate");
  const [listings, setListings] = useState<Listing[]>(demoListings);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [listingMessage, setListingMessage] = useState("");

  async function loadWeather(selectedCity = city) {
    setLoadingWeather(true); setWeatherError("");
    const point = locations[selectedCity];
    try {
      const response = await fetch(`/api/weather?lat=${point.lat}&lon=${point.lon}`);
      if (!response.ok) throw new Error("Weather unavailable");
      setWeather(await response.json());
    } catch { setWeatherError("Live weather is temporarily unavailable. Try again in a moment."); }
    finally { setLoadingWeather(false); }
  }

  useEffect(() => {
    loadWeather();
    fetch("/api/listings").then((response) => response.ok ? response.json() : Promise.reject()).then((data) => data.listings?.length && setListings(data.listings)).catch(() => undefined);
  }, []);

  const prediction = useMemo(() => {
    const temp = weather?.temperature ?? 31, humidity = weather?.humidity ?? 58, rain = weather?.rainNext3Days ?? 12;
    const sensitivity: Record<string, number> = { Tomato: 8, Rice: -4, Maize: 2, Potato: 7, Cotton: 1 };
    const contributions = { heat: Math.max(0, temp - 30) * 2.5, dryness: Math.max(0, 55 - humidity) * .6, lowMoisture: Math.max(0, 48 - soilMoisture) * .65, heavyRain: Math.max(0, rain - 45) * .35, poorDrainage: drainage === "Poor" ? 13 : drainage === "Moderate" ? 4 : -3, cropSensitivity: sensitivity[crop] ?? 2 };
    const score = Math.round(clamp(18 + Object.values(contributions).reduce((sum, value) => sum + value, 0)));
    const ordered = Object.entries(contributions).map(([key, value]) => ({ key, label: featureLabel[key], value: Math.round(value * 10) / 10 })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
    return { score, level: score >= 65 ? "High" : score >= 38 ? "Moderate" : "Low", contributions: ordered };
  }, [weather, crop, soilMoisture, drainage]);

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: { registerTool: (tool: object, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(modelContext.registerTool({
      name: "read_crop_stress_prediction",
      title: "Read crop-stress prediction",
      description: "Read the risk score, risk level, and strongest explanation currently visible in FarmSight XAI.",
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({ city, crop, riskScore: prediction.score, riskLevel: prediction.level, strongestFactor: prediction.contributions[0]?.label }),
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [city, crop, prediction]);

  async function submitListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setListingMessage("Saving listing…");
    const form = new FormData(event.currentTarget);
    const payload = { crop: form.get("crop"), quantityKg: Number(form.get("quantityKg")), pricePerKg: Number(form.get("pricePerKg")), location: form.get("location"), farmerName: form.get("farmerName"), fulfilment: form.get("fulfilment") };
    try {
      const response = await fetch("/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error();
      const saved = await response.json();
      setListings((current) => [saved.listing, ...current.filter((item) => !String(item.id).startsWith("demo-"))]);
      setListingMessage("Listed successfully"); setTimeout(() => setDialogOpen(false), 650);
    } catch { setListingMessage("Could not save. Please check the fields and retry."); }
  }

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border/80 bg-background/90 backdrop-blur-xl"><div className="mx-auto flex max-w-[1480px] items-center justify-between px-4 py-3 sm:px-7"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Leaf className="size-5" /></div><div><p className="font-display text-lg font-bold tracking-tight">FarmSight XAI</p><p className="text-xs text-muted-foreground">Explainable field intelligence</p></div></div><div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm"><span className="size-2 rounded-full bg-emerald-500" /> Live data</div></div></header>
    <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-7 sm:py-8">
      <Tabs defaultValue="intelligence" className="space-y-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">No sensors required</p><h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Understand crop risk. Act with confidence.</h1><p className="mt-2 max-w-2xl text-base text-muted-foreground">Live weather plus simple field observations produce an explainable risk prediction—not a black-box answer.</p></div><TabsList className="grid h-11 w-full grid-cols-2 lg:w-[360px]"><TabsTrigger value="intelligence"><BrainCircuit className="size-4" /> Field intelligence</TabsTrigger><TabsTrigger value="market"><ShoppingBasket className="size-4" /> Marketplace</TabsTrigger></TabsList></div>
        <TabsContent value="intelligence" className="space-y-5">
          <section className="grid gap-5 xl:grid-cols-[1.05fr_1.4fr]">
            <div className="panel p-5 sm:p-6"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="eyebrow">Field inputs</p><h2 className="section-title">Tell us what you can observe</h2></div><MapPin className="size-5 text-primary" /></div><div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2"><Label>Nearest city</Label><Select value={city} onValueChange={(value) => { const next = value as keyof typeof locations; setCity(next); loadWeather(next); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.keys(locations).map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Crop</Label><Select value={crop} onValueChange={setCrop}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Tomato", "Rice", "Maize", "Potato", "Cotton"].map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 sm:col-span-2"><div className="flex items-center justify-between"><Label>Observed soil moisture</Label><span className="rounded-md bg-secondary px-2 py-1 text-sm font-semibold">{soilMoisture}%</span></div><Slider value={[soilMoisture]} min={10} max={90} step={1} onValueChange={(value) => setSoilMoisture(value[0])} aria-label="Observed soil moisture" /><p className="text-xs text-muted-foreground">Estimate by touch: dry soil ≈ 20%, slightly moist ≈ 45%, wet ≈ 75%.</p></div>
              <div className="space-y-2 sm:col-span-2"><Label>Field drainage</Label><Select value={drainage} onValueChange={setDrainage}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Good", "Moderate", "Poor"].map((name) => <SelectItem key={name} value={name}>{name}</SelectItem>)}</SelectContent></Select></div>
            </div></div>
            <div className="panel overflow-hidden"><div className="risk-grid p-5 sm:p-7"><div><div className="mb-4 flex items-center gap-2"><Badge variant="outline">Transparent model</Badge><span className="text-xs text-muted-foreground">Logistic baseline v0.1</span></div><div className="flex items-end gap-3"><span className="font-display text-7xl font-bold tracking-tighter">{prediction.score}</span><span className="mb-2 text-lg text-muted-foreground">/100 risk</span></div><Badge className={`mt-3 ${prediction.level === "High" ? "bg-red-600" : prediction.level === "Moderate" ? "bg-amber-500 text-amber-950" : "bg-emerald-600"}`}>{prediction.level} crop-stress risk</Badge><p className="mt-5 max-w-md text-sm leading-6 text-muted-foreground">{prediction.level === "High" ? "Inspect the field today and prioritise irrigation or drainage based on the strongest factor." : prediction.level === "Moderate" ? "Monitor the top contributing factors over the next 48 hours before taking action." : "Current conditions look manageable. Continue normal monitoring."}</p></div>
              <div className="explain-card"><div className="mb-4 flex items-center gap-2"><Sparkles className="size-4 text-amber-500" /><h3 className="font-semibold">Why this prediction?</h3></div><div className="space-y-4">{prediction.contributions.slice(0, 4).map((item) => <div key={item.key}><div className="mb-1.5 flex justify-between text-sm"><span>{item.label}</span><span className={item.value < 0 ? "text-emerald-600" : "text-amber-700"}>{item.value > 0 ? "+" : ""}{item.value} points</span></div><Progress value={clamp(Math.abs(item.value) * 5)} className="h-1.5" /></div>)}</div><p className="mt-5 border-t pt-4 text-xs leading-5 text-muted-foreground">Each bar shows how much that factor moved the prediction. Negative points reduce risk.</p></div>
            </div></div>
          </section>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<ThermometerSun />} label="Temperature" value={weather ? `${weather.temperature}°C` : "—"} detail="Current" loading={loadingWeather} /><Metric icon={<Droplets />} label="Humidity" value={weather ? `${weather.humidity}%` : "—"} detail="Current" loading={loadingWeather} /><Metric icon={<CloudRain />} label="Rain forecast" value={weather ? `${weather.rainNext3Days} mm` : "—"} detail="Next 3 days" loading={loadingWeather} /><Metric icon={<Wind />} label="Wind" value={weather ? `${weather.wind} km/h` : "—"} detail={weather ? `Updated ${new Date(weather.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Current"} loading={loadingWeather} /></section>
          {weatherError && <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><span>{weatherError}</span><Button variant="outline" size="sm" onClick={() => loadWeather()}><RefreshCw className="size-4" /> Retry</Button></div>}
          <section className="panel grid gap-5 p-5 md:grid-cols-[auto_1fr_auto] md:items-center sm:p-6"><div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="size-6" /></div><div><h2 className="font-display text-xl font-bold">Recommended next action</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{prediction.contributions[0]?.key === "heat" ? "Avoid midday irrigation. Check leaves in the early morning and irrigate before 9 AM if the soil feels dry." : prediction.contributions[0]?.key === "heavyRain" || prediction.contributions[0]?.key === "poorDrainage" ? "Clear field drainage channels before the next rain and inspect low-lying areas for standing water." : "Check moisture at two more points in the field before irrigating; one observation may not represent the whole plot."}</p></div><Button onClick={() => setSoilMoisture((value) => Math.min(90, value + 8))}>Simulate action</Button></section>
        </TabsContent>
        <TabsContent value="market" className="space-y-5">
          <section className="panel flex flex-col justify-between gap-5 p-5 sm:flex-row sm:items-center sm:p-7"><div><p className="eyebrow">Farmer-to-buyer inventory</p><h2 className="section-title text-2xl">Fresh crops available nearby</h2><p className="mt-2 text-sm text-muted-foreground">Buyers can arrange pickup or choose farmer-supported delivery.</p></div><Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogTrigger asChild><Button size="lg"><Plus className="size-4" /> List your crop</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Add crop inventory</DialogTitle></DialogHeader><form className="grid gap-4" onSubmit={submitListing}><Field name="farmerName" label="Farmer or farm name" placeholder="Your name" /><div className="grid grid-cols-2 gap-3"><Field name="crop" label="Crop" placeholder="Tomato" /><Field name="location" label="Location" placeholder="Kolar" /></div><div className="grid grid-cols-2 gap-3"><Field name="quantityKg" label="Quantity (kg)" type="number" placeholder="100" /><Field name="pricePerKg" label="Price (₹/kg)" type="number" placeholder="35" /></div><div className="space-y-2"><Label htmlFor="fulfilment">Fulfilment</Label><select id="fulfilment" name="fulfilment" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="Both"><option>Pickup</option><option>Delivery</option><option>Both</option></select></div><Button type="submit">Publish listing</Button>{listingMessage && <p className="text-center text-sm text-muted-foreground" role="status">{listingMessage}</p>}</form></DialogContent></Dialog></section>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{listings.map((item) => <article key={item.id} className="market-card"><div className="flex items-start justify-between"><div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><PackageOpen className="size-5" /></div><Badge variant="secondary">{item.quantityKg} kg</Badge></div><h3 className="mt-5 font-display text-2xl font-bold">{item.crop}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-3.5" />{item.location} · {item.farmerName}</p><div className="mt-5 flex items-end justify-between"><div><p className="text-xs uppercase tracking-wider text-muted-foreground">Price</p><p className="text-xl font-bold">₹{item.pricePerKg}<span className="text-sm font-normal text-muted-foreground">/kg</span></p></div><div className="flex items-center gap-1.5 text-sm"><Truck className="size-4 text-primary" />{item.fulfilment}</div></div><Button className="mt-5 w-full" variant="outline">Contact seller</Button></article>)}</section>
        </TabsContent>
      </Tabs>
    </div>
  </main>;
}

function Metric({ icon, label, value, detail, loading }: { icon: React.ReactNode; label: string; value: string; detail: string; loading: boolean }) { return <div className="panel p-5"><div className="flex items-center justify-between text-primary"><div className="metric-icon">{icon}</div><span className="text-xs font-medium text-muted-foreground">{detail}</span></div><p className="mt-5 text-sm text-muted-foreground">{label}</p><p className={`font-display mt-1 text-2xl font-bold ${loading ? "animate-pulse text-muted-foreground" : ""}`}>{loading ? "Loading…" : value}</p></div> }
function Field({ name, label, ...props }: React.ComponentProps<typeof Input> & { name: string; label: string }) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} required {...props} /></div> }
