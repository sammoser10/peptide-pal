import { getAuthContext, unauthorizedResponse } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;

  const body = await request.json();
  const { messages, action } = body;

  // Handle action execution
  if (action) {
    return handleAction(supabase, userId, action);
  }

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 }
    );
  }

  // Fetch full user context
  const [peptidesResult, injectionsResult, scheduleResult, profileResult] =
    await Promise.all([
      supabase
        .from("peptides")
        .select("*")
        .eq("user_id", userId)
        .order("name"),
      supabase
        .from("injections")
        .select("*, peptides(*)")
        .eq("user_id", userId)
        .order("injection_time", { ascending: false })
        .limit(50),
      supabase
        .from("dosing_schedules")
        .select("*, peptides(*)")
        .eq("user_id", userId)
        .order("day_of_week"),
      supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .single(),
    ]);

  const peptides = peptidesResult.data || [];
  const injections = injectionsResult.data || [];
  const schedule = scheduleResult.data || [];
  const profile = profileResult.data;
  const preferences = profile?.preferences;

  // Build context
  const peptideList = peptides
    .map(
      (p) =>
        `- ${p.name} (ID: ${p.id}): ${p.default_dose_mcg}mcg (${Math.round((p.default_dose_mcg / 1000) * 10000) / 10000}mg), ${p.frequency_description || "no frequency set"}${p.vial_size_mg ? `, ${p.vial_size_mg}mg vial + ${p.reconstitution_volume_ml}mL water` : ""}${p.notes ? ` — ${p.notes}` : ""}`
    )
    .join("\n");

  const recentInjections = injections
    .slice(0, 20)
    .map(
      (inj) =>
        `- ${new Date(inj.injection_time).toLocaleDateString()} ${new Date(inj.injection_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}: ${inj.peptides?.name || "Unknown"} ${inj.dose_mcg}mcg at ${inj.injection_site}${inj.notes ? ` (${inj.notes})` : ""}`
    )
    .join("\n");

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const scheduleText = schedule.length
    ? schedule
        .map(
          (s) =>
            `- ${dayNames[s.day_of_week]} ${s.time_of_day}: ${s.peptides?.name || "Unknown"} ${s.dose_mcg}mcg`
        )
        .join("\n")
    : "No schedule set";

  let profileText = "No profile data";
  if (preferences) {
    const parts: string[] = [];
    if (preferences.sex) parts.push(`Sex: ${preferences.sex}`);
    if (preferences.age) parts.push(`Age: ${preferences.age}`);
    if (preferences.height_cm)
      parts.push(`Height: ${preferences.height_cm}cm`);
    if (preferences.weight_kg)
      parts.push(`Weight: ${preferences.weight_kg}kg`);
    if (preferences.body_fat_pct)
      parts.push(`Body fat: ~${preferences.body_fat_pct}%`);
    if (preferences.goals?.length)
      parts.push(`Goals: ${preferences.goals.join(", ")}`);
    if (preferences.experience_level)
      parts.push(`Experience: ${preferences.experience_level}`);
    if (preferences.aggressiveness)
      parts.push(`Approach: ${preferences.aggressiveness}`);
    if (parts.length > 0) profileText = parts.join(" | ");
  }

  const systemPrompt = `You are an AI peptide protocol assistant with full access to this user's account. You are knowledgeable, helpful, and can make changes to their protocol when they ask.

## User Context
Profile: ${profileText}

Current Protocol (Peptides):
${peptideList || "No peptides added yet"}

Current Schedule:
${scheduleText}

Recent Injection History (most recent first):
${recentInjections || "No injections logged yet"}

## Your Capabilities
You can help the user with anything related to their peptide protocol:
- Answer questions about peptides, dosing, protocols, side effects
- Suggest dosage adjustments based on their feedback
- Help troubleshoot issues (not feeling effects, side effects, etc.)
- Recommend protocol changes

## Making Changes
When you want to make a change to the user's account (update a dose, modify schedule, etc.), include a JSON action block at the end of your message using this format:

\`\`\`action
{
  "type": "update_peptide",
  "peptide_id": "<uuid>",
  "changes": { "default_dose_mcg": 500 }
}
\`\`\`

Available action types:
1. **update_peptide** - Update a peptide's properties
   - peptide_id: UUID of the peptide
   - changes: Object with fields to update (default_dose_mcg, frequency_description, notes, vial_size_mg, reconstitution_volume_ml)

2. **add_peptide** - Add a new peptide
   - data: { name, default_dose_mcg, frequency_description, notes, vial_size_mg, reconstitution_volume_ml }

3. **regenerate_schedule** - Regenerate the entire dosing schedule
   - No additional fields needed, this triggers the AI scheduler

## Rules
- Be conversational and concise (2-4 sentences unless more detail is requested)
- ALWAYS ask for user confirmation before proposing an action. Say what you'd recommend and why, then ask if they want you to make the change.
- When the user confirms, include the action block in your response
- Only propose ONE action at a time for clarity
- When discussing doses, mention both mcg and mg for clarity
- Reference their actual data (peptide names, current doses, history) to be specific
- Always note that users should consult their healthcare provider for medical decisions
- If asked about something outside peptides, stay helpful but redirect to your area of expertise`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const reply = textBlock?.text ?? "I couldn't generate a response. Please try again.";

    // Check for action block
    const actionMatch = reply.match(/```action\s*\n([\s\S]*?)\n```/);
    let proposedAction = null;
    let cleanReply = reply;

    if (actionMatch) {
      try {
        proposedAction = JSON.parse(actionMatch[1]);
        cleanReply = reply.replace(/```action\s*\n[\s\S]*?\n```/, "").trim();
      } catch {
        // JSON parse failed, ignore action
      }
    }

    return NextResponse.json({
      reply: cleanReply,
      action: proposedAction,
    });
  } catch (error) {
    console.error("AI assistant error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleAction(supabase: any, userId: string, action: any) {
  try {
    switch (action.type) {
      case "update_peptide": {
        const { peptide_id, changes } = action;
        const allowedFields = [
          "default_dose_mcg",
          "frequency_description",
          "notes",
          "vial_size_mg",
          "reconstitution_volume_ml",
        ];
        const safeChanges: Record<string, unknown> = {};
        for (const key of allowedFields) {
          if (key in changes) safeChanges[key] = changes[key];
        }

        const { error } = await supabase
          .from("peptides")
          .update(safeChanges)
          .eq("id", peptide_id)
          .eq("user_id", userId);

        if (error) {
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }
        return NextResponse.json({ success: true });
      }

      case "add_peptide": {
        const { data: peptideData } = action;
        const { error } = await supabase.from("peptides").insert({
          user_id: userId,
          name: peptideData.name,
          default_dose_mcg: peptideData.default_dose_mcg,
          frequency_description: peptideData.frequency_description || "",
          notes: peptideData.notes || null,
          vial_size_mg: peptideData.vial_size_mg || null,
          reconstitution_volume_ml:
            peptideData.reconstitution_volume_ml || null,
        });

        if (error) {
          return NextResponse.json(
            { error: error.message },
            { status: 500 }
          );
        }
        return NextResponse.json({ success: true });
      }

      case "regenerate_schedule": {
        return NextResponse.json({
          success: true,
          action: "regenerate_schedule",
        });
      }

      default:
        return NextResponse.json(
          { error: "Unknown action type" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return NextResponse.json(
      { error: "Failed to execute action" },
      { status: 500 }
    );
  }
}
