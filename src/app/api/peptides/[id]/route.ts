import { getAuthContext, unauthorizedResponse } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;
  const { id } = await params;
  const body = await request.json();

  const updateFields: Record<string, unknown> = {};
  const allowed = [
    "name",
    "default_dose_mcg",
    "frequency_description",
    "notes",
    "vial_size_mg",
    "reconstitution_volume_ml",
    "archived",
  ];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updateFields[key] = body[key];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("peptides")
    .update(updateFields)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    // Handle missing 'archived' column - retry without it
    if (
      (error.message?.includes("archived") || error.message?.includes("schema cache")) &&
      updateFields.archived !== undefined
    ) {
      const { archived, ...rest } = updateFields;
      void archived;
      if (Object.keys(rest).length === 0) {
        return NextResponse.json(
          { error: "Archive feature requires running migration_005_missing_columns.sql" },
          { status: 400 }
        );
      }
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("peptides")
        .update(rest)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
      return NextResponse.json(fallbackData);
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("peptides")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
