import React, { useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";

import { registerUser, clearError } from "@/features/auth/authSlice";
import { useAppSelector } from "@/hooks/useAppStore";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { registerSchema, type RegisterFormData } from "@/validator/auth";

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, error, loading } = useAppSelector((state) => state.auth);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (user) {
      toast.success("Registration successful");
      form.reset();
      navigate("/loading");
    } else if (error) {
      toast.error(error || "Registration failed");
      dispatch(clearError());
    }
  }, [user, error, form, navigate, dispatch]);

  const handleRegister = useCallback(
    (values: RegisterFormData) => {
      dispatch(registerUser(values) as any);
    },
    [dispatch]
  );

  const handleNavigateLogin = useCallback(() => {
    navigate("/login");
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#181818]">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle>Create a new account</CardTitle>
          <CardDescription>
            Enter your details below to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleRegister)}
              className="flex flex-col gap-6"
              noValidate
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="John Doe"
                        ref={nameInputRef}
                        autoComplete="name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="johndoe@example.com"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="flex flex-col gap-2">
                <Button
                  type="submit"
                  className="w-full cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                  ) : (
                    "Register"
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-blue-500 hover:underline active:scale-95 transition cursor-pointer"
                    onClick={handleNavigateLogin}
                  >
                    Login
                  </button>
                </p>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
