// import React, { useEffect } from "react";
// import Markdown from "react-markdown";
// import Prism from "prismjs";
// import TypingIndicator from "./ui/typing-indicator";
// import type { Message as MessageType } from "@/types";

// interface MessageProps {
//   msg: MessageType;
// }

// const Message = ({ msg }: MessageProps) => {
//   useEffect(() => {
//     Prism.highlightAll();
//   }, [msg.content]);

//   if (msg.isTyping) {
//     return (
//       <div className="flex justify-start">
//         <div className="lg:p-3 rounded-lg rounded-bl-none">
//           <TypingIndicator />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div
//       className={`flex ${
//         msg.role === "user" ? "justify-end" : "justify-start"
//       }`}
//     >
//       <div
//         className={`rounded-lg lg:max-w-[90%] ${
//           msg.role === "user"
//             ? "bg-gray-300 dark:bg-[#303030] text-gray-900 dark:text-gray-200 rounded-br-none px-3"
//             : "lg:p-3"
//         }`}
//       >
//         {msg.isStreaming && !msg.content ? (
//           <span className="flex space-x-1">
//             <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
//             <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
//             <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
//           </span>
//         ) : (
//           <div className="text-base reset-tw">
//             <Markdown>{msg.content}</Markdown>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Message;

import React, { useEffect } from "react";
import Markdown from "react-markdown";
import Prism from "prismjs";
import TypingIndicator from "./ui/typing-indicator";
import type { Message as MessageType } from "@/types";

interface MessageProps {
  msg: MessageType;
}

const Message = ({ msg }: MessageProps) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [msg.content]);

  if (msg.isTyping) {
    return (
      <div className="flex justify-start">
        <div className="lg:p-3 rounded-lg rounded-bl-none">
          <TypingIndicator />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex ${
        msg.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`rounded-lg max-w-[90%] ${
          msg.role === "user"
            ? "bg-gray-300 dark:bg-[#303030] text-gray-900 dark:text-gray-200 rounded-br-none px-3"
            : "lg:p-3"
        }`}
      >
        {msg.isStreaming && !msg.content ? (
          <span className="flex space-x-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
          </span>
        ) : (
          <div>
            {msg.files && msg.files.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {msg.files.map((file, i) =>
                  file.mimeType === "application/pdf" ? (
                    <div key={i} className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#3a3a3a] px-2 py-1.5 text-xs">
                      <svg className="text-red-500 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      <span className="max-w-24 truncate text-gray-600 dark:text-gray-400">{file.name}</span>
                    </div>
                  ) : (
                    <img
                      key={i}
                      src={`data:${file.mimeType};base64,${file.data}`}
                      alt={file.name}
                      className="h-16 w-16 rounded-lg object-cover border border-gray-200 dark:border-gray-600"
                    />
                  )
                )}
              </div>
            )}
            <div className="text-base reset-tw">
              <Markdown>{msg.content}</Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
