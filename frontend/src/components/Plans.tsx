import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Sparkles, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface PlanFeature {
  text: string;
}

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "Free for everyone",
    description: "Get started with basic AI chat assistance.",
    features: [
      { text: "Chat on web, iOS, Android, and on your desktop" },
      { text: "Generate code and visualize data" },
      { text: "Write, edit, and create content" },
      { text: "Ability to search the web" },
      { text: "Memory across conversations" },
      { text: "Create files and execute code" },
    ],
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$17",
    period:
      "Per month with annual subscription ($200/yr). $20 if billed monthly.",
    description: "For everyday productivity with advanced capabilities.",
    features: [
      { text: "Everything in Free, plus:" },
      { text: "More usage" },
      { text: "Access to unlimited projects to organize chats and documents" },
      { text: "Access to Research" },
      { text: "Ability to use more models" },
      { text: "Priority support" },
    ],
    cta: "Subscribe to Pro",
    popular: true,
  },
  {
    id: "max",
    name: "Max",
    price: "$100",
    period: "Per month billed monthly",
    description: "Maximum power for the most demanding workloads.",
    features: [
      { text: "Everything in Pro, plus:" },
      { text: "5-20x more usage than Pro" },
      { text: "Higher output limits for all tasks" },
      { text: "Early access to advanced features" },
      { text: "Priority access at high traffic times" },
    ],
    cta: "Subscribe to Max",
  },
];

const Plans = () => {
  const navigate = useNavigate();
  const [comingSoonPlan, setComingSoonPlan] = useState<string | null>(null);

  return (
    <>
      {/* ---------------- Coming Soon Dialog ---------------- */}
      <Dialog
        open={!!comingSoonPlan}
        onOpenChange={(open) => !open && setComingSoonPlan(null)}
      >
        <DialogContent className="sm:max-w-md dark:bg-[#222222]">
          <DialogClose className="absolute right-4 top-4 p-2 rounded-full bg-[#333333] opacity-70 hover:opacity-100 transition cursor-pointer">
            <X className="w-4 h-4" />
          </DialogClose>
          <DialogHeader>
            <DialogTitle className="text-center">
              <Sparkles className="w-10 h-10 text-blue-500 mx-auto mb-3" />
              <span className="text-xl font-bold">{comingSoonPlan}</span>
              <p className="text-sm font-normal text-gray-500 dark:text-gray-300 mt-2">
                Coming Soon
              </p>
            </DialogTitle>
          </DialogHeader>
          <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
            We're working hard to bring this plan to you. Stay tuned!
          </p>
          <DialogClose asChild>
            <button className="mt-2 w-full py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition cursor-pointer">
              Got it
            </button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* --------------------- Plans --------------------- */}
      <div className="py-14 lg:py-20 px-4 md:px-12 lg:px-16 bg-white dark:bg-[#121212]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 dark:text-gray-200 mb-3">
              Choose your plan
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm lg:text-base max-w-2xl mx-auto">
              Find the perfect plan for your needs. Start free and upgrade as
              you grow.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 lg:p-8 flex flex-col ${
                  plan.popular
                    ? "border-blue-500/50 bg-linear-to-b from-blue-500/5 to-transparent shadow-xl shadow-blue-500/5"
                    : "border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/2"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-linear-to-r from-blue-500 to-blue-400 text-xs font-semibold text-white px-4 py-1 rounded-full whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-200 mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-gray-200">
                      {plan.price}
                    </span>
                    {plan.id !== "free" && (
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        /mo
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{plan.period}</p>
                </div>

                <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    if (plan.id === "free") {
                      navigate("/");
                    } else {
                      setComingSoonPlan(plan.name);
                    }
                  }}
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                    plan.popular
                      ? "bg-linear-to-r from-blue-500 to-blue-400 text-white hover:from-blue-600 hover:to-cyan-500 shadow-lg shadow-blue-500/25"
                      : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-300 dark:border-white/10"
                  }`}
                >
                  {plan.cta}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Plans;
