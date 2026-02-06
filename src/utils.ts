import { portal } from "./portal";

// Types
import type {
  InjectPublicRouter,
  InjectRouteOptions,
  StrapiExtenedApp
} from "./types";
import type { RouterState } from "@remix-run/router";

/**
 * Inject extra components into the Me page
 * @param router the Strapi admin app
 */
export const InitialInjection = async (
  strapi: StrapiExtenedApp
): Promise<void> => {
  const router = strapi.router as unknown as InjectPublicRouter;

  // Wait for the router to be ready
  let attempts = 0;
  while (!router?.router?.state?.location && attempts < 100) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    attempts++;
  }

  if (!router?.router?.state?.location) {
    console.warn(
      "Strapi router not ready after 5s, skipping injection initialization."
    );
    return;
  }

  // Subscribe to router changes to re-attach the button when navigating to the login page
  router.router.subscribe((state) => attachRoutes(state, strapi));

  // Initial attach
  attachRoutes(router.router.state, strapi);
};

/**
 * Attach all registered injection routes for the current route
 * @param state the current router state
 * @param strapi the Strapi admin app instance, used to access the registered injection routes
 */
const attachRoutes = (state: RouterState, strapi: StrapiExtenedApp) => {
  const InjectionRoutes = strapi.domInjections?.routes || [];

  Promise.all(InjectionRoutes.map((options) => portal(state, strapi, options)));
};

/**
 * Wait for the login form to be available in the DOM
 * @returns {Promise<Element | null>} the injection site element
 */
export const getInjectionSite = (
  selector: string,
  timeout = 5000
): Promise<Element | null> => {
  return new Promise((resolve) => {
    // 1. Check if element exists immediately
    const element = document.querySelector(selector);
    if (element) {
      return resolve(element);
    }

    // 2. Setup observer to watch for DOM changes
    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 3. Fallback timeout
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};

/**
 * Register an injection route to inject components into specific routes and DOM nodes in the Strapi admin
 * @param options the injection options, including:
 * @param options.id an optional id for the injection route (used for cleanup), if not provided a random id will be generated
 * @param options.route the route to inject into (e.g. '/me')
 * @param options.selector the DOM selector to find the injection site (e.g. '#main-content form[method="put"] > :nth-child(2) > div > div > div:nth-child(2)')
 * @param options.Component the React component to inject
 */
export const registerInjectionRoute = (
  options: InjectRouteOptions,
  app: StrapiExtenedApp
) => {
  if (!app.domInjections?.routes) {
    console.warn(
      "Injection system not initialised. Please call initialiseInjections(app) before registering injection routes."
    );
    return;
  }

  const { id, ...props } = options;

  if (id && app.domInjections.routes.some((r) => r.id === id)) {
    console.warn(
      `Injection route with id ${id} already exists. Skipping registration.`
    );
    return;
  }

  // if there is no id, we generate a random dom safe id
  const generatedId =
    id || `injection-${Math.random().toString(36).substring(2, 9)}`;

  app.domInjections.routes.push({ id: generatedId, ...props });
};

/**
 * Unregister an injection route by its id, removing the injected component from the DOM on the next route change
 * @param id the id of the injection route to unregister
 * @param app the Strapi app instance
 */
export const unregisterInjectionRoute = (id: string, app: StrapiExtenedApp) => {
  if (!app.domInjections?.routes) {
    console.warn(
      "Injection system not initialised. Please call initialiseInjections(app) before unregistering injection routes."
    );
    return;
  }

  const index = app.domInjections.routes.findIndex((r) => r.id === id);

  if (index === -1) {
    console.warn(
      `Injection route with id ${id} does not exist. Skipping unregistration.`
    );
    return;
  }

  app.domInjections.routes.splice(index, 1);

  // Clean up root immediately if it exists
  app.domInjections.removeRoot(id);
};

/**
 * Simple route pattern matching to extract params (e.g. /content-type/:id)
 * @param pattern the route pattern to match against (e.g. '/content-type/:id')
 * @param path the actual path to test (e.g. '/content-type/123')
 * @returns an object of extracted params if the pattern matches the path, or null if it doesn't match
 */
export const matchRoute = (pattern: string, path: string) => {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].replace(/^:/, "")] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
};
