import { createFileRoute } from "@tanstack/react-router";
import { ContentPageWrapper } from "@/components/ContentPageWrapper";
import { BuildingsGradientIcon } from "@/features/about/BuildingsGradientIcon";
import { HeartGradientIcon } from "@/features/about/HeartGradientIcon";
import { MessageSquareGradientIcon } from "@/features/about/MessageSquareGradientIcon";
import { ZapGradientIcon } from "@/features/about/ZapGradientIcon";
import { createMetaTags } from "@/lib/createMetaTags";

export const Route = createFileRoute("/_layout/about")({
  head: () => ({
    meta: createMetaTags({
      title: "About | ProfitPilot",
      description:
        "ProfitPilot empowers small business owners with AI-driven insights to make smarter decisions and grow confidently.",
      imagePath: "/images/default-og.png",
      path: "/about",
    }),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <ContentPageWrapper>
      <div className="max-w-3xl mx-auto gap-16 flex flex-col">
        <h1>Smart decisions build strong businesses</h1>
        <div className="flex flex-col gap-10 font-display text-3xl md:text-justify">
          <p>
            At ProfitPilot, we believe that{" "}
            <span className="group font-medium bg-clip-text text-transparent bg-linear-to-r from-[#c13eaa] to-[#ff491f] to-30%">
              <MessageSquareGradientIcon className="size-6 inline-flex group-hover:motion-preset-seesaw-lg" />{" "}
              data-driven conversations
            </span>{" "}
            build strong businesses.
          </p>
          <p>
            Every day, small business owners make critical decisions about
            pricing, hiring, marketing, and expenses. We think they deserve an{" "}
            <span className="group font-medium bg-clip-text text-transparent bg-linear-to-r from-[#c13eaa] to-[#ff491f] to-20%">
              <HeartGradientIcon className="size-6 inline-flex group-hover:motion-preset-pulse-lg" />{" "}
              AI partner who understands their numbers
            </span>
            {" "}and warns them before things go wrong.
          </p>
          <p>
            Most business tools today are limited to dashboards and reports, but we
            know AI can be so much more. We see AI agents as tools for{" "}
            <span className="group font-medium bg-clip-text text-transparent bg-linear-to-r from-[#c13eaa] to-[#ff491f] to-50%">
              <ZapGradientIcon className="size-6 inline-flex group-hover:motion-preset-oscillate-lg" />{" "}
              proactive business intelligence
            </span>{" "}
            that go beyond static charts. Our mission is to transform cold,
            spreadsheet-driven analysis into dynamic AI conversations that reflect
            the true state of your business.
          </p>
          <p>
            ProfitPilot{" "}
            <span className="group font-medium bg-clip-text text-transparent bg-linear-to-r from-[#c13eaa] to-[#ff491f] to-70%">
              <BuildingsGradientIcon className="size-6 inline-flex group-hover:motion-preset-bounce" />{" "}
              empowers business owners
            </span>{" "}
            to make confident, data-backed decisions that protect their growth
            and bottom line.
          </p>
          <p>
            We are a team of engineers passionate about AI, business intelligence,
            and making technology accessible to everyone.
          </p>
          <p className="font-bold">
            That's why we created ProfitPilot — to unlock the full potential of
            AI agents and make business decisions intuitive, safe, and impactful.
          </p>
          <p>Let's grow! 🚀</p>
        </div>
      </div>
    </ContentPageWrapper>
  );
}

