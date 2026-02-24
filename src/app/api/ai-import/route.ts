import { getAuthContext, unauthorizedResponse } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const body = await request.json();
  const { text } = body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "Text input is required" },
      { status: 400 }
    );
  }

  const systemPrompt = `You are a peptide protocol parser. Given free-form text describing someone's current peptide protocol, extract structured data about each peptide they mention.

For each peptide, extract:
- name: The peptide name (use the standard name, e.g. "BPC-157" not "bpc")
- default_dose_mcg: Their current dose in micrograms. Convert if given in mg (1mg = 1000mcg)
- frequency_description: How often they take it (e.g. "Once daily", "Twice weekly")
- notes: Any relevant details they mention (goals, side effects, etc.)
- vial_size_mg: Vial size in mg if mentioned, otherwise null
- reconstitution_volume_ml: BAC water volume in mL if mentioned, otherwise null
- recent_doses: Array of recent dose entries if they mention specific dates/history. Each entry: { "date": "ISO date string", "dose_mcg": number }. Estimate dates from relative descriptions like "started 3 weeks ago". If no specific history is mentioned, use an empty array.

You MUST respond with valid JSON only (no markdown, no code fences). Use this exact format:
{
  "peptides": [
    {
      "name": "...",
      "default_dose_mcg": ...,
      "frequency_description": "...",
      "notes": "...",
      "vial_size_mg": ...,
      "reconstitution_volume_ml": ...,
      "recent_doses": [{ "date": "...", "dose_mcg": ... }]
    }
  ]
}

Important:
- All doses MUST be in micrograms (mcg). Convert from mg if needed.
- Use reasonable defaults from common protocols when details are vague.
- For dates, use ISO format and estimate based on the current date. When estimating dates from relative descriptions (e.g. "started 3 weeks ago"), default to US Eastern Time (America/New_York, UTC-5 EST / UTC-4 EDT) for the timezone offset.
- If they mention titration/dose changes, include historical doses in recent_doses.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Current date: ${new Date().toISOString()}\nDefault timezone for date estimation: US Eastern Time (America/New_York)\n\nHere is my current protocol:\n\n${text}`,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const raw = textBlock?.text ?? "";

    // Try parsing directly first, then try extracting from markdown code fences
    let jsonStr = raw.trim();

    // Strip markdown code fences if present
    const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    try {
      const parsed = JSON.parse(jsonStr);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("AI import error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
