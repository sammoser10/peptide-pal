import { getAuthContext, unauthorizedResponse } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;

  // Fetch peptides, recent injections, and user profile
  const [peptidesResult, injectionsResult, profileResult] = await Promise.all([
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
      .limit(100),
    supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single(),
  ]);

  if (peptidesResult.error || injectionsResult.error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }

  // Filter out archived peptides
  const peptides = peptidesResult.data.filter((p: { archived?: boolean }) => !p.archived);
  const injections = injectionsResult.data;
  const profile = profileResult.data;
  const preferences = profile?.preferences;

  if (peptides.length === 0) {
    return NextResponse.json({
      error: "No peptides in your regimen yet. Add a peptide to get started!",
    });
  }

  // Build peptide list with IDs for structured output
  const peptideMap = peptides.map((p) => ({
    id: p.id,
    name: p.name,
    default_dose_mcg: p.default_dose_mcg,
    frequency: p.frequency_description || "Not specified",
    notes: p.notes || "",
  }));

  const peptideSummaries = peptides
    .map((p) => {
      const history = injections
        .filter((inj) => inj.peptide_id === p.id)
        .slice(0, 10)
        .map(
          (inj) =>
            `  - ${inj.dose_mcg} mcg (${Math.round((inj.dose_mcg / 1000) * 10000) / 10000} mg) at ${inj.injection_site} on ${new Date(inj.injection_time).toLocaleString()} ${inj.notes ? `(${inj.notes})` : ""}`
        )
        .join("\n");

      return `Peptide: ${p.name} (ID: ${p.id})
  Default dose: ${p.default_dose_mcg} mcg (${Math.round((p.default_dose_mcg / 1000) * 10000) / 10000} mg)
  Prescribed frequency: ${p.frequency_description || "Not specified"}
  Notes: ${p.notes || "None"}
  Recent injection history (most recent first):
${history || "  No injections logged yet"}`;
    })
    .join("\n\n");

  // Build user context
  let userContext = "";
  if (preferences) {
    const parts: string[] = [];
    if (preferences.sex) parts.push(`Sex: ${preferences.sex}`);
    if (preferences.age) parts.push(`Age: ${preferences.age}`);
    if (preferences.height_cm) parts.push(`Height: ${preferences.height_cm} cm`);
    if (preferences.weight_kg) parts.push(`Weight: ${preferences.weight_kg} kg`);
    if (preferences.body_fat_pct) parts.push(`Body fat: ~${preferences.body_fat_pct}%`);
    if (preferences.goals?.length) parts.push(`Goals: ${preferences.goals.join(", ")}`);
    if (preferences.experience_level) parts.push(`Experience: ${preferences.experience_level}`);
    if (preferences.aggressiveness) parts.push(`Approach: ${preferences.aggressiveness}`);
    if (preferences.notes) parts.push(`Notes: ${preferences.notes}`);
    if (parts.length > 0) {
      userContext = `\n\nUser Profile:\n${parts.join("\n")}`;
    }
  }

  const now = new Date().toISOString();
  const userPrompt = `Current date/time: ${now}${userContext}

Here is my peptide stack and injection history:

${peptideSummaries}

Available peptides (use these exact IDs in your schedule):
${JSON.stringify(peptideMap, null, 2)}

Based on my profile, goals, experience level, aggressiveness preference, and peptide stack, generate an optimal weekly dosing schedule.

You MUST respond with valid JSON only (no markdown, no code fences). Use this exact format:
{
  "schedule": [
    {
      "peptide_id": "<uuid from the peptide list>",
      "day_of_week": <0-6, where 0=Sunday>,
      "time_of_day": "<morning|afternoon|evening>",
      "dose_mcg": <number>,
      "notes": "<optional brief note>"
    }
  ],
  "summary": "<A brief 2-3 sentence explanation of the schedule rationale>",
  "tips": ["<tip 1>", "<tip 2>"]
}

Important:
- Only use peptide IDs from the list above
- Respect the prescribed frequency for each peptide
- Adjust doses based on user's experience and aggressiveness preference
- Consider the user's goals when prioritizing timing
- Spread injections across the week for consistency
- Keep each schedule entry "notes" field SHORT (under 20 words) — just the key info
- Keep "summary" concise (2-3 sentences max)
- Keep "tips" to 3-4 short tips max`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system:
        "You are a peptide regimen scheduling assistant. You create structured weekly dosing schedules based on the user's peptide stack, body composition, goals, and preferences. Always respond with valid JSON only. Be practical and evidence-informed. Always note that users should follow their healthcare provider's guidance.",
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const raw = textBlock?.text ?? "";

    // Strip markdown code fences if present
    let jsonStr = raw.trim();
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    // Parse JSON from response
    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch {
      // If JSON parsing fails, return the raw text as a fallback
      return NextResponse.json({
        schedule: [],
        summary: raw,
        tips: [],
      });
    }
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI recommendation" },
      { status: 500 }
    );
  }
}
