import type { Root } from "react-dom/client";
import type { Router } from "@remix-run/router";
import type { StrapiApp } from "@strapi/strapi/admin";

export interface InjectPublicRouter extends Omit<
  StrapiApp["router"],
  "router"
> {
  router: Router;
}

export type StrapiExtenedApp = StrapiApp & {
  domInjections?: domInjectionsProps;
};

export type ProvidersProps = {
  children: React.ReactNode;
  store: NonNullable<StrapiExtenedApp["store"]>;
  configurations: StrapiExtenedApp["configurations"];
  target?: HTMLElement;
};

export type InjectionRoute = InjectRouteOptions & { id: string };

export type InjectRouteOptions = {
  id?: string;
  route: string;
  selector: string;
  Component: () => Promise<{ default: React.ComponentType<unknown> }>;
};

export interface domInjectionsProps {
  routes: InjectionRoute[];
  roots: Record<string, Root>;
  registerRoute: (options: InjectRouteOptions) => void;
  unregisterRoute: (id: string) => void;
  getRoot: (id: string) => Root | undefined;
  setRoot: (id: string, root: Root) => void;
  removeRoot: (id: string) => void;
}
