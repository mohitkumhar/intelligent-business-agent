import { createFileRoute } from "@tanstack/react-router";
import { HackathonPage } from "@/features/hackathon/HackathonPage";
import { createMetaTags } from "@/lib/createMetaTags";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: createMetaTags({
      title: "ProfitPilot | Autonomous AI Business Co-Pilot (Hackathon Showcase)",
      description:
        "ProfitPilot is an autonomous AI business partner that tests financial decisions, predicts cash runway, queries live SQL databases, and protects small business founders from fatal mistakes.",
      imagePath: "/images/default-og.png",
      path: "",
    }),
  }),
  component: HackathonPage,
});
