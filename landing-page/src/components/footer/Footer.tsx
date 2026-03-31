import { TextLink } from "@/components/link";
import { TypebotLogoFull } from "@/components/TypebotLogo";
import {
  discordUrl,
  docsUrl,
  githubRepoUrl,
  linkedInUrl,
} from "../../constants";
import gradientSeparatorSrc from "./assets/gradient-separator.png";

const data = [
  {
    title: "Product",
    links: [
      {
        label: "Documentation",
        href: docsUrl,
      },
    ],
  },
  {
    title: "Community",
    links: [
      {
        label: "Discord",
        href: discordUrl,
      },
      {
        label: "GitHub",
        href: githubRepoUrl,
      },
      {
        label: "LinkedIn",
        href: linkedInUrl,
      },
    ],
  },
  {
    title: "Company",
    links: [
      {
        label: "About",
        to: "/",
      },
      {
        label: "Terms of Service",
        to: "/",
      },
      {
        label: "Privacy Policy",
        to: "/",
      },
      {
        label: "Business Continuity",
        to: "/",
      },
    ],
  },
] as const;

export const Footer = () => {
  return (
    <footer className="dark flex flex-col pb-12">
      <img src={gradientSeparatorSrc} alt="separator" className="w-full h-2" />
      <div className="flex flex-col max-w-7xl mx-auto px-6 md:px-4 w-full">
        <div className="flex flex-col md:flex-row gap-12 py-12 items-start">
          <TypebotLogoFull className="mt-1" />
          <div className="flex flex-col md:flex-row gap-8 md:justify-around w-full">
            {data.map((item) => (
              <div className="flex flex-col gap-3" key={item.title}>
                <h3 className="text-2xl">{item.title}</h3>
                <ul className="flex flex-col gap-1">
                  {item.links.map((link) => (
                    <li key={link.label}>
                      <TextLink
                        href={"href" in link ? link.href : undefined}
                        to={"to" in link ? link.to : undefined}
                        params={"params" in link ? (link as any).params : undefined}
                        target={"href" in link ? "_blank" : undefined}
                        className="text-muted-foreground font-normal"
                        size="sm"
                      >
                        {link.label}
                      </TextLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <p className="text-foreground/70 text-sm">
          All rights reserved 2025 - ProfitPilot
        </p>
      </div>
    </footer>
  );
};
