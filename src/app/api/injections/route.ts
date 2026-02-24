import { getAuthContext, unauthorizedResponse } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50", 10);
  const peptideId = searchParams.get("peptide_id");

  let query = supabase
    .from("injections")
    .select("*, peptides(*)")
    .eq("user_id", userId)
    .order("injection_time", { ascending: false })
    .limit(limit);

  if (peptideId) {
    query = query.eq("peptide_id", peptideId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;
  const body = await request.json();
  const { peptide_id, dose_mcg, injection_site, injection_time, notes } = body;

  if (!peptide_id || dose_mcg == null || !injection_site) {
    return NextResponse.json(
      { error: "peptide_id, dose_mcg, and injection_site are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("injections")
    .insert({
      user_id: userId,
      peptide_id,
      dose_mcg,
      injection_site,
      injection_time: injection_time || new Date().toISOString(),
      notes: notes || null,
    })
    .select("*, peptides(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
