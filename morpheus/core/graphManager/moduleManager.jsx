// morpheus/core/graphManager/moduleManager.js
import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import * as Lucide from 'lucide-react';

export default class ModuleManager {

  constructor({ kernel, nodeResources, apis, nodeContext, nodeLoader }) {

    this.kernel                = kernel;
    this.nodeResources         = nodeResources;
    this.moduleRegistry        = nodeResources.modules;
    this.apis                  = apis;
    this.nodeContext           = nodeContext;
    this.nodeLoader            = nodeLoader;
    this.moduleInstanceCounter = 0;
    this.componentRegistry     = nodeResources.components;
  }

  // ####################CHANGE - START##################
  /* Component Loader Factory
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  getComponentLoader() {
    const componentRegistry = this.componentRegistry;
    const kernel            = this.kernel;
    
    return function ComponentLoader({ id, children, ...props }) {
      const componentId           = id;
      const componentRegistryItem = componentRegistry?.[componentId];
      
      if (!componentRegistryItem) {
        const errorMessage = `Component "${componentId}" of node "${kernel.nodeId}" not found in components registry.`;
        console.warn(errorMessage);
        return (
          <div className="morpheus-error-box">
            <strong>Morpheus Error:</strong> {errorMessage}
          </div>
        );
      }
      
      const Component = componentRegistryItem?.component;
      
      if (!Component) {
        return (
          <div className="morpheus-error-box">
            <strong>Morpheus Error:</strong> Component '{componentId}' of node '{kernel.nodeId}' listed in components but component file not found.
          </div>
        );
      }
      
      return <Component {...props}>{children}</Component>;
    };
  }
  // ####################CHANGE - END####################

  /* Module Component Factory
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  createModule() {

    const moduleManager  = this;
    const kernel         = this.kernel;
    const moduleRegistry = this.moduleRegistry;
    const nodeContext    = this.nodeContext;
    const Apis           = this.apis;
    const Node           = this.nodeLoader;

    // ####################CHANGE - START##################
    const Component      = this.getComponentLoader();
    // ####################CHANGE - END####################

    return function Module({ id, proxyId, instanceKey: propsInstanceKey, children = null, ...props }) {

      const moduleId           = proxyId ?? id;
      const context            = useContext(nodeContext);
      const moduleRegistryItem = moduleRegistry?.[moduleId];
      
      const hasMountedRef      = useRef(false);
      const instanceKeyRef     = useRef(null);
      
      if (instanceKeyRef.current === null) {
        instanceKeyRef.current = propsInstanceKey ?? moduleManager.generateModuleKey(moduleId);
      }
      
      const instanceKey = instanceKeyRef.current;


      if (!moduleRegistryItem) {
        const errorMessage = `Module "${moduleId}" of node "${kernel.nodeId}" not found.`;
        console.warn(errorMessage);
        return <h1>{errorMessage}</h1>;
      }

      // ####################CHANGE - START##################
      // RENAMED: Was "Component" which shadowed the ComponentLoader
      const ModuleComponent = moduleRegistryItem?.component;
      // ####################CHANGE - END####################

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

      // willMount - runs before first render (via ref check)
      if (!hasMountedRef.current) {
        moduleManager.callModuleHook(moduleId, moduleRegistryItem, 'willMount');
      }

      useEffect(() => {
        // didMount - runs after first render
        hasMountedRef.current = true;
        moduleManager.callModuleHook(moduleId, moduleRegistryItem, 'didMount');

        return () => {
          // willUnmount - runs before cleanup
          moduleManager.callModuleHook(moduleId, moduleRegistryItem, 'willUnmount');
          
          // didUnmount - runs after cleanup (via microtask)
          queueMicrotask(() => {
            moduleManager.callModuleHook(moduleId, moduleRegistryItem, 'didUnmount');
          });
        };
      }, []);

      /* Render
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      const memoizedComponent = useMemo(() => {
      // ####################CHANGE - START##################
      // RENAMED: Using ModuleComponent instead of Component
      return ModuleComponent ? (
        <ModuleComponent
      // ####################CHANGE - END####################

            key         = { instanceKey }

            React       = { React }
            R           = { React }

            Graph       = { Apis.graph }

            Node        = { Node }
            N           = { Node }

            Module      = { Module }
            M           = { Module }

            Kernel      = { kernel }
            K           = { kernel }

            _           = { kernel }

            Services    = { kernel.services }

            Apis        = { Apis }
            Media       = { Apis.media }
            Utility     = { Apis.utility }
            Router      = { Apis?.router }
            Lucide      = { Lucide }

            instanceKey = { instanceKey }

            // ####################CHANGE - START##################
            Component   = { Component }
            C           = { Component }
            // ####################CHANGE - END####################

            {...props}
          >
            {children}
          </ModuleComponent>
        ) : (
          <div className="morpheus-error-box"><strong>Morpheus Error:</strong> Module '{moduleId}' of node '{kernel.nodeId}' listed in {kernel.nodeId}.config.jsx → modules but not found in specified location.</div>
        );
      }, [shouldRerenderDueToSignalChange, shouldRerenderDueToURLChange]);

      return memoizedComponent;
    };
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

    if (pattern.includes('*')) {
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

    this.kernel                = null;
    this.nodeResources         = null;
    this.moduleRegistry        = null;
    this.apis                  = null;
    this.nodeContext           = null;
    this.nodeLoader            = null;
    this.moduleInstanceCounter = 0;

    // ####################CHANGE - START##################
    this.componentRegistry     = null;
    // ####################CHANGE - END####################

  }

  generateModuleKey(moduleId) {
    this.moduleInstanceCounter++;
    return `${moduleId}_${this.moduleInstanceCounter}`;
  }

}