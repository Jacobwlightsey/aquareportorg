import * as Sentry from "@sentry/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: "https://ab6f4695911c4d39e56951d7c51a6a3c@o4511431874641920.ingest.us.sentry.io/4511431896662016",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
  ],
  tracesSampleRate: 0.3,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  environment: import.meta.env.VITE_IS_PREVIEW === "true" ? "preview" : "production",
  enabled: import.meta.env.PROD,
});

const convex = new ConvexReactClient(
  import.meta.env.VITE_CONVEX_URL || "https://groovy-basilisk-939.convex.cloud"
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConvexAuthProvider>
    </HelmetProvider>
  </StrictMode>,
);
