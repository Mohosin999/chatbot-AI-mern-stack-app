export interface AIProvider {
  readonly name: string;

  generateContentStream(
    contents: { role: string; parts: { text: string }[] }[],
    signal?: AbortSignal
  ): AsyncGenerator<string>;

  generateContent(
    contents: { role: string; parts: { text: string }[] }[]
  ): Promise<string>;

  generateContentText(prompt: string): Promise<string>;
}

export function isQuotaError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("429") ||
    msg.includes("quota") ||
    msg.includes("Quota") ||
    msg.includes("insufficient_quota") ||
    msg.includes("quota_exceeded") ||
    msg.includes("rate_limit")
  );
}
