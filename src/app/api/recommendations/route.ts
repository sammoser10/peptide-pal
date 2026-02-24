import { getSupabase } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic();

export async function GET() {
  // Fetch all peptides and recent injections
  const [peptidesResult, injectionsResult] = await Promise.all([
    getSupabase().from("peptides").select("*").order("name"),
    getSupabase()
      .from("injections")
      .select("*, peptides(*)")
      .order("injection_time", { ascending: false })
      .limit(100),
  ]);

  if (peptidesResult.error || injectionsResult.error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }

  const peptides = peptidesResult.data;
  const injections = injectionsResult.data;

  if (peptides.length === 0) {
    return NextResponse.json({
      recommendation:
        "No peptides in your regimen yet. Add a peptide to get started!",
    });
  }

  // Build a summary for Claude
  const now = new Date().toISOString();
  const peptideSummaries = peptides
    .map((p) => {
      const history = injections
        .filter((inj) => inj.peptide_id === p.id)
        .slice(0, 10)
        .map(
          (inj) =>
            `  - ${inj.dose_mcg} mcg at ${inj.injection_site} on ${new Date(inj.injection_time).toLocaleString()} ${inj.notes ? `(${inj.notes})` : ""}`
        )
        .join("\n");

      return `Peptide: ${p.name}
  Default dose: ${p.default_dose_mcg} mcg
  Prescribed frequency: ${p.frequency_description || "Not specified"}
  Notes: ${p.notes || "None"}
  Recent injection history (most recent first):
${history || "  No injections logged yet"}`;
    })
    .join("\n\n");

  const userPrompt = `Current date/time: ${now}

Here is my peptide regimen and injection history:

${peptideSummaries}

Based on this information, please tell me:
1. Which peptide(s) I should take next and when
2. If I'm overdue for any doses
3. Any observations about my injection patterns (e.g., site rotation)
4. A brief schedule for the upcoming week

Keep the response concise and actionable. Use simple language.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      thinking: { type: "adaptive" },
      system:
        "You are a helpful peptide regimen assistant. You help users track their peptide injections and suggest optimal timing for their next doses based on their prescribed frequency and injection history. Always remind users to follow their healthcare provider's instructions. Be concise and practical. Format your response with clear sections using markdown.",
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const recommendation = textBlock?.text ?? "Unable to generate recommendation.";

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json(
      { error: "Failed to get AI recommendation" },
      { status: 500 }
    );
  }
}
