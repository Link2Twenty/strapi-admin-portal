import {
  InitialInjection,
  refreshTheme,
  registerInjectionRoute,
  unregisterInjectionRoute
} from "./utils";

// Types
import type { Root } from "react-dom/client";
import type {
  domInjectionsProps,
  InjectRouteOptions,
  StrapiExtenedApp
} from "./types";

/**
 * Initialise the injection system by adding the necessary properties and methods to the Strapi app instance
 * @param app the Strapi app instance
 * @returns the injection system object with methods to register and unregister injection routes
 */
export const initialiseInjections = (app: StrapiExtenedApp) => {
  const injections = app.domInjections;

  if (injections) return injections;

  InitialInjection(app);

  const domInjections: domInjectionsProps = {
    routes: [],
    roots: {},
    registerRoute: (options: InjectRouteOptions) =>
      registerInjectionRoute(options, app),
    unregisterRoute: (id: string) => unregisterInjectionRoute(id, app),
    getRoot: (id: string) => app.domInjections?.roots[id],
    setRoot: (id: string, root: Root) => {
      if (!app.domInjections) return;
      app.domInjections.roots[id] = root;
    },
    removeRoot: (id: string) => {
      if (!app.domInjections) return;
      const root = app.domInjections.roots[id];
      if (root) {
        // IMPORTANT: Unmount the root to clear memory, timers, and subscriptions
        setTimeout(() => {
          root.unmount();
          if (app.store) refreshTheme(app.store);
        }, 0);
        delete app.domInjections.roots[id];
      }
    }
  };

  app.domInjections = domInjections;

  return domInjections;
};
