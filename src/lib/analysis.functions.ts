import { createServerFn } from "@tanstack/react-start";
import { NoObjectGeneratedError, Output, streamText } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MODEL = "google/gemini-3.8-flash";
const MAX_CHARS = 120_000;

export const CLAUSE_TAGS = ["Obligation", "Risk", "Standard", "Ambiguous"] as const;

const analysisSchema = z.object({
  title: z.string().describe("A short human title for this document, max 8 words"),
  documentType: z.string().describe("e.g. Employment Agreement, NDA, Lease"),
  parties: z.array(z.string()).describe("Names or roles of the parties involved"),
  summary: z.string().describe("Plain-language summary, 3-5 short paragraphs, no legalese"),
  keyPoints: z.array(z.string()).describe("5-8 short bullet takeaways in plain language"),
  clauses: z.array(
    z.object({
      reference: z.string().describe("Clause number or section heading, e.g. '4.2 Termination'"),
      heading: z.string().describe("Short name of the clause"),
      tag: z.enum(CLAUSE_TAGS),
      explanation: z.string().describe("ONE line explaining the clause in plain language"),
      excerpt: z.string().describe("A short quote from the clause, max 200 characters"),
    }),
  ),
  lawyerQuestions: z.array(
    z.object({
      question: z.string(),
      why: z.string().describe("One line on why this matters"),
      priority: z.enum(["High", "Medium", "Low"]),
    }),
  ),
});

export type DocumentAnalysis = z.infer<typeof analysisSchema>;
export type Clause = DocumentAnalysis["clauses"][number];
export type LawyerQuestion = DocumentAnalysis["lawyerQuestions"][number];

const SYSTEM = `You are a meticulous contract analyst helping a non-lawyer understand a document they were given.
Rules:
- Use only what is in the document. Never invent clauses, parties or numbers.
- Write in plain English at a 9th-grade reading level. No legalese, no Latin.
- Tag every clause: Obligation (something a party must do), Risk (unfavourable, one-sided or costly),
  Standard (ordinary boilerplate), Ambiguous (vague, undefined or open to interpretation).
- Cover the whole document: aim for 10-30 clause rows depending on length.
- You are not giving legal advice; never tell the user what to decide.`;

function getKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this app yet.");
  return key;
}

export const analyzeDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ fileName: z.string(), text: z.string().min(20) }).parse(input),
  )
  .handler(async ({ data }): Promise<DocumentAnalysis> => {
    const gateway = createLovableAiGatewayProvider(getKey());
    const text = data.text.slice(0, MAX_CHARS);

    try {
      const result = streamText({
        model: gateway(MODEL),
        system: SYSTEM,
        output: Output.object({ schema: analysisSchema }),
        prompt: `File name: ${data.fileName}\n\nDocument text:\n"""\n${text}\n"""\n\nAnalyse this document and produce the structured review.`,
      });
      return await result.output;
    } catch (error) {
      if (NoObjectGeneratedError.isInstance(error)) {
        throw new Error("The analysis came back in an unexpected shape. Please try again.");
      }
      throw error;
    }
  });

export const askDocument = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        text: z.string().min(20),
        question: z.string().min(1),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
          .max(20)
          .default([]),
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<string> => {
    const gateway = createLovableAiGatewayProvider(getKey());
    const text = data.text.slice(0, MAX_CHARS);

    const result = streamText({
      model: gateway(MODEL),
      system: `You answer questions about ONE specific document, shown below.
Answer strictly and only from this document. If the answer is not in it, say:
"I can't find that in this document." and stop.
Quote the relevant clause or section reference when you can. Be concise, plain-English, and never give legal advice.

DOCUMENT:
"""
${text}
"""`,
      messages: [
        ...data.history.map((m) => ({ role: m.role, content: m.content }) as const),
        { role: "user" as const, content: data.question },
      ],
    });

    return await result.text;
  });
