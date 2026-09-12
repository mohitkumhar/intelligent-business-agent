import React, { useRef, useState } from "react";
import { HeroSection } from "./HeroSection";
import { ProblemSection } from "./ProblemSection";
import { SolutionPillars } from "./SolutionPillars";
import { ArchitectureExplorer } from "./ArchitectureExplorer";
import { InteractiveDecisionSimulator } from "./InteractiveDecisionSimulator";
import { BusinessHealthPreview } from "./BusinessHealthPreview";
import { TechStackMatrix } from "./TechStackMatrix";
import { RoadmapSummary } from "./RoadmapSummary";

export function HackathonPage() {
  const [activePresetQuery, setActivePresetQuery] = useState<string | undefined>();
  const simulatorRef = useRef<HTMLDivElement>(null);
  const architectureRef = useRef<HTMLDivElement>(null);

  const handleTryDemo = (query?: string) => {
    if (query) {
      setActivePresetQuery(query);
    }
    const simulatorElem = document.getElementById("simulator");
    if (simulatorElem) {
      simulatorElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleExploreArchitecture = () => {
    const archElem = document.getElementById("architecture");
    if (archElem) {
      archElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="w-full bg-[#090D16] text-white min-h-screen selection:bg-orange-500/30 selection:text-orange-200">
      {/* 1. Hero Section with Value Prop & Sandbox */}
      <HeroSection
        onTryDemo={handleTryDemo}
        onExploreArchitecture={handleExploreArchitecture}
      />

      {/* 2. Problem Statement for Judges */}
      <ProblemSection />

      {/* 3. The 4 Solution Pillars */}
      <SolutionPillars />

      {/* 4. Interactive Architecture & Flowchart Explorer (SVG root diagrams) */}
      <div ref={architectureRef}>
        <ArchitectureExplorer />
      </div>

      {/* 5. Live Pre-Decision Risk Simulator */}
      <div ref={simulatorRef}>
        <InteractiveDecisionSimulator presetQuery={activePresetQuery} />
      </div>

      {/* 6. Real-Time Business Health Scorecard & Live Chart Preview */}
      <BusinessHealthPreview />

      {/* 7. Tech Stack, Architecture Specs & Competitive Advantage */}
      <TechStackMatrix />

      {/* 8. Roadmap & Hackathon Conclusion */}
      <RoadmapSummary onTryDemo={() => handleTryDemo()} />
    </div>
  );
}
