import { GoogleGenerativeAI } from "@google/generative-ai";
import type { AIProvider, GenerationConfig, ToolDefinition, ToolCall, ToolResult, FunctionCallHandler } from "./provider";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const mapRole = (role: string): string => {
  if (role === "assistant") return "model";
  if (role === "system") return "user";
  return role;
};

export class GeminiProvider implements AIProvider {
  readonly name = "gemini";

  // Creates a Gemini model instance with optional generation config
  private getModel(config?: GenerationConfig) {
    // Only add generationConfig if at least one option is set
    const hasConfig = config && Object.keys(config).length > 0;
    return genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      ...(hasConfig ? { generationConfig: this.mapConfig(config!) } : {}),
    });
  }

  // Convert our generic config to Gemini's format
  private mapConfig(config: GenerationConfig): Record<string, unknown> {
    const gc: Record<string, unknown> = {};
    if (config.temperature !== undefined) gc.temperature = config.temperature;
    if (config.topP !== undefined) gc.topP = config.topP;
    if (config.topK !== undefined) gc.topK = config.topK;
    if (config.maxOutputTokens !== undefined) gc.maxOutputTokens = config.maxOutputTokens;
    if (config.responseMimeType) gc.responseMimeType = config.responseMimeType;
    if (config.responseSchema) gc.responseSchema = config.responseSchema;
    return gc;
  }

  // Convert our generic tool definitions to Gemini's Tool format
  private mapTools(tools: ToolDefinition[]) {
    return [{
      functionDeclarations: tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    }];
  }

  // Convert our generic role format to Gemini's format
  private mapContents(
    contents: { role: string; parts: { text?: string; functionCall?: unknown; functionResponse?: unknown }[] }[]
  ) {
    return contents.map((c) => ({
      role: mapRole(c.role),
      parts: c.parts.map(p => {
        if (p.functionCall) return { functionCall: p.functionCall };
        if (p.functionResponse) return { functionResponse: p.functionResponse };
        return { text: p.text || "" };
      }),
    }));
  }

  /*
   * Internal streaming method with depth tracking.
   * depth prevents infinite loops if the AI keeps calling tools.
   */
  private async *_streamWithTools(
    contents: { role: string; parts: { text?: string; functionCall?: unknown; functionResponse?: unknown }[] }[],
    signal: AbortSignal | undefined,
    tools: ToolDefinition[] | undefined,
    onFunctionCall: FunctionCallHandler | undefined,
    config: GenerationConfig | undefined,
    depth: number = 0,
  ): AsyncGenerator<string> {
    // Safety: max 5 rounds of tool calls
    if (depth > 5) {
      yield "I've used too many tools to answer this. Please try a simpler request.";
      return;
    }

    const model = this.getModel(config);
    const request: any = { contents: this.mapContents(contents) };
    if (tools && tools.length > 0) {
      request.tools = this.mapTools(tools);
    }

    const result = await model.generateContentStream(request);
    const textChunks: string[] = [];

    // Stream all text chunks from this round
    for await (const chunk of result.stream) {
      if (signal?.aborted) break;
      const text = chunk.text();
      if (text) {
        textChunks.push(text);
        yield text;
      }
    }

    if (signal?.aborted) return;

    // After streaming, check if the AI wants to call any function
    const response = await result.response;
    /*
     * Gemini SDK returns functionCalls() from the aggregated response.
     * It returns an array of { name, args, id? } or undefined.
     */
    const rawCalls = (response as any).functionCalls?.();
    const functionCalls: Array<{ name: string; args: Record<string, unknown>; id?: string }> | undefined = rawCalls;

    if (functionCalls && functionCalls.length > 0 && onFunctionCall) {
      const toolResults: ToolResult[] = [];
      for (const fc of functionCalls) {
        const toolCall: ToolCall = {
          name: fc.name,
          args: JSON.stringify(fc.args ?? {}),
          id: fc.id || fc.name,
        };
        const result = await onFunctionCall(toolCall);
        toolResults.push(result);
      }

      // Build Gemini-format parts for the assistant's function call
      const fcParts = functionCalls.map(fc => ({
        functionCall: { name: fc.name, args: fc.args ?? {} },
      }));

      // Build Gemini-format parts for the tool results
      const frParts = toolResults.map(tr => ({
        functionResponse: { name: tr.name, response: { result: tr.result } },
      }));

      // Append to conversation: first the model's function call, then our tool responses
      const updatedContents = [
        ...contents,
        { role: "model" as const, parts: fcParts },
        { role: "user" as const, parts: frParts },
      ];

      // Recurse with the updated conversation
      for await (const chunk of this._streamWithTools(
        updatedContents, signal, tools, onFunctionCall, config, depth + 1
      )) {
        yield chunk;
      }
    }
  }

  /*
   * Non-streaming internal method with depth tracking.
   * Handles the function calling loop internally.
   */
  private async _contentWithTools(
    contents: { role: string; parts: { text?: string; functionCall?: unknown; functionResponse?: unknown }[] }[],
    tools: ToolDefinition[] | undefined,
    onFunctionCall: FunctionCallHandler | undefined,
    config: GenerationConfig | undefined,
    depth: number = 0,
  ): Promise<string> {
    if (depth > 5) {
      return "I've used too many tools to answer this. Please try a simpler request.";
    }

    const model = this.getModel(config);
    const request: any = { contents: this.mapContents(contents) };
    if (tools?.length) {
      request.tools = this.mapTools(tools);
    }

    const result = await model.generateContent(request);
    const response = result.response;

    const rawCalls = (response as any).functionCalls?.();
    const functionCalls: Array<{ name: string; args: Record<string, unknown>; id?: string }> | undefined = rawCalls;

    if (functionCalls?.length && onFunctionCall) {
      const toolResults: ToolResult[] = [];
      for (const fc of functionCalls) {
        const result = await onFunctionCall({
          name: fc.name,
          args: JSON.stringify(fc.args ?? {}),
          id: fc.id || fc.name,
        });
        toolResults.push(result);
      }

      const updatedContents = [
        ...contents,
        { role: "model" as const, parts: functionCalls.map(fc => ({ functionCall: { name: fc.name, args: fc.args ?? {} } })) },
        { role: "user" as const, parts: toolResults.map(tr => ({ functionResponse: { name: tr.name, response: { result: tr.result } } })) },
      ];

      return this._contentWithTools(updatedContents, tools, onFunctionCall, config, depth + 1);
    }

    return response.text().trim();
  }

  async *generateContentStream(
    contents: { role: string; parts: { text: string }[] }[],
    signal?: AbortSignal,
    options?: {
      config?: GenerationConfig;
      tools?: ToolDefinition[];
      onFunctionCall?: FunctionCallHandler;
    }
  ): AsyncGenerator<string> {
    yield* this._streamWithTools(
      contents,
      signal,
      options?.tools,
      options?.onFunctionCall,
      options?.config,
    );
  }

  async generateContent(
    contents: { role: string; parts: { text: string }[] }[],
    options?: {
      config?: GenerationConfig;
      tools?: ToolDefinition[];
      onFunctionCall?: FunctionCallHandler;
    }
  ): Promise<string> {
    return this._contentWithTools(
      contents,
      options?.tools,
      options?.onFunctionCall,
      options?.config,
    );
  }

  async generateContentText(prompt: string): Promise<string> {
    const model = this.getModel({ temperature: 0 });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  }
}
