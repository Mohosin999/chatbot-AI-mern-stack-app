import React, { useState } from "react";
import { X, Info, BarChart3 } from "lucide-react";

const BUDGET_CONFIG = {
  totalTokens: 128_000,
  system: { percent: 10, tokens: 12_800 },
  memory: { percent: 20, tokens: 25_600 },
  history: { percent: 35, tokens: 44_800 },
  toolResults: { percent: 10, tokens: 12_800 },
  reserved: { percent: 25, tokens: 32_000 },
};

const topics = [
  {
    title: "Context Window Budgeting",
    desc: "Token budget is allocated across system prompts (10%), conversation history (35%), tool results (10%), and reserved (25%) within the 128K token window.",
  },
  {
    title: "Conversation Summarization",
    desc: "After 8+ messages, old conversation portions are summarized into a compact form using Gemini, reducing token usage while preserving key context.",
  },
  {
    title: "Context Compression & Pruning",
    desc: "Trivial messages (ok, yes, thanks) are pruned via Trie-based O(k) matching. Multi-turn exchanges are compressed. Token-budget-aware sliding window keeps only the most relevant messages within the history budget.",
  },
  {
    title: "Tool Result Truncation",
    desc: "File analysis results are truncated to 500 tokens with key information extraction. Large outputs are summarized with a preview, line count, and first content lines.",
  },
];

const ContextSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-400" /> Context Engineering
        </h2>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white transition">
          <X size={16} />
        </button>
      </div>

      <div className="mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Token Budget Allocation
        </h3>
        <div className="bg-[#252525] rounded-lg p-3">
          <div className="flex h-3 rounded-full overflow-hidden mb-2">
            <div
              className="bg-blue-500"
              style={{ width: `${BUDGET_CONFIG.system.percent}%` }}
              title={`System: ${BUDGET_CONFIG.system.tokens.toLocaleString()}`}
            />
            <div
              className="bg-green-500"
              style={{ width: `${BUDGET_CONFIG.history.percent}%` }}
              title={`History: ${BUDGET_CONFIG.history.tokens.toLocaleString()}`}
            />
            <div
              className="bg-amber-500"
              style={{ width: `${BUDGET_CONFIG.toolResults.percent}%` }}
              title={`Tools: ${BUDGET_CONFIG.toolResults.tokens.toLocaleString()}`}
            />
            <div
              className="bg-gray-600"
              style={{ width: `${BUDGET_CONFIG.reserved.percent}%` }}
              title={`Reserved: ${BUDGET_CONFIG.reserved.tokens.toLocaleString()}`}
            />
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px]">
            <div className="text-blue-400">Sys</div>
            <div className="text-green-400">Hist</div>
            <div className="text-amber-400">Tool</div>
            <div className="text-gray-400">Resv</div>
          </div>
        </div>
      </div>

      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Applied Techniques
      </h3>

      <div className="flex-1 overflow-y-auto space-y-2">
        {topics.map((topic, idx) => (
          <div
            key={idx}
            className="bg-[#252525] rounded-lg border border-gray-700/50 overflow-hidden cursor-pointer"
            onClick={() => setSelectedTopic(selectedTopic === idx ? null : idx)}
          >
            <div className="flex items-center gap-2 p-3">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 text-xs flex items-center justify-center font-bold shrink-0">
                {idx + 1}
              </span>
              <span className="text-sm text-white font-medium">{topic.title}</span>
              <Info size={14} className="ml-auto text-gray-500 shrink-0" />
            </div>
            {selectedTopic === idx && (
              <div className="px-3 pb-3 text-xs text-gray-400 leading-relaxed border-t border-gray-700/50 pt-2">
                {topic.desc}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContextSettings;
