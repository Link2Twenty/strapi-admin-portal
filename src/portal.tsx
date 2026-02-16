import { createRoot } from "react-dom/client";

// Components
import Providers from "./providers";

// Helpers
import { getInjectionSite, matchRoute } from "./utils";

// Types
import type { InjectionRoute, StrapiExtenedApp } from "./types";
import type { RouterState } from "@remix-run/router";

/**
 * Attach the SSO button to the login page
 * @param {RouterState} state the router state
 */
export const portal = async (
  state: RouterState,
  strapi: StrapiExtenedApp,
  options: InjectionRoute
): Promise<void> => {
  const domInjections = strapi.domInjections;

  if (!domInjections) {
    console.warn(
      "Injection system not initialised. Please call initialiseInjections(app) before registering injection routes."
    );
    return;
  }

  // 1. Cleanup: If the container isn't in the DOM (e.g. navigated away), cleanup the React root
  const existingContainer = document.querySelector(`#${options.id}`);
  if (!existingContainer) {
    domInjections.removeRoot(options.id);
  }

  // 2. Early exit if not on the target route
  const params = matchRoute(options.route, state.location.pathname);
  if (!params) return;

  // Pre-fetch the component while waiting for the DOM
  const componentPromise = options.Component();

  // 3. Wait for the target element (with timeout/safety)
  const injectionSite = await getInjectionSite(options.selector);

  // Timed out or element not found
  if (!injectionSite) return;

  // 4. Double-check route after await (User might have navigated away during the wait)
  if (!matchRoute(options.route, window.location.pathname)) return;

  // 5. Create the container if it does not exist
  if (!domInjections.getRoot(options.id)) {
    // Re-check if container exists in DOM
    let container = document.getElementById(options.id);
    if (!container) {
      container = document.createElement("div");
      container.id = options.id;
      injectionSite.after(container);
    }

    domInjections.setRoot(options.id, createRoot(container));
  }

  const Component = await componentPromise;
  const ComponentToRender = Component.default;

  // Render the component
  const root = domInjections.getRoot(options.id);

  if (!root) return;

  root.render(
    <Providers
      store={strapi.store!}
      configurations={strapi.configurations}
      target={document.getElementById(options.id) || undefined}
    >
      <ComponentToRender {...params} />
    </Providers>
  );
};
