import { getAuthContext, unauthorizedResponse } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;

  const { data, error } = await supabase
    .from("dosing_schedules")
    .select("*, peptides(*)")
    .eq("user_id", userId)
    .order("day_of_week")
    .order("time_of_day");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// Replace entire schedule (delete old + insert new)
export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;
  const body = await request.json();
  const { entries } = body;

  if (!Array.isArray(entries)) {
    return NextResponse.json(
      { error: "entries must be an array" },
      { status: 400 }
    );
  }

  // Delete existing schedule
  const { error: deleteError } = await supabase
    .from("dosing_schedules")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (entries.length === 0) {
    return NextResponse.json([]);
  }

  // Insert new entries
  const rows = entries.map(
    (e: { peptide_id: string; day_of_week: number; time_of_day: string; dose_mcg: number; notes?: string }) => ({
      user_id: userId,
      peptide_id: e.peptide_id,
      day_of_week: e.day_of_week,
      time_of_day: e.time_of_day,
      dose_mcg: e.dose_mcg,
      notes: e.notes || null,
    })
  );

  const { data, error: insertError } = await supabase
    .from("dosing_schedules")
    .insert(rows)
    .select("*, peptides(*)");

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;

  const { error } = await supabase
    .from("dosing_schedules")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
