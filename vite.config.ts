import "dotenv/config";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const { PORT } = process.env;
if (!PORT) throw new Error("PORT is required");
const port = parseInt(PORT);
if (isNaN(port)) throw new Error("PORT must be a number");

export default defineConfig({
  server: {
    port,
    strictPort: true,
  },
  plugins: [react()],
});
