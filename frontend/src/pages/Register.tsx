import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/login?mode=register", { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
      <LoaderCircle className="w-6 h-6 animate-spin text-blue-400" />
    </div>
  );
};

export default Register;
