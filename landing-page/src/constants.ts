export const breakpoints = {
  md: 768,
};

export const currentBaseUrl = "https://profitpilot.io";
export const signinUrl = "https://app.profitpilot.io/signin";
export const registerUrl = `https://app.profitpilot.io/register`;
export const dashboardUrl = `https://app.profitpilot.io/profitpilots`;
export const githubRepoUrl = "https://github.com/baptisteArno/profitpilot.io";
export const linkedInUrl = "https://www.linkedin.com/company/profitpilot";
export const discordUrl = "https://profitpilot.io/discord";
export const docsUrl = "https://docs.profitpilot.io";
export const howToGetHelpUrl = `${docsUrl}/guides/how-to-get-help`;
export const stripeClimateUrl = "https://climate.stripe.com/5VCRAq";
export const enterpriseLeadProfitPilotUrl =
  "https://profitpilot.io/enterprise-lead-form";

export const legacyRedirects = {
  "/profitpilot-lib": "https://unpkg.com/profitpilot-js@2.0.21/dist/index.umd.min.js",
  "/profitpilot-lib/v2": "https://unpkg.com/profitpilot-js@2.1.3/dist/index.umd.min.js",
} as const;
