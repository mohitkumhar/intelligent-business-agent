import { createFileRoute } from "@tanstack/react-router";
import { ContentPageWrapper } from "@/components/ContentPageWrapper";
import { Button } from "@typebot.io/ui/components/Button";
import { createMetaTags } from "@/lib/createMetaTags";
<<<<<<< HEAD
import { useEffect, useState } from "react";
import { dashboardUrl } from "@/constants";
=======
import { useState } from "react";
>>>>>>> e50d4b9 (Added something)

export const Route = createFileRoute("/get-started")({
  head: () => ({
    meta: createMetaTags({
      title: "Get Started | ProfitPilot",
      description:
        "Get started with ProfitPilot by telling us about your business.",
      imagePath: "/images/default-og.png",
      path: "/get-started",
    }),
  }),
  component: GetStartedPage,
});

const inputClasses =
  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-white/40 transition-shadow";
const selectClasses =
  "w-full px-4 py-3 bg-[#111] border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white transition-shadow appearance-none cursor-pointer";

function GetStartedPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);
<<<<<<< HEAD
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    business_name: "",
    business_category: "",
    city: "",
    employees_range: "",
    monthly_revenue: "",
    business_age: "",
    challenges: [] as string[],
    finance_tracking_method: "",
    onboarding_notes: "",
  });

  // Load user data from login
  useEffect(() => {
    const savedUser = localStorage.getItem('profit_pilot_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setFormData(prev => ({
          ...prev,
          full_name: user.full_name || prev.full_name,
          email: user.email || prev.email,
          phone: user.phone || prev.phone
        }));
      } catch (e) {
        console.error("Failed to parse saved user data", e);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChallengeChange = (challenge: string) => {
    setFormData(prev => {
      const current = [...prev.challenges];
      if (current.includes(challenge)) {
        return { ...prev, challenges: current.filter(c => c !== challenge) };
      } else {
        return { ...prev, challenges: [...current, challenge] };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          biggest_challenge: formData.challenges.join(", "),
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setIsSubmitted(true);
        setTimeout(() => {
          window.location.href = dashboardUrl;
        }, 2000);
      } else {
        setError(result.error || "Failed to submit form");
      }
    } catch (err) {
      setError("Connection error. Please ensure the backend is running.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
=======

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
>>>>>>> e50d4b9 (Added something)
  };

  if (isSubmitted) {
    return (
      <main className="dark w-full min-h-screen bg-[#0a0a0a] text-white flex flex-col pt-32 pb-24 px-4 m-0 overflow-x-hidden">
        <div className="max-w-2xl w-full mx-auto flex flex-col items-center gap-6 py-32 text-center animate-in fade-in duration-500">
            <h1 className="text-4xl md:text-5xl font-bold">
              Form Submitted Successfully!
            </h1>
            <p className="text-lg text-white/70">
<<<<<<< HEAD
              Welcome to ProfitPilot! We've received your business details and are setting up your workspace.
            </p>
            <Button
              onClick={() => window.location.href = dashboardUrl}
=======
              Thank you for sharing your business details. Our ai partner has started processing your details and will get back to you soon.
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
>>>>>>> e50d4b9 (Added something)
              variant="outline"
              style={{ color: "black", backgroundColor: "white", borderColor: "white" }}
              className="mt-6 rounded-full font-medium"
            >
<<<<<<< HEAD
              Go to Dashboard
=======
              Submit another query
>>>>>>> e50d4b9 (Added something)
            </Button>
          </div>
      </main>
    );
  }

  return (
    <main className="dark w-full min-h-screen bg-[#0a0a0a] text-white flex flex-col pt-24 md:pt-32 pb-32 px-4 m-0 overflow-x-hidden">
        <div className="max-w-3xl w-full mx-auto pb-24 mt-8 md:mt-16 animate-in slide-in-from-bottom-8 fade-in duration-700">
          <div className="mb-12 text-center flex flex-col gap-4 mx-auto w-full max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
<<<<<<< HEAD
              Business Profile
            </h1>
            <p className="text-lg text-white/60 mx-auto">
              Tell us about your company so we can tailor your dynamic AI dashboard.
=======
              Let's get started
            </h1>
            <p className="text-lg text-white/60 mx-auto">
              Tell us a little bit about yourself and your business so we can
              tailor your ProfitPilot experience.
>>>>>>> e50d4b9 (Added something)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8 md:gap-12">
<<<<<<< HEAD
            {/* Section 2 (Now 1) */}
            <div className="p-6 md:p-10 md:rounded-3xl rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl flex flex-col gap-6">
              <h2 className="text-2xl font-medium text-white/90 border-b border-white/5 pb-4">
                Step 1 — Your Details
=======
            {/* Section 1 */}
            <div className="p-6 md:p-10 md:rounded-3xl rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl flex flex-col gap-6">
              <h2 className="text-2xl font-medium text-white/90 border-b border-white/5 pb-4">
                Section 1 — About You
>>>>>>> e50d4b9 (Added something)
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
<<<<<<< HEAD
                    Your Full Name <span className="text-red-400">*</span>
=======
                    Full Name <span className="text-red-400">*</span>
>>>>>>> e50d4b9 (Added something)
                  </label>
                  <input
                    required
                    type="text"
<<<<<<< HEAD
                    name="full_name"
                    className={inputClasses}
                    placeholder="Jane Doe"
                    value={formData.full_name}
                    onChange={handleChange}
=======
                    className={inputClasses}
                    placeholder="John Doe"
>>>>>>> e50d4b9 (Added something)
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
<<<<<<< HEAD
                    Work Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    name="email"
                    className={inputClasses}
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <h2 className="text-2xl font-medium text-white/90 border-b border-white/5 pb-4 mt-4">
                Step 2 — Business Details
=======
                    WhatsApp / Phone <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="tel"
                    className={inputClasses}
                    placeholder="+91 99999 99999"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-white/80">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="email"
                  className={inputClasses}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Section 2 */}
            <div className="p-6 md:p-10 md:rounded-3xl rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl flex flex-col gap-6">
              <h2 className="text-2xl font-medium text-white/90 border-b border-white/5 pb-4">
                Section 2 — About the Business
>>>>>>> e50d4b9 (Added something)
              </h2>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-white/80">
                  Company / Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
<<<<<<< HEAD
                  name="business_name"
                  className={inputClasses}
                  placeholder="Your Business Name"
                  value={formData.business_name}
                  onChange={handleChange}
=======
                  className={inputClasses}
                  placeholder="Your Business Name"
>>>>>>> e50d4b9 (Added something)
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
                    Business Category
                  </label>
<<<<<<< HEAD
                  <select 
                    name="business_category"
                    className={selectClasses} 
                    value={formData.business_category}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select a category</option>
=======
                  <select className={selectClasses} defaultValue="">
                    <option value="" disabled>
                      Select a category
                    </option>
>>>>>>> e50d4b9 (Added something)
                    <option>Retail/Shop</option>
                    <option>Restaurant/Food</option>
                    <option>Manufacturing</option>
                    <option>Wholesale/Distribution</option>
                    <option>Services</option>
                    <option>E-commerce/Online</option>
                    <option>Education/Coaching</option>
                    <option>Real Estate</option>
                    <option>Logistics/Transport</option>
                    <option>Freelance/Consulting</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
                    City / Location <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
<<<<<<< HEAD
                    name="city"
                    className={inputClasses}
                    placeholder="City, Country"
                    value={formData.city}
                    onChange={handleChange}
=======
                    className={inputClasses}
                    placeholder="City, Country"
>>>>>>> e50d4b9 (Added something)
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
                    Number of Employees
                  </label>
<<<<<<< HEAD
                  <select
                    name="employees_range"
                    className={selectClasses}
                    value={formData.employees_range}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select employees</option>
                    <option>Just me</option>
                    <option>2–5</option>
                    <option>6–15</option>
                    <option>16–50</option>
                    <option>51–100</option>
                    <option>100+</option>
                  </select>
=======
                  <input
                    type="number"
                    min="1"
                    className={inputClasses}
                    placeholder="e.g. 5"
                  />
>>>>>>> e50d4b9 (Added something)
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
                    Monthly Revenue
                  </label>
<<<<<<< HEAD
                  <select 
                    name="monthly_revenue"
                    className={selectClasses}
                    value={formData.monthly_revenue}
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select monthly revenue</option>
=======
                  <select className={selectClasses} defaultValue="">
                    <option value="" disabled>
                      Select monthly revenue
                    </option>
>>>>>>> e50d4b9 (Added something)
                    <option>Under ₹50K</option>
                    <option>₹50K–₹2L</option>
                    <option>₹2L–₹10L</option>
                    <option>₹10L–₹50L</option>
                    <option>Above ₹50L</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-white/80">
                  Business Age
                </label>
<<<<<<< HEAD
                <select 
                  name="business_age"
                  className={selectClasses}
                  value={formData.business_age}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select business age</option>
=======
                <select className={selectClasses} defaultValue="">
                  <option value="" disabled>
                    Select business age
                  </option>
>>>>>>> e50d4b9 (Added something)
                  <option>0–6 months</option>
                  <option>Less than 1 year</option>
                  <option>1–3 years</option>
                  <option>3–7 years</option>
                  <option>7+ years</option>
                </select>
              </div>
            </div>

<<<<<<< HEAD
            {/* Section 3 (Now 2) */}
            <div className="p-6 md:p-10 md:rounded-3xl rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl flex flex-col gap-8">
              <h2 className="text-2xl font-medium text-white/90 border-b border-white/5 pb-4">
                Step 2 — Your Current Situation
=======
            {/* Section 3 */}
            <div className="p-6 md:p-10 md:rounded-3xl rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl flex flex-col gap-8">
              <h2 className="text-2xl font-medium text-white/90 border-b border-white/5 pb-4">
                Section 3 — Your Situation
>>>>>>> e50d4b9 (Added something)
              </h2>

              <div className="flex flex-col gap-5">
                <label className="text-sm font-medium text-white/80">
                  Biggest Challenge <span className="text-red-400">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Cash Flow",
                    "Low Sales",
                    "High Expenses",
                    "Marketing",
                    "Hiring/Staff",
                    "Pricing",
                    "Growth Planning",
                  ].map((challenge) => (
                    <label
                      key={challenge}
<<<<<<< HEAD
                      className={`cursor-pointer border rounded-full px-5 py-2.5 text-sm transition-all relative ${
                        formData.challenges.includes(challenge)
                          ? "bg-white border-white text-black font-medium"
                          : "border-white/20 bg-white/5 hover:bg-white/10 text-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.challenges.includes(challenge)}
                        onChange={() => handleChallengeChange(challenge)}
=======
                      className="cursor-pointer border border-white/20 bg-white/5 hover:bg-white/10 rounded-full px-5 py-2.5 text-sm transition-all has-[:checked]:bg-white has-[:checked]:border-white has-[:checked]:text-black has-[:checked]:font-medium relative"
                    >
                      <input
                        type="checkbox"
                        name="challenge"
                        value={challenge}
>>>>>>> e50d4b9 (Added something)
                        className="absolute opacity-0 w-0 h-0"
                      />
                      {challenge}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <label className="text-sm font-medium text-white/80">
                  Finance Tracking Method
                </label>
                <div className="flex flex-wrap gap-3">
                  {[
                    "Excel/Sheets",
                    "App like Tally/Zoho",
                    "Notebook/Manual",
                    "Don't track",
                  ].map((method) => (
                    <label
                      key={method}
<<<<<<< HEAD
                      className={`cursor-pointer border rounded-full px-5 py-2.5 text-sm transition-all relative ${
                        formData.finance_tracking_method === method
                          ? "bg-white border-white text-black font-medium"
                          : "border-white/20 bg-white/5 hover:bg-white/10 text-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="finance_tracking_method"
                        value={method}
                        checked={formData.finance_tracking_method === method}
                        onChange={handleChange}
=======
                      className="cursor-pointer border border-white/20 bg-white/5 hover:bg-white/10 rounded-full px-5 py-2.5 text-sm transition-all has-[:checked]:bg-white has-[:checked]:border-white has-[:checked]:text-black has-[:checked]:font-medium relative"
                    >
                      <input
                        type="radio"
                        name="tracking"
                        value={method}
>>>>>>> e50d4b9 (Added something)
                        className="absolute opacity-0 w-0 h-0"
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-white/80">
                  Anything else AI should know (optional)
                </label>
                <textarea
<<<<<<< HEAD
                  name="onboarding_notes"
                  className={`${inputClasses} min-h-[120px] resize-y leading-relaxed`}
                  placeholder="Tell us more about your specific needs or pain points..."
                  value={formData.onboarding_notes}
                  onChange={handleChange}
=======
                  className={`${inputClasses} min-h-[120px] resize-y leading-relaxed`}
                  placeholder="Tell us more about your specific needs or pain points..."
>>>>>>> e50d4b9 (Added something)
                />
              </div>
            </div>

<<<<<<< HEAD
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button
                disabled={isSubmitting}
                type="submit"
                size="lg"
                className="group relative overflow-hidden w-full md:w-auto px-12 py-8 text-xl font-bold rounded-full transition-all disabled:opacity-50 disabled:active:scale-100 shadow-[inset_0_3px_2px_0_rgba(255,255,255,0.25),0_10px_40px_rgba(255,90,37,0.2)] bg-linear-to-b border border-[#C4461D] from-[#FF8963] to-[#FF5A25] to-57% text-white active:from-[#E44A19] active:to-[#EF744C] active:from-43% active:to-100% active:shadow-[inset_0_-2px_2px_0_rgba(255,255,255,0.17)] flex items-center justify-center gap-3"
              >
                {/* Shine effect */}
                <div className="bg-transparent group-hover:bg-white/40 w-1/4 absolute -left-[40%] group-hover:left-[120%] transition-[left] duration-0 group-hover:duration-700 blur-md -rotate-45 aspect-1/2 pointer-events-none" />
                
                {isSubmitting ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </div>
                ) : (
                  "Launch My Dashboard"
                )}
=======
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                size="lg"
                style={{ color: "black", backgroundColor: "white", borderColor: "white" }}
                className="w-full md:w-auto px-12 py-6 text-xl font-semibold rounded-full min-h-[64px] transition-all shadow-xl hover:-translate-y-1 hover:shadow-white/20"
              >
                Submit Business Details
>>>>>>> e50d4b9 (Added something)
              </Button>
            </div>
          </form>
        </div>
    </main>
  );
}
