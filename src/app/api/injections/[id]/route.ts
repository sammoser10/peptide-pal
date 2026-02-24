import { getAuthContext, unauthorizedResponse } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;
  const { id } = await params;

  const { error } = await supabase
    .from("injections")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
