import { buttonVariants } from "@typebot.io/ui/components/Button";
import { ArrowDown01Icon } from "@typebot.io/ui/icons/ArrowDown01Icon";
import { ArrowUp01Icon } from "@typebot.io/ui/icons/ArrowUp01Icon";
import { cn } from "@typebot.io/ui/lib/cn";
import { motion } from "motion/react";
import { type ReactNode, useState } from "react";
import { TextLink } from "@/components/link";
import { discordUrl, docsUrl } from "../../../constants";

const data = [
  {
    title: "Is there a free version to test the waters?",
    content: (
      <>
        Yes! You can connect your data sources and get your first 'Financial
        Health Check' completely for free. We only charge when you need advanced
        forecasting models or multiple business dashboards.
      </>
    ),
  },
  {
    title: "Does this work with my messy Excel sheets?",
    content: (
      <>
        Absolutely. Whether you use QuickBooks, Stripe, Xero, or just a chaotic
        Google Sheet, ProfitPilot can read it. Our 'Universal Sync' feature
        cleans and organizes your data automatically in minutes.
      </>
    ),
  },
  {
    title: "Can it really predict my future cash flow?",
    content: (
      <>
        Yes. By analyzing your past income and expense patterns, ProfitPilot
        projects your bank balance 30, 60, and 90 days out. It flags potential
        cash crunches{" "}
        <span className="italic font-bold">before</span> they happen, so you can
        sleep better.
      </>
    ),
  },
  {
    title: "Do I need to be an accountant to understand this?",
    content: (
      <>
        Not at all. We built this specifically for business owners, not CPAs.
        ProfitPilot speaks plain English. Instead of 'EBITDA adjustments', it
        says 'You spent more on ads than you made in sales this week.'
      </>
    ),
  },
  {
    title: "Is my financial data actually safe?",
    content: (
      <>
        Security is our #1 priority. We use bank-grade 256-bit encryption for
        all connections. We never sell your data, and our AI analyzes numbers
        anonymously without storing your personal banking credentials.
      </>
    ),
  },
];

export const Faq = () => {
  return (
    <div className="flex flex-col gap-8 max-w-4xl">
      <h2>FAQ</h2>
      <div className="flex flex-col gap-2">
        {data.map(({ title, content }) => (
          <Question key={title} title={title}>
            {content}
          </Question>
        ))}
      </div>
    </div>
  );
};

const Question = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <details
      className="p-4 rounded-xl bg-card text-card-foreground cursor-pointer"
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="font-display font-medium text-2xl flex justify-between list-none md:gap-12">
        {title}
        <span
          className={cn(
            buttonVariants({ variant: "secondary", size: "icon" }),
            "shrink-0 [&_svg]:size-6",
          )}
        >
          {isOpen ? <ArrowUp01Icon className="size-8" /> : <ArrowDown01Icon />}
        </span>
      </summary>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: isOpen ? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.15 }}
      >
        <hr className="my-4" />
        {children}
      </motion.div>
    </details>
  );
};
