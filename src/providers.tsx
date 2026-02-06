import { useSyncExternalStore, useState, useEffect, useMemo } from "react";

// Components
import { IntlProvider } from "react-intl";
import { DesignSystemProvider } from "@strapi/design-system";

// Helpers
import defaultsDeep from "lodash/defaultsDeep";

// Types
import type { ProvidersProps } from "./types";

/**
 * Providers component to wrap the injected components with necessary context providers (e.g. DesignSystemProvider, IntlProvider)
 */
const Providers = ({ children, store, configurations }: ProvidersProps) => {
  const state = useSyncExternalStore(store.subscribe, store.getState);

  const themeName = state.admin_app.theme.currentTheme || "light";
  const locale = state.admin_app.language.locale || "en";
  const translations: Record<
    string,
    Record<string, string>
  > = configurations.translations || {};

  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  // Listen to system theme changes
  useEffect(() => {
    const mediaQuery = matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const appMessages = useMemo(
    () => defaultsDeep(translations[locale], translations.en),
    [locale, translations]
  );

  const themeObject = useMemo(() => {
    return configurations.themes[
      themeName === "system" ? systemTheme : themeName
    ];
  }, [themeName, systemTheme, configurations.themes]);

  return (
    <DesignSystemProvider theme={themeObject} locale={locale}>
      <IntlProvider locale={locale} messages={appMessages}>
        {children}
      </IntlProvider>
    </DesignSystemProvider>
  );
};

export default Providers;
