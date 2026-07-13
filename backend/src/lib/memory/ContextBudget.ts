import type { IContextBudget } from "./types";

export interface IBudgetConfig {
  totalTokens: number;
  systemPercent: number;
  memoryPercent: number;
  historyPercent: number;
  toolPercent: number;
  reservedPercent: number;
}

const DEFAULT_CONFIG: IBudgetConfig = {
  totalTokens: 128_000,
  systemPercent: 10,
  memoryPercent: 5,
  historyPercent: 35,
  toolPercent: 10,
  reservedPercent: 25,
};

export class ContextBudget {
  private config: IBudgetConfig;
  private requestCount = 0;

  constructor(config: Partial<IBudgetConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  allocate(): IContextBudget {
    const total = this.config.totalTokens;
    return {
      total,
      system: Math.floor(total * (this.config.systemPercent / 100)),
      history: Math.floor(total * (this.config.historyPercent / 100)),
      memory: Math.floor(total * (this.config.memoryPercent / 100)),
      toolResults: Math.floor(total * (this.config.toolPercent / 100)),
      reserved: Math.floor(total * (this.config.reservedPercent / 100)),
      used: 0,
    };
  }

  logBudgetAllocation(
    budget: IContextBudget,
    used: Record<string, number>,
  ): void {
    this.requestCount++;
    console.log(
      `[Budget #${this.requestCount}] ` +
        `sys:${budget.system} hist:${budget.history} mem:${budget.memory} tool:${budget.toolResults} ` +
        `used:${JSON.stringify(used)}`,
    );
  }

}

export const contextBudget = new ContextBudget();
