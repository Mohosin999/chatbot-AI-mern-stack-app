const TypingIndicator = () => {
  return (
    <div className="flex space-x-1">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300" />
    </div>
  );
};

export default TypingIndicator;
