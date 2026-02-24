import { getAuthContext, unauthorizedResponse } from "@/lib/supabase-server";
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request);
  if (!auth) return unauthorizedResponse();

  const { supabase, userId } = auth;

  const body = await request.json();
  const { messages, peptideName, peptideInfo } = body;

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 }
    );
  }

  // Fetch user profile for context (syringe size, preferences)
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Fetch existing peptides for context
  const { data: existingPeptides } = await supabase
    .from("peptides")
    .select("name, default_dose_mcg, frequency_description")
    .eq("user_id", userId);

  const syringeSize = profile?.syringe_size_ml ?? 0.5;
  const preferences = profile?.preferences ?? {};
  const existingStack = existingPeptides?.map((p) => p.name).join(", ") || "None yet";

  const systemPrompt = `You are a knowledgeable peptide assistant helping a user set up a new peptide in their tracking app. You are conversational, helpful, and concise.

## Context
- The user wants to add "${peptideName}" to their peptide tracker.
- Their syringe size: ${syringeSize} mL (${syringeSize * 100} units)
- Their current peptide stack: ${existingStack}
- Their preferences: ${JSON.stringify(preferences)}
${peptideInfo ? `- Known info about this peptide: ${JSON.stringify(peptideInfo)}` : ""}

## Your Role
Guide the user through setting up this peptide step by step. You need to collect the following information through natural conversation:

1. **Vial size** (in mg) - Ask what vial size they have
2. **Reconstitution** - Ask if it's already reconstituted. If not, suggest an appropriate amount of bacteriostatic water based on the vial size and typical usage, and explain the resulting concentration
3. **Dosage** - Ask about their dosage goals. You can suggest doses based on:
   - What they want to achieve with this peptide
   - Their experience level
   - Common dosing protocols
   - Their syringe size (so they can measure accurately)
4. **Frequency** - Suggest a dosing frequency based on the peptide and their goals
5. **Notes** - Any additional notes they want to track

## Important Rules
- Ask ONE question at a time to keep it conversational
- Be concise - 2-3 sentences max per response
- When suggesting doses, explain the reasoning briefly
- Always calculate and mention syringe units when reconstitution info is known (100 units = 1 mL)
- When you have enough information, provide a summary and output a JSON block with the final values

## Finalizing
When you have all the information needed, present a summary and include a JSON code block with exactly this format:
\`\`\`json
{"name": "...", "default_dose_mcg": ..., "frequency_description": "...", "notes": "...", "vial_size_mg": ..., "reconstitution_volume_ml": ...}
\`\`\`

The dose MUST be in micrograms (mcg). If the user gives mg, convert (1mg = 1000mcg).
Only output the JSON when the user confirms they're happy with the setup.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 512,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const reply = textBlock?.text ?? "I couldn't generate a response. Please try again.";

    // Check if the response contains a final JSON block
    const jsonMatch = reply.match(/```json\s*\n([\s\S]*?)\n```/);
    let peptideData = null;
    if (jsonMatch) {
      try {
        peptideData = JSON.parse(jsonMatch[1]);
      } catch {
        // JSON parse failed, that's ok - not final yet
      }
    }

    return NextResponse.json({
      reply,
      peptideData,
      done: peptideData !== null,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: "Failed to get AI response" },
      { status: 500 }
    );
  }
}
