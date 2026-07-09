import { ImSpinner9 } from "react-icons/im";

interface LoaderProps {
  title?: string;
}

const Loader = ({ title = "Loading..." }: LoaderProps) => {
  return (
    <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">
        <ImSpinner9 className="animate-spin text-white text-4xl" />
        <span className="text-white text-lg">{title}</span>
      </div>
    </div>
  );
};

export default Loader;
