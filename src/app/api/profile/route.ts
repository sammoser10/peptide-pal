import { getAuthContext, unauthorizedResponse } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) {
    // Profile doesn't exist yet
    return NextResponse.json(null);
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;
  const body = await request.json();

  const { syringe_size_ml, onboarding_completed } = body;

  // Upsert profile
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(
      {
        user_id: userId,
        syringe_size_ml: syringe_size_ml ?? 0.5,
        onboarding_completed: onboarding_completed ?? false,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
