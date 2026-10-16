import { NextRequest, NextResponse } from "next/server";
import { env } from "cloudflare:workers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!env.DB) throw new Error("DB unavailable");
    const result = await env.DB.prepare("SELECT id, crop, quantity_kg AS quantityKg, price_per_kg AS pricePerKg, location, farmer_name AS farmerName, fulfilment, created_at AS createdAt FROM listings ORDER BY id DESC LIMIT 50").all();
    return NextResponse.json({ listings: result.results });
  } catch (error) {
    console.error("listings_read_failed", error);
    return NextResponse.json({ listings: [], error: "Marketplace storage unavailable" }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const crop = String(body.crop ?? "").trim().slice(0, 60);
    const location = String(body.location ?? "").trim().slice(0, 100);
    const farmerName = String(body.farmerName ?? "").trim().slice(0, 100);
    const quantityKg = Number(body.quantityKg), pricePerKg = Number(body.pricePerKg);
    const fulfilment = ["Pickup", "Delivery", "Both"].includes(body.fulfilment) ? body.fulfilment : "Both";
    if (!crop || !location || !farmerName || !Number.isFinite(quantityKg) || quantityKg <= 0 || !Number.isFinite(pricePerKg) || pricePerKg <= 0) return NextResponse.json({ error: "Invalid listing" }, { status: 400 });
    if (!env.DB) throw new Error("DB unavailable");
    const result = await env.DB.prepare("INSERT INTO listings (crop, quantity_kg, price_per_kg, location, farmer_name, fulfilment) VALUES (?, ?, ?, ?, ?, ?) RETURNING id, crop, quantity_kg AS quantityKg, price_per_kg AS pricePerKg, location, farmer_name AS farmerName, fulfilment, created_at AS createdAt").bind(crop, quantityKg, pricePerKg, location, farmerName, fulfilment).first();
    return NextResponse.json({ listing: result }, { status: 201 });
  } catch (error) {
    console.error("listing_create_failed", error);
    return NextResponse.json({ error: "Could not save listing" }, { status: 503 });
  }
}
