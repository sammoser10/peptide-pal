import { getSupabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await getSupabase()
    .from("peptides")
    .select("*")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, default_dose_mcg, frequency_description, notes } = body;

  if (!name || default_dose_mcg == null) {
    return NextResponse.json(
      { error: "name and default_dose_mcg are required" },
      { status: 400 }
    );
  }

  const { data, error } = await getSupabase()
    .from("peptides")
    .insert({
      name,
      default_dose_mcg,
      frequency_description: frequency_description || "",
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
