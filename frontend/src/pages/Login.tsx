import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";

import { GoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import {
  clearError,
  loginUser,
  registerUser,
  googleLogin,
} from "@/features/auth/authSlice";
import { useAppSelector } from "@/hooks/useAppStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import {
  loginSchema,
  registerSchema,
  type LoginFormData,
  type RegisterFormData,
} from "@/validator/auth";

type AuthMode = "login" | "register";

interface MergedFormData {
  name?: string;
  email: string;
  password: string;
}

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, error, loading } = useAppSelector((state) => state.auth);

  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get("mode") as AuthMode) || "login",
  );

  useEffect(() => {
    document.title = "ChatBOT - Login";
  }, []);

  const modeRef = { current: mode };

  const resolver = (data: MergedFormData) => {
    const schema = modeRef.current === "login" ? loginSchema : registerSchema;
    const result = schema.safeParse(data);
    if (result.success) {
      return { values: result.data as MergedFormData, errors: {} };
    }
    const errors: Record<string, { message: string; type: string }> = {};
    for (const issue of result.error.issues) {
      if (issue.path.length > 0) {
        errors[issue.path[0] as string] = {
          message: issue.message,
          type: issue.code,
        };
      }
    }
    return { values: {}, errors };
  };

  const form = useForm<MergedFormData>({
    resolver,
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    if (user) {
      toast.success(
        mode === "login" ? "Login successful" : "Registration successful",
      );
      form.reset();
      navigate("/loading");
    } else if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [user, error, form, navigate, dispatch, mode]);

  const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
    if (credentialResponse.credential) {
      dispatch(googleLogin(credentialResponse.credential) as any);
    }
  };

  const handleSubmit = (values: MergedFormData) => {
    if (mode === "login") {
      dispatch(loginUser(values as LoginFormData) as any);
    } else {
      dispatch(registerUser(values as RegisterFormData) as any);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    dispatch(clearError());
    form.clearErrors();
  };

  return (
    <div className="bg-[#121212] h-screen overflow-hidden">
      <div className="w-full h-full flex flex-col lg:flex-row">
        {/* --------------- Left Image Section ---------------- */}
        <div className="lg:w-1/2 hidden lg:block">
          <img
            src="/img/banner.png"
            alt="Banner Image"
            className="w-full h-full object-cover"
          />
        </div>

        {/* --------------- Right Form Section ---------------- */}
        <div className="lg:w-1/2 flex items-start lg:items-center justify-center p-4 lg:p-16 xl:p-24 w-full h-full overflow-y-auto">
          <div className="w-full max-w-md mx-auto lg:mx-0 mt-4 lg:mt-0 lg:my-auto">
            <div className="p-2">
              {/* Logo and Title */}
              <div className="mb-8">
                <div className="flex items-center justify-center mb-16 lg:mb-6">
                  <img src="/vite.png" alt="Logo" className="w-12 h-12 mr-2" />
                  <span className="text-xl font-bold text-gray-100">
                    ChatBOT
                  </span>
                </div>

                <div className="text-center">
                  <h2 className="text-5xl lg:text-6xl font-thin! text-gray-300 mb-5">
                    Question what's next
                  </h2>
                  <p className="text-gray-300 text-base">
                    A thinking partner that remembers your conversations, understands
                    context, and helps you think deeper
                  </p>
                </div>
              </div>

              {/* Google Login Button - start */}
              <div className="mb-6">
                <div className="relative">
                  <div className="absolute inset-0 opacity-0 z-10">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => toast.error("Google login failed")}
                      size="large"
                      width="100%"
                      theme="outline"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full pointer-events-none inline-flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-white/80 text-gray-900 rounded-full transition-all duration-200 font-medium text-sm"
                  >
                    <FcGoogle className="w-5 h-5" />
                    Continue with Google
                  </button>
                </div>
              </div>
              {/* Google Login Button - end */}

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#121212] font-semibold px-3 text-gray-500">
                    OR
                  </span>
                </div>
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="flex flex-col gap-4 sm:gap-5"
                  noValidate
                >
                  {mode === "register" && (
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              type="text"
                              autoComplete="name"
                              placeholder="Enter your name"
                              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 placeholder:text-sm focus:border-none focus:ring-blue-500/20 h-10"
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            type="email"
                            autoComplete="email"
                            placeholder="Enter your email"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 placeholder:text-sm focus:border-none focus:ring-blue-500/20 h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            type="password"
                            autoComplete={
                              mode === "login"
                                ? "current-password"
                                : "new-password"
                            }
                            placeholder="Enter your password"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 placeholder:text-sm focus:border-none focus:ring-blue-500/20 h-10"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-gray-800 cursor-pointer border border-gray-600 hover:bg-gray-900 text-gray-200 font-medium py-2.5 h-10 rounded-lg transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : mode === "login" ? (
                      "Login"
                    ) : (
                      "Register"
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-gray-400 mt-6">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="text-blue-400 hover:text-blue-300 hover:underline transition cursor-pointer"
                    >
                      Register
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                      className="text-blue-400 hover:text-blue-300 hover:underline transition cursor-pointer"
                    >
                      Login
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
