import { createFileRoute } from "@tanstack/react-router";
import { ContentPageWrapper } from "@/components/ContentPageWrapper";
import { Button } from "@typebot.io/ui/components/Button";
import { createMetaTags } from "@/lib/createMetaTags";
import { useState } from "react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <main className="dark w-full min-h-screen bg-[#0a0a0a] text-white flex flex-col pt-32 pb-24 px-4 m-0 overflow-x-hidden">
        <div className="max-w-2xl w-full mx-auto flex flex-col items-center gap-6 py-32 text-center animate-in fade-in duration-500">
            <h1 className="text-4xl md:text-5xl font-bold">
              Form Submitted Successfully!
            </h1>
            <p className="text-lg text-white/70">
              Thank you for sharing your business details. Our ai partner has started processing your details and will get back to you soon.
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              style={{ color: "black", backgroundColor: "white", borderColor: "white" }}
              className="mt-6 rounded-full font-medium"
            >
              Submit another query
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
              Let's get started
            </h1>
            <p className="text-lg text-white/60 mx-auto">
              Tell us a little bit about yourself and your business so we can
              tailor your ProfitPilot experience.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-8 md:gap-12">
            {/* Section 1 */}
            <div className="p-6 md:p-10 md:rounded-3xl rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl flex flex-col gap-6">
              <h2 className="text-2xl font-medium text-white/90 border-b border-white/5 pb-4">
                Section 1 — About You
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    className={inputClasses}
                    placeholder="John Doe"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
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
              </h2>
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium text-white/80">
                  Company / Business Name <span className="text-red-400">*</span>
                </label>
                <input
                  required
                  type="text"
                  className={inputClasses}
                  placeholder="Your Business Name"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
                    Business Category
                  </label>
                  <select className={selectClasses} defaultValue="">
                    <option value="" disabled>
                      Select a category
                    </option>
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
                    className={inputClasses}
                    placeholder="City, Country"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
                    Number of Employees
                  </label>
                  <input
                    type="number"
                    min="1"
                    className={inputClasses}
                    placeholder="e.g. 5"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-sm font-medium text-white/80">
                    Monthly Revenue
                  </label>
                  <select className={selectClasses} defaultValue="">
                    <option value="" disabled>
                      Select monthly revenue
                    </option>
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
                <select className={selectClasses} defaultValue="">
                  <option value="" disabled>
                    Select business age
                  </option>
                  <option>0–6 months</option>
                  <option>Less than 1 year</option>
                  <option>1–3 years</option>
                  <option>3–7 years</option>
                  <option>7+ years</option>
                </select>
              </div>
            </div>

            {/* Section 3 */}
            <div className="p-6 md:p-10 md:rounded-3xl rounded-2xl border border-white/10 bg-white/[0.02] shadow-xl flex flex-col gap-8">
              <h2 className="text-2xl font-medium text-white/90 border-b border-white/5 pb-4">
                Section 3 — Your Situation
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
                      className="cursor-pointer border border-white/20 bg-white/5 hover:bg-white/10 rounded-full px-5 py-2.5 text-sm transition-all has-[:checked]:bg-white has-[:checked]:border-white has-[:checked]:text-black has-[:checked]:font-medium relative"
                    >
                      <input
                        type="checkbox"
                        name="challenge"
                        value={challenge}
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
                      className="cursor-pointer border border-white/20 bg-white/5 hover:bg-white/10 rounded-full px-5 py-2.5 text-sm transition-all has-[:checked]:bg-white has-[:checked]:border-white has-[:checked]:text-black has-[:checked]:font-medium relative"
                    >
                      <input
                        type="radio"
                        name="tracking"
                        value={method}
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
                  className={`${inputClasses} min-h-[120px] resize-y leading-relaxed`}
                  placeholder="Tell us more about your specific needs or pain points..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                size="lg"
                style={{ color: "black", backgroundColor: "white", borderColor: "white" }}
                className="w-full md:w-auto px-12 py-6 text-xl font-semibold rounded-full min-h-[64px] transition-all shadow-xl hover:-translate-y-1 hover:shadow-white/20"
              >
                Submit Business Details
              </Button>
            </div>
          </form>
        </div>
    </main>
  );
}
