// morpheus/core/graphManager/moduleManager.js

import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import * as Lucide from 'lucide-react';

export default class ModuleManager {

  constructor({ kernel, nodeResources, apis, nodeContext, nodeLoader }) {
    this.kernel         = kernel;
    this.nodeResources  = nodeResources;
    this.moduleRegistry = nodeResources.modules;
    this.apis           = apis;
    this.nodeContext    = nodeContext;
    this.nodeLoader     = nodeLoader;
  }

  /* Module Component Factory
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  createModule() {

    const moduleManager  = this;
    const kernel         = this.kernel;
    const moduleRegistry = this.moduleRegistry;
    const nodeContext    = this.nodeContext;
    const Apis           = this.apis;
    const Node           = this.nodeLoader;

    return function Module({ id, proxyId, children = null, ...props }) {

      const moduleId           = proxyId ?? id;
      const context            = useContext(nodeContext);
      const moduleRegistryItem = moduleRegistry?.[moduleId];
      const hasMountedRef      = useRef(false);

      if (!moduleRegistryItem) {
        const errorMessage = `Module "${moduleId}" of node "${kernel.nodeId}" not found.`;
        console.warn(errorMessage);
        return <h1>{errorMessage}</h1>;
      }

      const Component = moduleRegistryItem?.component;

      /* Routing Reactivity
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      const routeSubscription                           = moduleRegistryItem.routes ?? false;
      const [routeChangeCounter, setRouteChangeCounter] = useState(0);

      useEffect(() => {
        if (!routeSubscription) return;

        return Apis.router.subscribe((newRoute) => {
          if (moduleManager.shouldModuleRerenderBasedOnRoute(routeSubscription, newRoute)) {
            setRouteChangeCounter(prev => prev + 1);
          }
        });
      }, [routeSubscription]);

      const shouldRerenderDueToURLChange = useMemo(() => {
        return routeChangeCounter;
      }, [routeChangeCounter]);

      /* Signal Reactivity
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      const signalChangeCounter = context.signalChangeCounter;
      const changedSignals      = context.changedSignals;
      const subscribedSignals   = moduleRegistryItem.signals || null;

      const shouldRerenderDueToSignalChange = useMemo(() => {
        if (!subscribedSignals) {
          return signalChangeCounter;
        }

        if (subscribedSignals.length === 0) {
          return 0;
        }

        const hasRelevantChange = subscribedSignals.some(signalId => changedSignals.includes(signalId));

        if (hasRelevantChange) {
          return signalChangeCounter;
        } else {
          return 0;
        }
      }, [signalChangeCounter, subscribedSignals, changedSignals]);

      /* Module Lifecycle
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      useEffect(() => {
        moduleManager.onModuleMount(moduleId);
        return () => {
          moduleManager.onModuleUnmount(moduleId);
        };
      }, []);

      /* Render
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      const memoizedComponent = useMemo(() => {

        return Component ? <Component 

          React    = { React }
          R        = { React }

          Graph    = { Apis.graph }

          Node     = { Node }
          N        = { Node }

          Module   = { Module }
          M        = { Module } 

          Kernel   = { kernel } 
          K        = { kernel } 
          _        = { kernel } 

          Services = { kernel.services }

          Apis     = { Apis }
          Media    = { Apis.media }
          Utility  = { Apis.utility }
          Router   = { Apis?.router }

          Lucide  = { Lucide }

          {...props}>

          {children}

          </Component> : <div className="morpheus-error-box"> <strong>Morpheus Error:</strong> {`${`Module '${moduleId}' of node '${kernel.nodeId}' listed in ${kernel.nodeId}.config.jsx → modules but not found in specified location.`}`}</div>;

      }, [shouldRerenderDueToSignalChange, shouldRerenderDueToURLChange]);

      return memoizedComponent;
    };
  }

  /* Module Lifecycle (placeholder for future implementation)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  onModuleMount(moduleId) {
    // Future: lifecycle hooks
  }

  onModuleUnmount(moduleId) {
    // Future: lifecycle hooks
  }

  /* Module Lifecycle Hooks
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async callModuleHook(moduleId, moduleRegistryItem, hookName) {
    const hooks = moduleRegistryItem?.hooks;

    if (!hooks) {
      return null;
    }

    const hook = hooks[hookName];

    if (!hook || typeof hook !== 'function') {
      return null;
    }

    try {
      await hook(this.kernel, moduleId);
    } catch (error) {
      console.error(`[ModuleManager] Error in '${hookName}' hook for module '${moduleId}':`, error);

      // Call onError hook if available
      if (hookName !== 'onError' && hooks.onError) {
        try {
          await hooks.onError(this.kernel, moduleId, error, { hookName });
        } catch (errorHookError) {
          console.error(`[ModuleManager] Error in 'onError' hook for module '${moduleId}':`, errorHookError);
        }
      }
    }
  }

  /* Route Matching
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  shouldModuleRerenderBasedOnRoute(subscription, currentRoute) {
    if (!subscription || subscription === false) {
      return false;
    }

    if (subscription === true) {
      return true;
    }

    if (typeof subscription === 'string') {
      return this.matchRoutePattern(subscription, currentRoute);
    }

    if (Array.isArray(subscription)) {
      return subscription.some(pattern => this.matchRoutePattern(pattern, currentRoute));
    }

    return false;
  }

  matchRoutePattern(pattern, route) {

    if (pattern === route) {
      return true;
    }

    if ( pattern.includes('*') ) {
      const prefix = pattern.replace('*', '');
      return route.startsWith(prefix);
    }

    if (pattern.includes(':')) {

      const patternSegments = pattern.split('/').filter(s => s);
      const routeSegments   = route.split('/').filter(s => s);

      if (patternSegments.length !== routeSegments.length) {
        return false;
      }

      return patternSegments.every((seg, i) => {
        return seg.startsWith(':') || seg === routeSegments[i];
      });
    }

    return false;
  }

  /* Cleanup
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  destroy() {
    this.kernel         = null;
    this.nodeResources  = null;
    this.moduleRegistry = null;
    this.apis           = null;
    this.nodeContext    = null;
    this.nodeLoader     = null;
  }
}