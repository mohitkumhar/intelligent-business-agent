import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { resolve } from "path";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import contentCollections from "./content-collection-vite-plugin";

export default defineConfig({
  resolve: {
    alias: {
      $magicBackgrounds: resolve("./src/assets/magicBackgrounds"),
      "@typebot.io/billing": resolve("./src/lib/packages/billing/src"),
      "@typebot.io/conditions": resolve("./src/lib/packages/conditions/src"),
      "@typebot.io/config": resolve("./src/lib/packages/config/src"),
      "@typebot.io/emails": resolve("./src/lib/packages/emails"),
      "@typebot.io/env": resolve("./src/lib/packages/env/src"),
      "@typebot.io/lib": resolve("./src/lib/packages/lib/src"),
      "@typebot.io/prisma": resolve("./src/lib/packages/prisma/src"),
      "@typebot.io/react": resolve("./src/lib/packages/react/src"),
      "@typebot.io/schemas": resolve("./src/lib/packages/schemas/src"),
      "@typebot.io/settings": resolve("./src/lib/packages/settings/src"),
      "@typebot.io/telemetry": resolve("./src/lib/packages/telemetry/src"),
      "@typebot.io/templates": resolve("./src/lib/packages/templates/src"),
      "@typebot.io/ui": resolve("./src/lib/packages/ui/src"),
      "@typebot.io/user": resolve("./src/lib/packages/user/src"),
      "@typebot.io/workspaces": resolve("./src/lib/packages/workspaces/src"),
      // https://github.com/prisma/prisma/issues/12504
      ".prisma/client/index-browser":
        "../../node_modules/.prisma/client/index-browser.js",
    },
  },
  plugins: [
    tailwindcss(),
    viteTsConfigPaths({
      skip: (dir) => dir === "opensrc",
    }),
    contentCollections(),
    tanstackStart({
      target: "vercel",
    }),
  ],
});
