// import { useState, useRef, useEffect, useCallback } from "react";
// import { useForm } from "react-hook-form";
// import { useDispatch } from "react-redux";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import toast from "react-hot-toast";
// import { LoaderCircle, Bot } from "lucide-react";

// import { GoogleLogin } from "@react-oauth/google";
// import { FcGoogle } from "react-icons/fc";
// import {
//   clearError,
//   loginUser,
//   registerUser,
//   googleLogin,
// } from "@/features/auth/authSlice";
// import { useAppSelector } from "@/hooks/useAppStore";

// import Plans from "@/components/Plans";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";

// import {
//   loginSchema,
//   registerSchema,
//   type LoginFormData,
//   type RegisterFormData,
// } from "@/validator/auth";

// type AuthMode = "login" | "register";

// interface MergedFormData {
//   name?: string;
//   email: string;
//   password: string;
// }

// const Login = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const { user, error, loading } = useAppSelector((state) => state.auth);

//   const [mode, setMode] = useState<AuthMode>(
//     (searchParams.get("mode") as AuthMode) || "login",
//   );

//   const images = ["/img/cortex.png"];

//   const [currentImage, setCurrentImage] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentImage((prev) => (prev + 1) % images.length);
//     }, 4000);
//     return () => clearInterval(interval);
//   }, []);

//   const formRef = useRef<HTMLDivElement>(null);
//   const emailInputRef = useRef<HTMLInputElement>(null);
//   const nameInputRef = useRef<HTMLInputElement>(null);
//   const modeRef = useRef(mode);
//   modeRef.current = mode;

//   const resolver = useCallback((data: MergedFormData) => {
//     const schema = modeRef.current === "login" ? loginSchema : registerSchema;
//     const result = schema.safeParse(data);
//     if (result.success) {
//       return { values: result.data as MergedFormData, errors: {} };
//     }
//     const errors: Record<string, { message: string; type: string }> = {};
//     for (const issue of result.error.issues) {
//       if (issue.path.length > 0) {
//         errors[issue.path[0] as string] = {
//           message: issue.message,
//           type: issue.code,
//         };
//       }
//     }
//     return { values: {}, errors };
//   }, []);

//   const form = useForm<MergedFormData>({
//     resolver,
//     defaultValues: { name: "", email: "", password: "" },
//   });

//   useEffect(() => {
//     form.clearErrors();
//     const input =
//       mode === "login" ? emailInputRef.current : nameInputRef.current;
//     input?.focus();
//   }, [mode, form]);

//   useEffect(() => {
//     if (user) {
//       toast.success(
//         mode === "login" ? "Login successful" : "Registration successful",
//       );
//       form.reset();
//       navigate("/loading");
//     } else if (error) {
//       toast.error(error);
//       dispatch(clearError());
//     }
//   }, [user, error, form, navigate, dispatch, mode]);

//   const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
//     if (credentialResponse.credential) {
//       dispatch(googleLogin(credentialResponse.credential) as any);
//     }
//   };

//   const handleSubmit = useCallback(
//     (values: MergedFormData) => {
//       if (mode === "login") {
//         dispatch(loginUser(values as LoginFormData) as any);
//       } else {
//         dispatch(registerUser(values as RegisterFormData) as any);
//       }
//     },
//     [dispatch, mode],
//   );

//   const scrollToForm = () => {
//     formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
//     setTimeout(() => {
//       (mode === "login"
//         ? emailInputRef.current
//         : nameInputRef.current
//       )?.focus();
//     }, 500);
//   };

//   const switchMode = (newMode: AuthMode) => {
//     setMode(newMode);
//     dispatch(clearError());
//     form.clearErrors();
//   };

//   return (
//     <div className="bg-[#121212]">
//       {/* Hero Section */}
//       <div className="w-full min-h-screen flex flex-col lg:flex-row items-center lg:px-12">
//         {/* ===================================================================
//                                  Left - Form Section
//           ===================================================================*/}
//         <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-8 w-full">
//           <div className="relative w-[min(70vw,600px)] aspect-square rounded-full overflow-hidden">
//             {images.map((src, index) => (
//               <div
//                 key={src}
//                 className="absolute inset-0 transition-opacity duration-1000"
//                 style={{ opacity: index === currentImage ? 1 : 0 }}
//               >
//                 <img src={src} alt="" className="w-full h-full object-cover" />
//               </div>
//             ))}
//             <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/70" />
//           </div>
//         </div>

//         {/* ===================================================================
//                                  Right - Form Section
//           ===================================================================*/}
//         <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-32">
//           <div ref={formRef} className="w-full">
//             {/* <div className="flex lg:hidden items-center gap-2 mb-8">
//               <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
//                 <Bot className="w-5 h-5 text-white" />
//               </div>
//               <span className="text-lg font-bold text-white">SmartChat</span>
//             </div> */}

//             <div className="mb-8">
//               <h2 className="text-3xl font-bold text-white mb-2">
//                 {mode === "login" ? "Welcome back" : "Create account"}
//               </h2>
//               <p className="text-gray-400">
//                 {mode === "login"
//                   ? "Sign in to continue to Chat-AI"
//                   : "Sign up to get started with Chat-AI"}
//               </p>
//             </div>

//             {/* ==================================================
//                                  Form
//              ===================================================*/}
//             <Form {...form}>
//               <form
//                 onSubmit={form.handleSubmit(handleSubmit)}
//                 className="flex flex-col gap-5"
//                 noValidate
//               >
//                 {mode === "register" && (
//                   <FormField
//                     control={form.control}
//                     name="name"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="text-gray-300 text-sm">
//                           Name
//                         </FormLabel>
//                         <FormControl>
//                           <Input
//                             {...field}
//                             ref={nameInputRef}
//                             value={field.value ?? ""}
//                             type="text"
//                             autoComplete="name"
//                             placeholder="John Doe"
//                             className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-none focus:ring-blue-500/20 h-11"
//                           />
//                         </FormControl>
//                         <FormMessage className="text-xs" />
//                       </FormItem>
//                     )}
//                   />
//                 )}

//                 <FormField
//                   control={form.control}
//                   name="email"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-gray-300 text-sm">
//                         Email
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           {...field}
//                           ref={mode === "login" ? emailInputRef : undefined}
//                           value={field.value ?? ""}
//                           type="email"
//                           autoComplete="email"
//                           placeholder="johndoe@example.com"
//                           className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-none focus:ring-blue-500/20 h-11"
//                         />
//                       </FormControl>
//                       <FormMessage className="text-xs" />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="password"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-gray-300 text-sm">
//                         Password
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           {...field}
//                           value={field.value ?? ""}
//                           type="password"
//                           autoComplete={
//                             mode === "login"
//                               ? "current-password"
//                               : "new-password"
//                           }
//                           placeholder="••••••••"
//                           className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-none focus:ring-blue-500/20 h-11"
//                         />
//                       </FormControl>
//                       <FormMessage className="text-xs" />
//                     </FormItem>
//                   )}
//                 />

//                 <Button
//                   type="submit"
//                   className="w-full cursor-pointer bg-white hover:bg-white/80 text-gray-900 font-medium py-2.5 h-11 rounded-lg transition-all duration-200"
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <LoaderCircle className="w-5 h-5 animate-spin" />
//                   ) : mode === "login" ? (
//                     "Sign In"
//                   ) : (
//                     "Create Account"
//                   )}
//                 </Button>
//               </form>
//             </Form>

//             <div className="relative my-6">
//               <div className="absolute inset-0 flex items-center">
//                 <span className="w-full border-t border-white/10" />
//               </div>
//               <div className="relative flex justify-center text-xs uppercase">
//                 <span className="bg-[#0a0a0a] px-3 text-gray-500">
//                   Or continue with
//                 </span>
//               </div>
//             </div>

//             <div className="relative">
//               <div className="absolute inset-0 opacity-0 z-10">
//                 <GoogleLogin
//                   onSuccess={handleGoogleSuccess}
//                   onError={() => toast.error("Google login failed")}
//                   size="large"
//                   width="100%"
//                   theme="outline"
//                 />
//               </div>
//               <button
//                 type="button"
//                 className="w-full pointer-events-none inline-flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 text-gray-700 dark:text-white font-medium text-sm"
//               >
//                 <FcGoogle className="w-5 h-5" />
//                 Continue with Google
//               </button>
//             </div>

//             <p className="text-center text-sm text-gray-500 mt-6">
//               {mode === "login" ? (
//                 <>
//                   Don't have an account?{" "}
//                   <button
//                     type="button"
//                     onClick={() => switchMode("register")}
//                     className="text-blue-400 hover:text-blue-300 hover:underline transition cursor-pointer"
//                   >
//                     Sign up
//                   </button>
//                 </>
//               ) : (
//                 <>
//                   Already have an account?{" "}
//                   <button
//                     type="button"
//                     onClick={() => switchMode("login")}
//                     className="text-blue-400 hover:text-blue-300 hover:underline transition cursor-pointer"
//                   >
//                     Sign in
//                   </button>
//                 </>
//               )}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* ===================================================================
//                                   Pricing Section
//         ===================================================================*/}
//       <Plans onPlanClick={scrollToForm} />
//     </div>
//   );
// };

// export default Login;

// import { useState, useRef, useEffect, useCallback } from "react";
// import { useForm } from "react-hook-form";
// import { useDispatch } from "react-redux";
// import { useNavigate, useSearchParams } from "react-router-dom";
// import toast from "react-hot-toast";
// import { LoaderCircle, Bot } from "lucide-react";

// import { GoogleLogin } from "@react-oauth/google";
// import { FcGoogle } from "react-icons/fc";
// import {
//   clearError,
//   loginUser,
//   registerUser,
//   googleLogin,
// } from "@/features/auth/authSlice";
// import { useAppSelector } from "@/hooks/useAppStore";

// import Plans from "@/components/Plans";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from "@/components/ui/form";

// import {
//   loginSchema,
//   registerSchema,
//   type LoginFormData,
//   type RegisterFormData,
// } from "@/validator/auth";

// type AuthMode = "login" | "register";

// interface MergedFormData {
//   name?: string;
//   email: string;
//   password: string;
// }

// const Login = () => {
//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const { user, error, loading } = useAppSelector((state) => state.auth);

//   const [mode, setMode] = useState<AuthMode>(
//     (searchParams.get("mode") as AuthMode) || "login",
//   );

//   const images = ["/img/cortex.png"];

//   const [currentImage, setCurrentImage] = useState(0);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCurrentImage((prev) => (prev + 1) % images.length);
//     }, 4000);
//     return () => clearInterval(interval);
//   }, []);

//   const formRef = useRef<HTMLDivElement>(null);
//   const emailInputRef = useRef<HTMLInputElement>(null);
//   const nameInputRef = useRef<HTMLInputElement>(null);
//   const modeRef = useRef(mode);
//   modeRef.current = mode;

//   const resolver = useCallback((data: MergedFormData) => {
//     const schema = modeRef.current === "login" ? loginSchema : registerSchema;
//     const result = schema.safeParse(data);
//     if (result.success) {
//       return { values: result.data as MergedFormData, errors: {} };
//     }
//     const errors: Record<string, { message: string; type: string }> = {};
//     for (const issue of result.error.issues) {
//       if (issue.path.length > 0) {
//         errors[issue.path[0] as string] = {
//           message: issue.message,
//           type: issue.code,
//         };
//       }
//     }
//     return { values: {}, errors };
//   }, []);

//   const form = useForm<MergedFormData>({
//     resolver,
//     defaultValues: { name: "", email: "", password: "" },
//   });

//   useEffect(() => {
//     form.clearErrors();
//     const input =
//       mode === "login" ? emailInputRef.current : nameInputRef.current;
//     input?.focus();
//   }, [mode, form]);

//   useEffect(() => {
//     if (user) {
//       toast.success(
//         mode === "login" ? "Login successful" : "Registration successful",
//       );
//       form.reset();
//       navigate("/loading");
//     } else if (error) {
//       toast.error(error);
//       dispatch(clearError());
//     }
//   }, [user, error, form, navigate, dispatch, mode]);

//   const handleGoogleSuccess = (credentialResponse: { credential?: string }) => {
//     if (credentialResponse.credential) {
//       dispatch(googleLogin(credentialResponse.credential) as any);
//     }
//   };

//   const handleSubmit = useCallback(
//     (values: MergedFormData) => {
//       if (mode === "login") {
//         dispatch(loginUser(values as LoginFormData) as any);
//       } else {
//         dispatch(registerUser(values as RegisterFormData) as any);
//       }
//     },
//     [dispatch, mode],
//   );

//   const scrollToForm = () => {
//     formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
//     setTimeout(() => {
//       (mode === "login"
//         ? emailInputRef.current
//         : nameInputRef.current
//       )?.focus();
//     }, 500);
//   };

//   const switchMode = (newMode: AuthMode) => {
//     setMode(newMode);
//     dispatch(clearError());
//     form.clearErrors();
//   };

//   return (
//     <div className="bg-[#121212] pt-10 lg:pt-0">
//       {/* Hero Section */}
//       <div className="w-full min-h-screen flex flex-col lg:flex-row items-center lg:px-12">
//         {/* ===================================================================
//                                  Left - Form Section
//           ===================================================================*/}
//         <div className="lg:w-1/2 flex items-center justify-center p-0 lg:p-8 w-full">
//           <div className="relative w-[min(70vw,600px)] aspect-square rounded-full overflow-hidden">
//             {images.map((src, index) => (
//               <div
//                 key={src}
//                 className="absolute inset-0 transition-opacity duration-1000"
//                 style={{ opacity: index === currentImage ? 1 : 0 }}
//               >
//                 <img src={src} alt="" className="w-full h-full object-cover" />
//               </div>
//             ))}
//             <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/70" />
//           </div>
//         </div>

//         {/* ===================================================================
//                                  Right - Form Section
//           ===================================================================*/}
//         <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-32 w-full">
//           <div ref={formRef} className="w-full max-w-md mx-auto lg:mx-0">
//             {/* <div className="flex lg:hidden items-center gap-2 mb-8">
//               <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
//                 <Bot className="w-5 h-5 text-white" />
//               </div>
//               <span className="text-lg font-bold text-white">SmartChat</span>
//             </div> */}

//             <div className="mb-8">
//               <h2 className="text-3xl font-bold text-white mb-2">
//                 {mode === "login" ? "Welcome back" : "Create account"}
//               </h2>
//               <p className="text-gray-400">
//                 {mode === "login"
//                   ? "Sign in to continue to Chat-AI"
//                   : "Sign up to get started with Chat-AI"}
//               </p>
//             </div>

//             {/* ==================================================
//                                  Form
//              ===================================================*/}
//             <Form {...form}>
//               <form
//                 onSubmit={form.handleSubmit(handleSubmit)}
//                 className="flex flex-col gap-5"
//                 noValidate
//               >
//                 {mode === "register" && (
//                   <FormField
//                     control={form.control}
//                     name="name"
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel className="text-gray-300 text-sm">
//                           Name
//                         </FormLabel>
//                         <FormControl>
//                           <Input
//                             {...field}
//                             ref={nameInputRef}
//                             value={field.value ?? ""}
//                             type="text"
//                             autoComplete="name"
//                             placeholder="John Doe"
//                             className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-none focus:ring-blue-500/20 h-11"
//                           />
//                         </FormControl>
//                         <FormMessage className="text-xs" />
//                       </FormItem>
//                     )}
//                   />
//                 )}

//                 <FormField
//                   control={form.control}
//                   name="email"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-gray-300 text-sm">
//                         Email
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           {...field}
//                           ref={mode === "login" ? emailInputRef : undefined}
//                           value={field.value ?? ""}
//                           type="email"
//                           autoComplete="email"
//                           placeholder="johndoe@example.com"
//                           className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-none focus:ring-blue-500/20 h-11"
//                         />
//                       </FormControl>
//                       <FormMessage className="text-xs" />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="password"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel className="text-gray-300 text-sm">
//                         Password
//                       </FormLabel>
//                       <FormControl>
//                         <Input
//                           {...field}
//                           value={field.value ?? ""}
//                           type="password"
//                           autoComplete={
//                             mode === "login"
//                               ? "current-password"
//                               : "new-password"
//                           }
//                           placeholder="••••••••"
//                           className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-none focus:ring-blue-500/20 h-11"
//                         />
//                       </FormControl>
//                       <FormMessage className="text-xs" />
//                     </FormItem>
//                   )}
//                 />

//                 <Button
//                   type="submit"
//                   className="w-full cursor-pointer bg-white hover:bg-white/80 text-gray-900 font-medium py-2.5 h-11 rounded-lg transition-all duration-200"
//                   disabled={loading}
//                 >
//                   {loading ? (
//                     <LoaderCircle className="w-5 h-5 animate-spin" />
//                   ) : mode === "login" ? (
//                     "Sign In"
//                   ) : (
//                     "Create Account"
//                   )}
//                 </Button>
//               </form>
//             </Form>

//             <div className="relative my-6">
//               <div className="absolute inset-0 flex items-center">
//                 <span className="w-full border-t border-white/10" />
//               </div>
//               <div className="relative flex justify-center text-xs uppercase">
//                 <span className="bg-[#0a0a0a] px-3 text-gray-500">
//                   Or continue with
//                 </span>
//               </div>
//             </div>

//             <div className="relative">
//               <div className="absolute inset-0 opacity-0 z-10">
//                 <GoogleLogin
//                   onSuccess={handleGoogleSuccess}
//                   onError={() => toast.error("Google login failed")}
//                   size="large"
//                   width="100%"
//                   theme="outline"
//                 />
//               </div>
//               <button
//                 type="button"
//                 className="w-full pointer-events-none inline-flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 text-gray-700 dark:text-white font-medium text-sm"
//               >
//                 <FcGoogle className="w-5 h-5" />
//                 Continue with Google
//               </button>
//             </div>

//             <p className="text-center text-sm text-gray-500 mt-6">
//               {mode === "login" ? (
//                 <>
//                   Don't have an account?{" "}
//                   <button
//                     type="button"
//                     onClick={() => switchMode("register")}
//                     className="text-blue-400 hover:text-blue-300 hover:underline transition cursor-pointer"
//                   >
//                     Sign up
//                   </button>
//                 </>
//               ) : (
//                 <>
//                   Already have an account?{" "}
//                   <button
//                     type="button"
//                     onClick={() => switchMode("login")}
//                     className="text-blue-400 hover:text-blue-300 hover:underline transition cursor-pointer"
//                   >
//                     Sign in
//                   </button>
//                 </>
//               )}
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* ===================================================================
//                                   Pricing Section
//         ===================================================================*/}
//       <Plans onPlanClick={scrollToForm} />
//     </div>
//   );
// };

// export default Login;

import { useState, useRef, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { LoaderCircle, Bot } from "lucide-react";

import { GoogleLogin } from "@react-oauth/google";
import { FcGoogle } from "react-icons/fc";
import {
  clearError,
  loginUser,
  registerUser,
  googleLogin,
} from "@/features/auth/authSlice";
import { useAppSelector } from "@/hooks/useAppStore";

import Plans from "@/components/Plans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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

  const images = ["/img/cortex.png"];

  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const formRef = useRef<HTMLDivElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const resolver = useCallback((data: MergedFormData) => {
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
  }, []);

  const form = useForm<MergedFormData>({
    resolver,
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    form.clearErrors();
    const input =
      mode === "login" ? emailInputRef.current : nameInputRef.current;
    input?.focus();
  }, [mode, form]);

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

  const handleSubmit = useCallback(
    (values: MergedFormData) => {
      if (mode === "login") {
        dispatch(loginUser(values as LoginFormData) as any);
      } else {
        dispatch(registerUser(values as RegisterFormData) as any);
      }
    },
    [dispatch, mode],
  );

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      (mode === "login"
        ? emailInputRef.current
        : nameInputRef.current
      )?.focus();
    }, 500);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    dispatch(clearError());
    form.clearErrors();
  };

  return (
    <div className="bg-[#121212] pt-10 lg:pt-0">
      {/* Hero Section */}
      <div className="w-full min-h-screen flex flex-col lg:flex-row items-center lg:px-12">
        {/* ===================================================================
                                 Left - Image Section
          ===================================================================*/}
        <div className="lg:w-1/2 flex items-center justify-center p-0 lg:p-8 pb-6 lg:pb-0 w-full">
          <div className="relative w-[min(70vw,600px)] aspect-square rounded-full overflow-hidden">
            {images.map((src, index) => (
              <div
                key={src}
                className="absolute inset-0 transition-opacity duration-1000"
                style={{ opacity: index === currentImage ? 1 : 0 }}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/20 to-black/70" />
          </div>
        </div>

        {/* ===================================================================
                                 Right - Form Section
          ===================================================================*/}
        <div className="lg:w-1/2 flex items-center justify-center p-4 lg:p-10 xl:p-24 w-full">
          <div ref={formRef} className="w-full max-w-md mx-auto lg:mx-0">
            {/* Card Container - Only for small screens */}
            <div className="md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 bg-[#171717] backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {mode === "login" ? "Welcome back" : "Create account"}
                </h2>
                <p className="text-gray-400">
                  {mode === "login"
                    ? "Sign in to continue to CORTEX"
                    : "Sign up to get started with CORTEX"}
                </p>
              </div>

              {/* Google Login Button - Moved to Top */}
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
                    className="w-full pointer-events-none inline-flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all duration-200 text-gray-700 dark:text-white font-medium text-sm"
                  >
                    <FcGoogle className="w-5 h-5" />
                    Continue with Google
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#121212] px-3 text-gray-500">
                    Or continue with email
                  </span>
                </div>
              </div>

              {/* ==================================================
                                 Form
               ===================================================*/}
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="flex flex-col gap-5"
                  noValidate
                >
                  {mode === "register" && (
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-gray-300 text-sm">
                            Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              ref={nameInputRef}
                              value={field.value ?? ""}
                              type="text"
                              autoComplete="name"
                              placeholder="John Doe"
                              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-none focus:ring-blue-500/20 h-11"
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
                        <FormLabel className="text-gray-300 text-sm">
                          Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            ref={mode === "login" ? emailInputRef : undefined}
                            value={field.value ?? ""}
                            type="email"
                            autoComplete="email"
                            placeholder="johndoe@example.com"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-none focus:ring-blue-500/20 h-11"
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
                        <FormLabel className="text-gray-300 text-sm">
                          Password
                        </FormLabel>
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
                            placeholder="••••••••"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-none focus:ring-blue-500/20 h-11"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full cursor-pointer bg-white hover:bg-white/80 text-gray-900 font-medium py-2.5 h-11 rounded-lg transition-all duration-200"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoaderCircle className="w-5 h-5 animate-spin" />
                    ) : mode === "login" ? (
                      "Sign In"
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
              </Form>

              <p className="text-center text-sm text-gray-500 mt-6">
                {mode === "login" ? (
                  <>
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                      className="text-blue-400 hover:text-blue-300 hover:underline transition cursor-pointer"
                    >
                      Sign up
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
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================
                                  Pricing Section
        ===================================================================*/}
      <Plans onPlanClick={scrollToForm} />
    </div>
  );
};

export default Login;
