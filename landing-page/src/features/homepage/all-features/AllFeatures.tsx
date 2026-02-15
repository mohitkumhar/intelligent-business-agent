import { CodeIcon } from "@typebot.io/ui/icons/CodeIcon";
import { DatabaseIcon } from "@typebot.io/ui/icons/DatabaseIcon";
import { DocumentCodeIcon } from "@typebot.io/ui/icons/DocumentCodeIcon";
import { Link02Icon } from "@typebot.io/ui/icons/Link02Icon";
import { UsersIcon } from "@typebot.io/ui/icons/UsersIcon";
import { ZapIcon } from "@typebot.io/ui/icons/ZapIcon";
import { cn } from "@typebot.io/ui/lib/cn";
import { Card } from "@/components/Card";
import { CtaButtonLink } from "@/components/link";
import { registerUrl } from "@/constants";
import bgImage0 from "./assets/0.png";
import bgImage1 from "./assets/1.png";
import bgImage2 from "./assets/2.png";
import bgImage3 from "./assets/3.png";
import bgImage4 from "./assets/4.png";
import bgImage5 from "./assets/5.png";

const bgImageSrcs = [
  bgImage0,
  bgImage1,
  bgImage2,
  bgImage3,
  bgImage4,
  bgImage5,
];

const cards = [
  {
    Icon: CodeIcon,
    title: "Smart Segmentation",
    description:
      "Automatically filter your financial data by location, product line, or date. Pinpoint exactly where you are making (or losing) money without digging through rows of data.",
    rotateCoeff: -10,
  },
  {
    Icon: UsersIcon,
    title: "Collaborative Decisions",
    description:
      "Don't decide alone. Invite your accountant, business partner, or investors to view reports and chat with the AI advisor—all without sharing your bank passwords.",
    rotateCoeff: 12,
  },
  {
    Icon: Link02Icon,
    title: "Multi-Venture Tracking",
    description:
      "Serial entrepreneur? No problem. Seamlessly switch between different ventures and keep your finances organized in separate, secure dashboards.",
    rotateCoeff: -7,
  },
  {
    Icon: DocumentCodeIcon,
    title: "Custom Logic",
    description: "Every business is unique. Create custom formulas to track specific KPIs.",
    rotateCoeff: -2,
  },
  {
    Icon: ZapIcon,
    title: "Whitelabel Portal",
    description: "Share professional financial updates with your stakeholders under your own brand name and URL. Look established and trustworthy from Day 1.",
    rotateCoeff: 2,
  },
  {
    Icon: DatabaseIcon,
    title: "Universal Sync",
    description:
      "ProfitPilot plays nice with your existing tools. Connect seamlessly to Stripe, QuickBooks, Google Sheets, and CRMs. If it has numbers, we can analyze it.",
    rotateCoeff: -4,
  },
] as const;

const cardSize = {
  width: 458,
  height: 248,
};
const paddingTop = 128;
const headerHeight = 172;
const gapHeaderAndCard = 86;

export const AllFeatures = () => {
  return (
    <div
      className="flex flex-col gap-8 w-full max-w-7xl md:pt-(--padding-top) md:pb-[calc(100vh-var(--padding-top)-var(--header-height))]"
      style={
        {
          "--total-cards": cards.length,
          "--padding-top": `${paddingTop}px`,
          "--header-height": `${headerHeight}px`,
          "--card-width": `${cardSize.width}px`,
          "--card-height": `${cardSize.height}px`,
          "--gap-header-and-card": `${gapHeaderAndCard}px`,
        } as React.CSSProperties
      }
    >
      <div className="md:overflow-visible flex flex-col items-center md:h-all-features-sticky-container">
        <div className="md:sticky flex flex-col md:justify-between items-center max-w-xl shrink-0 top-(--padding-top) md:h-(--header-height) gap-6 md:gap-0">
          <h2 className="px-4 text-center">
            Everything You Need to Run a Smarter Business
          </h2>
          <CtaButtonLink
            size="lg"
            className="hidden md:inline-flex"
            href={registerUrl}
          >
            Start Analyzing for Free
          </CtaButtonLink>
        </div>

        <ul
          style={{
            viewTimelineName: "--cards-container",
          }}
          className="w-full md:w-auto px-4 md:px-0 overflow-x-auto snap-x scroll-px-4 snap-always no-scrollbar snap-mandatory md:overflow-x-visible flex md:flex-col pt-8 md:pt-[calc(100vh-var(--padding-top)-var(--header-height))] md:gap-[calc(100vh-var(--padding-top)-var(--header-height)-var(--gap-header-and-card)-var(--card-height))] gap-2"
        >
          <Dots />

          {cards.map((feature, index) => (
            <li
              className="min-w-[calc(100%-.75rem)] snap-start md:sticky top-[calc(var(--padding-top)+var(--header-height)+var(--gap-header-and-card))]"
              key={feature.title}
              style={
                {
                  "--rotate-angle": `${feature.rotateCoeff}deg`,
                } as React.CSSProperties
              }
            >
              <FeatureCard
                key={feature.title}
                index={index}
                feature={feature}
                className="md:animate-slight-random-rotate md:w-(--card-width) md:h-(--card-height)"
                style={{
                  animationTimeline: "--cards-container",
                  animationRange: `exit-crossing calc(${index / cards.length} * 100%) exit-crossing calc(${(index + 1) / cards.length} * 100%)`,
                }}
              />
            </li>
          ))}
        </ul>
      </div>
      <div className="md:hidden px-4">
        <CtaButtonLink size="lg" href={registerUrl}>
          Start Analyzing for Free
        </CtaButtonLink>
      </div>
    </div>
  );
};

const FeatureCard = ({
  index,
  feature,
  className,
  style,
}: {
  index: number;
  feature: (typeof cards)[number];
  className?: string;
  style?: React.CSSProperties;
}) => {
  return (
    <Card
      className={cn(
        "flex flex-col items-center gap-6 h-64 md:h-auto",
        className,
      )}
      style={style}
    >
      <div
        className={`size-16 flex items-center justify-center rounded-2xl bg-cover`}
        style={{
          backgroundImage: `url('${bgImageSrcs[index]}')`,
        }}
      >
        <feature.Icon className="size-6 text-background" />
      </div>
      <div className="flex flex-col gap-2 text-center max-w-xs">
        <h2 className="text-2xl">{feature.title}</h2>
        <p>{feature.description}</p>
      </div>
    </Card>
  );
};

const Dots = () => (
  <div
    className="fixed hidden md:flex flex-col gap-4 ml-12 opacity-0 left-0 pointer-events-none top-[calc(var(--padding-top)+var(--header-height)+var(--gap-header-and-card))]"
    style={{
      animation: "fade-in ease-out forwards, fade-out ease-out forwards",
      animationTimeline: "--cards-container",
      animationRange: `exit-crossing 0% exit-crossing 10%, exit-crossing 80% exit-crossing 90%`,
    }}
  >
    {cards.map((card, index) => (
      <div
        key={card.title}
        className="size-2 rounded-full bg-muted"
        style={{
          animation: "fill-carousel-dot ease-out forwards",
          animationTimeline: "--cards-container",
          animationRange: `exit-crossing calc(${index / (cards.length + 1)} * 100%) exit-crossing calc(${(index + 1) / (cards.length + 1)} * 100%)`,
        }}
      />
    ))}
  </div>
);
