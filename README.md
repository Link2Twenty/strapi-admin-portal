# Strapi Admin Portal

> The Portal Gun for Strapi Admin. Seamlessly mount React components into specific DOM selectors across any admin route.

## Introduction

`strapi-admin-portal` allows you to inject React components into any part of the Strapi Admin interface using DOM selectors. While Strapi provides built-in injection zones, they don't cover every use case. This library gives you the power to place your custom components exactly where you need them—whether it's inside a specific form, next to a button, or in the sidebar—by targeting DOM elements directly.

It handles:
- **Route Monitoring**: Only specific components mount when the admin route matches.
- **Lazy Loading**: Components are loaded dynamically.
- **Context**: Injected components have access to the Strapi Redux store and configurations via wrapped providers.
- **Cleanup**: Automatically unmounts React roots to prevent memory leaks.

## Requirements

- Strapi v5+ (This package uses the new admin APIs)
- React 17/18

## Installation

```bash
npm install strapi-admin-portal
# or
yarn add strapi-admin-portal
```

## Usage

### 1. Initialize the Plugin

In your Strapi Admin's entry point (usually `src/admin/app.tsx` or `src/admin/app.js`), initialize the injection system during the `register` or `bootstrap` phase.

```tsx
import type { StrapiApp } from '@strapi/strapi/admin';
import { initialiseInjections } from 'strapi-admin-portal';

export default {
  config: {
    locales: [],
  },
  bootstrap(app: StrapiApp) {
    // Initialize the portal system and get the helper methods
    const { registerRoute } = initialiseInjections(app);

    // Register your custom injections here
    registerRoute({
      // 1. The admin route where the component should appear
      route: '/me', 
      
      // 2. The CSS selector for the element to mount AFTER
      // Warning: Selectors can be fragile if Strapi changes its internal DOM structure
      selector: 'main form button[type="submit"]', 
      
      // 3. Dynamic import of your component
      Component: () => import('./components/MyCustomButton'), 
    });
  },
};
```

### 2. Creating an Injected Component

Your component is a standard React component. It will automatically be wrapped with Strapi's core providers (Store, Intl, etc.), so you can use standard hooks like `useIntl` or select from the store.

```tsx
// src/admin/components/MyCustomButton.tsx
import React from 'react';
import { Button } from '@strapi/design-system';

const MyCustomButton = () => {
  return (
    <div style={{ marginTop: '1rem' }}>
      <Button variant="secondary" onClick={() => alert('Clicked!')}>
        Wait, I'm new here!
      </Button>
    </div>
  );
};

export default MyCustomButton;
```

## API Reference

### `initialiseInjections(app)`

Initializes the portal system on the Strapi app instance.

- **app**: The `StrapiApp` instance provided by `bootstrap` or `register`.
- **Returns**: An object containing `registerRoute`, `unregisterRoute`, and internal state accessors.

### `registerRoute(options)`

Registers a component to be injected.

#### Options:

| Property | Type | Description |
|----------|------|-------------|
| `route` | `string` | The exact path in the admin panel to target (e.g., `/content-manager/collection-types/...`). |
| `selector` | `string` | A valid CSS selector. The library waits for this element to appear in the DOM and mounts your component **after** it. |
| `Component` | `() => Promise<any>` | A function that returns a dynamic import of your component. |
| `id` | `string` (optional) | A unique identifier. If not provided, one is generated. Useful if you need to programmatically unregister the route later. |

### `unregisterRoute(id)`

Removes a registered injection route.

- **id**: The unique identifier of the route to remove.

## Visual Example

Imagine you want to add a "Terms of Service" reminder below the "Login" button on the Login page (`/admin/auth/login`).

1. **Find the Selector**: Inspect the DOM on the `/admin/auth/login` page. Find the "Login" button. Let's say it's reachable via `form button[type="submit"]`.
2. **Register**:
   ```ts
   registerRoute({
     route: '/admin/auth/login',
     selector: 'form button[type="submit"]',
     Component: () => import('./components/TermsReminder'),
   });
   ```
3. **Result**: When you navigate to `/admin/auth/logine`, the library watches for the selector. Once found, it creates a new React root next to it and renders your component.

## Caveats

- **DOM Fragility**: Because this library relies on CSS selectors to find insertion points, updates to Strapi's UI (class names, structure) might break your selectors. Always double-check your selectors when upgrading Strapi versions.
- **Performance**: The library uses `MutationObserver` to watch for DOM elements. While optimized, avoid watching broad selectors or having too many active watchers if possible.

## License

MIT
