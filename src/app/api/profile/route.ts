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

  const { syringe_size_ml, onboarding_completed, preferences } = body;

  // Build upsert payload - only include fields that are provided
  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    syringe_size_ml: syringe_size_ml ?? 0.5,
    onboarding_completed: onboarding_completed ?? false,
  };

  if (preferences !== undefined) {
    upsertPayload.preferences = preferences;
  }

  // Upsert profile
  const { data, error } = await supabase
    .from("user_profiles")
    .upsert(upsertPayload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    // Handle missing 'preferences' column - retry without it so onboarding can complete
    if (error.message?.includes("preferences") || error.message?.includes("schema cache")) {
      const fallbackPayload: Record<string, unknown> = {
        user_id: userId,
        syringe_size_ml: syringe_size_ml ?? 0.5,
        onboarding_completed: onboarding_completed ?? false,
      };

      const { data: fallbackData, error: fallbackError } = await supabase
        .from("user_profiles")
        .upsert(fallbackPayload, { onConflict: "user_id" })
        .select()
        .single();

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }

      // Return saved data with preferences attached client-side
      // (preferences not persisted until migration_005_missing_columns.sql is run)
      return NextResponse.json({
        ...fallbackData,
        preferences: preferences || null,
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
