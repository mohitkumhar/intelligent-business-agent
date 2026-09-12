import { Link, useLocation } from "@tanstack/react-router";
import { Button } from "@typebot.io/ui/components/Button";
import { Cancel01Icon } from "@typebot.io/ui/icons/Cancel01Icon";
import { Menu01Icon } from "@typebot.io/ui/icons/Menu01Icon";
import { cn } from "@typebot.io/ui/lib/cn";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";
import {
  dashboardUrl,
  githubRepoUrl,
  signinUrl,
} from "@/constants";
import { useIsAuthenticated } from "@/hooks/useIsAuthenticated";

const navLinks = [
  { label: "Problem", href: "#problem" },
  { label: "Solution", href: "#solution" },
  { label: "Flowcharts & Architecture", href: "#architecture" },
  { label: "Risk Simulator", href: "#simulator" },
  { label: "Health Hub", href: "#health-dashboard" },
  { label: "Tech Stack", href: "#tech-stack" },
];

type HeaderProps = {
  isOpened?: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export const Header = ({ isOpened = false, onOpen, onClose }: HeaderProps) => {
  const isAuthenticated = useIsAuthenticated();
  const { pathname } = useLocation();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      onClose();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <header className="flex justify-center px-4">
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center justify-between gap-6 px-6 py-3 rounded-2xl bg-slate-900/85 backdrop-blur-xl border border-slate-700/60 shadow-2xl max-w-6xl w-full text-sm">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-extrabold text-lg text-white group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-slate-950 font-black text-base shadow-md group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <span className="tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent font-display">
            ProfitPilot
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
            HACKATHON DEMO
          </span>
        </Link>

        {/* Links */}
        <div className="flex items-center gap-5 text-xs lg:text-sm font-medium text-slate-300">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="hover:text-orange-400 transition-colors cursor-pointer"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3">
          <a
            href={githubRepoUrl}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="View GitHub Repository"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>

          <a
            href="#simulator"
            onClick={(e) => handleNavClick(e, "#simulator")}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
          >
            🚀 Try Simulator
          </a>
        </div>
      </nav>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden w-full max-w-lg">
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 shadow-xl">
          <Link to="/" className="flex items-center gap-2 font-bold text-white text-sm">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-slate-950 text-xs font-black">
              ⚡
            </div>
            <span>ProfitPilot</span>
          </Link>
          <button
            onClick={() => (isOpened ? onClose() : onOpen())}
            className="p-2 text-slate-300 hover:text-white"
            aria-label="Toggle menu"
          >
            {isOpened ? <Cancel01Icon /> : <Menu01Icon />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {isOpened && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3 shadow-2xl text-sm"
            >
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="block py-2 text-slate-200 hover:text-orange-400 border-b border-slate-800 last:border-0"
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href="#simulator"
                  onClick={(e) => handleNavClick(e, "#simulator")}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-orange-500 text-slate-950 text-center"
                >
                  🚀 Test Simulator
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
