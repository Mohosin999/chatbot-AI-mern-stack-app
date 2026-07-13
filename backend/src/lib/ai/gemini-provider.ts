import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider } from "./provider";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const mapRole = (role: string): string => {
  if (role === "assistant") return "model";
  if (role === "system") return "user";
  return role;
};

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  private getModel() {
    return genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    });
  }

  private mapContents(contents: { role: string; parts: { text: string }[] }[]) {
    return contents.map((c) => ({
      role: mapRole(c.role),
      parts: c.parts,
    }));
  }

  async *generateContentStream(
    contents: { role: string; parts: { text: string }[] }[],
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    const model = this.getModel();
    const result = await model.generateContentStream({ contents: this.mapContents(contents) });
    for await (const chunk of result.stream) {
      if (signal?.aborted) break;
      yield chunk.text();
    }
  }

  async generateContent(
    contents: { role: string; parts: { text: string }[] }[]
  ): Promise<string> {
    const model = this.getModel();
    const result = await model.generateContent({ contents: this.mapContents(contents) });
    return result.response.text().trim();
  }

  async generateContentText(prompt: string): Promise<string> {
    const model = this.getModel();
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }
}
