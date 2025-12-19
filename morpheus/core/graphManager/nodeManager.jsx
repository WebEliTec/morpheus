import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import NodeCompiler from '../resourceCompiler/nodeCompiler';
import MorpheusKernel from '../resourceCompiler/MorpheusKernel';
import * as Lucide from 'lucide-react'; 

let ResourceProvider = null;
if (import.meta.env.PROD)  {
  ResourceProvider = await import('../../../morphBuild/ResourceProvider.js').then(m => m.default);
}

const ParentKernelContext = createContext(null);

export default class NodeManager {


  constructor( { executionContext, executionContextConfig, libraryNodeConfig, services, apis, notifyGraphOnNodeMount, notifyGraphOnNodeUnmount, mayCreateNode } ) {

    this.services                 = services || null; 
    this.executionContext         = executionContext;
    this.executionContextConfig   = executionContextConfig;
    this.libraryNodeConfig        = libraryNodeConfig;
    this.apis                     = apis;
    this.nodeRegistry             = this.executionContextConfig.nodes;
    this.notifyGraphOnNodeMount   = notifyGraphOnNodeMount;    
    this.notifyGraphOnNodeUnmount = notifyGraphOnNodeUnmount;
    this.mayCreateNode            = mayCreateNode;

  }

  getNodeLoader() {
    
    const nodeManager = this; 
    
    return function NodeLoader( { id, instance, children, ...props } ) {

      const nodeId                       = id;
      const instanceId                   = instance ?? 'Default';
      const [ Node, setNode ]            = useState( null );
      const parentKernelFullyQualifiedID = useContext( ParentKernelContext );
      
      useEffect(() => {
        async function loadNode() {
          try {
            const node = await nodeManager.createNode(nodeId, instanceId, {
              ...props,
              parentId: parentKernelFullyQualifiedID,
            });
            setNode( () => node );
          } catch ( error ) {
            console.error( 'Failed to mount Node:', error );
          }
        }
        loadNode();
      }, []);

      return Node ? <Node {...props} /> : <>Loading...</>;

    };

  }

  async createNode( nodeId, instanceId, ...props ) {

    const isNodeRegistered = this.nodeRegistry.hasOwnProperty(nodeId);
    
    if (!isNodeRegistered) {
      console.error(`[Morpheus] Node '${nodeId}' is not registered in app.config.js → nodes.`);
      
      return function UnregisteredNodeError() {
        return (
          <div className="morpheus-error-box">
            <strong>Morpheus Error:</strong> Node '{nodeId}' is not registered in app.config.js → nodes.
          </div>
        );
      };
    }

    const nodeProps = props[0] || {};

    let nodeResources;

    if (import.meta.env.PROD) {

      try {

        nodeResources = ResourceProvider.getNodeResources(nodeId);

      } catch (error) {

        console.error(`Failed to load pre-built resources for ${nodeId}:`, error);
        throw error;

      }

    } else {

      try {

        const compiler = new NodeCompiler({
          nodeRegistry:           this.nodeRegistry, 
          nodeId, 
          executionContext:       this.executionContext, 
          executionContextConfig: this.executionContextConfig,
          libraryNodeConfig:      this.libraryNodeConfig,
          runtimeEnvironment: 'client',
        });

        nodeResources  = await compiler.exec();

      } catch (error) {

        console.error(`Failed to compile resources for node '${nodeId}':`, error);
        throw error;

      }

    }

    const { traits }          = nodeResources;

    nodeResources.KernelClass = this.createKernelClass(traits);

    const services            = this.services;
    const apis                = this.apis;
    const kernel              = this.initializeKernel( nodeId, instanceId, nodeProps, nodeResources, apis, services  );

    await this.callHook( 'kernelDidInitialize', nodeResources, kernel );

    const NodeProvider        = this.createNodeProvider( kernel, nodeResources );
    const Module              = this.createModule( kernel, nodeResources.modules );
    const NodeComponent       = this.createNodeComponent( nodeResources, NodeProvider, Module, kernel );

    return NodeComponent;
    
  }

  createKernelClass(traits) {
    class NodeKernel extends MorpheusKernel {}
    
    const traitIds = Object.keys(traits);
    traitIds.forEach((traitId) => {
      const trait = traits[traitId];
      if (trait) { 
        Object.assign(NodeKernel.prototype, trait);
      }
    });
    
    return NodeKernel;
  }

  initializeKernel( nodeId, instanceId, nodeProps, nodeResources, apis, services ) {
      
    const { KernelClass, constants, metaData, coreData, signalGroups } = nodeResources;

    const kernel               = new KernelClass();
    const instanceRegistryItem = this.getInstanceItemData(nodeResources, instanceId);
    const fullyQualifiedId     = this.getFullyQualifiedNodeId( nodeId, instanceId );

    kernel.id                  = fullyQualifiedId;
    kernel.nodeId              = nodeId;
    kernel.instanceId          = instanceId;
    kernel.props               = nodeProps;
    kernel.parentId            = nodeProps?.parentId; 

    kernel.constants           = constants;
    
    kernel.metaData            = { ...metaData, ...(instanceRegistryItem?.metaData || {}) };
    kernel.coreData            = { ...coreData, ...(instanceRegistryItem?.coreData || {}) };
    kernel.signalGroups        = signalGroups;
    kernel.optimisticSignals   = {};

    kernel.services            = services;
    kernel.apis                = apis;
    kernel.media               = apis.media;
    kernel.utility             = apis.utility;
    kernel.graph               = apis.graph;

    kernel.router              = apis.router;

    this.registerNavigationHooks( kernel, nodeResources );

    kernel.runtimeData          = {};
    const runtimeDataDidChange  = ( changedRuntimeDataItems ) => { this.callHook( 'runtimeDataDidChange', nodeResources, kernel, changedRuntimeDataItems ) };
    kernel.runtimeDataDidChange = runtimeDataDidChange;
   
    return kernel;

  }

  destroyKernel( kernel, nodeResources ) {
    
    if (!kernel) {
      console.warn('[NodeManager] Attempted to cleanup null kernel');
      return;
    }

    // Clean up navigation hooks
    this.unregisterNavigationHooks(kernel);
    
    kernel.services          = null;
    kernel.signals           = null;
    kernel.optimisticSignals = null;
    kernel.constants         = null;
    kernel.metaData          = null;
    kernel.coreData          = null;
    kernel.signalGroups      = null;
    kernel.nodeId            = null;
    kernel.instanceId        = null;
    kernel.fullyQualifiedId  = null;
  
  }

  /* Component Factories
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  createNodeProvider( kernel, nodeResources ) {
    
    const { signalGroups } = nodeResources;
    const nodeContext        = createContext();
    this.nodeContext         = nodeContext;

    if( !signalGroups ) {
      console.warn(`No signal or signalGroups provided for node '${kernel.nodeId}'`);
    }

    const signalDefinitions = [];

    if( signalGroups ) {
      Object.keys(signalGroups).forEach((signalGroupItemId) => {
        Object.entries(signalGroups[signalGroupItemId].signals).forEach(([signalId, signalDef]) => {
          signalDefinitions.push({ signalId, ...signalDef });
        });
      });
    }

    const callHook = this.callHook.bind(this); 
    
    return function NodeProvider( { children = null } ) {
      
      const [ signalChangeCounter, setSignalChangeCounter ] = useState(0);
      const [ changedSignals, setChangedSignals ]           = useState([]);
      const [ signalsInitialized, setSignalsInitialized ]   = useState(false);
      
      const signalInstances                                 = {};

      const [ signalValues, setSignalValues ] = useState(() => {
        const initial = {};
        signalDefinitions.forEach(({ signalId, default: defaultValue }) => {
          initial[signalId] = defaultValue;
        });
        return initial;
      });

      signalDefinitions.forEach(({ signalId, type }) => {
        signalInstances[signalId] = {
          id: signalId,
          type,
          value: signalValues[signalId],
          set: (newValue) => {
            setSignalValues(prev => ({ ...prev, [signalId]: newValue }));
            setSignalChangeCounter(prev => prev + 1);
            setChangedSignals(prev => prev.includes(signalId) ? prev : [...prev, signalId] );
          }
        };
      });

      kernel.signals = signalInstances;

      useEffect(() => {
        if (!signalsInitialized) {
          callHook('signalsDidInitialize', nodeResources, kernel);
          setSignalsInitialized(true);
        }
      }, [signalsInitialized]);

      useEffect(() => {
        if (changedSignals.length > 0 && signalsInitialized) {
          callHook('signalsDidChange', nodeResources, kernel, changedSignals);
        }
      }, [signalChangeCounter, signalsInitialized]);

      const contextValue     = { signalChangeCounter, changedSignals };

      return (
        <ParentKernelContext.Provider value={kernel.id}>
          <nodeContext.Provider value={contextValue}>
            {children}
          </nodeContext.Provider>
        </ParentKernelContext.Provider>
      )

    };
  }

  createModule( kernel, moduleRegistry ) {

    const nodeContext                      = this.nodeContext; 
    const onModuleMount                    = this.onModuleMount.bind(this);
    const onModuleUnmount                  = this.onModuleUnmount.bind(this);
    const shouldModuleRerenderBasedOnRoute = this.shouldModuleRerenderBasedOnRoute.bind(this);
    const Node                             = this.getNodeLoader();
    const Apis                             = this.apis;

    return function Module( { id, proxyId, children = null, ...props } ) {

      /* General
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      const moduleId            = proxyId ?? id;
      const context             = useContext( nodeContext );
      
      const moduleRegistryItem  = moduleRegistry?.[moduleId];
      
      if( !moduleRegistryItem ) {
        const errorMessage = `Module "${moduleId}" of node "${kernel.nodeId}" not found.`;
        console.warn( errorMessage );
        return <h1>{errorMessage }</h1>;
      }

      const Component           = moduleRegistryItem?.component;

      /* Routing Reactivity
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      const routeSubscription   = moduleRegistryItem.routes ?? false;  // ← NEW
      const [ routeChangeCounter, setRouteChangeCounter ] = useState(0);

      useEffect(() => {
        if ( !routeSubscription ) return;
        
        return Apis.router.subscribe((newRoute) => {
          if ( shouldModuleRerenderBasedOnRoute ( routeSubscription, newRoute ) ) {
            setRouteChangeCounter(prev => prev + 1);
          }
        });
      }, [ routeSubscription ]);

      const shouldRerenderDueToURLChange = useMemo(() => {
        return routeChangeCounter;
      }, [routeChangeCounter]);


      /* Signal Reactivity
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      const signalChangeCounter = context.signalChangeCounter;
      const changedSignals      = context.changedSignals;
      const subscribedSignals   = moduleRegistryItem.signals || null;

      const shouldRerenderDueToSignalChange = useMemo( () => {

        if ( !subscribedSignals ) {
          return signalChangeCounter;
        }
        
        if ( subscribedSignals.length === 0 ) {
          return 0;
        }
        
        const hasRelevantChange = subscribedSignals.some( signalId => changedSignals.includes(signalId) );
        
        if ( hasRelevantChange ) {
          return signalChangeCounter;
        } else {
          return 0;
        }
        
      }, [ signalChangeCounter, subscribedSignals, changedSignals ] );


      /* Module Life Cycle Methods
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      useEffect(() => {
        onModuleMount( moduleId )
        return () => {
          onModuleUnmount( moduleId );
        };
      }, []);

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

      }, [ shouldRerenderDueToSignalChange, shouldRerenderDueToURLChange ] );
  
      return memoizedComponent;

    };
  }

  createNodeComponent( nodeResources, NodeProvider, Module, kernel ) {

    const { nodeId, nodeProps } = kernel

    const rootModuleId             = nodeResources.rootModuleId;
    const notifyGraphOnNodeMount   = this.notifyGraphOnNodeMount;
    const notifyGraphOnNodeUnmount = this.notifyGraphOnNodeUnmount;
    const destroyKernel            = this.destroyKernel.bind(this);
    const callHook                 = this.callHook.bind(this);  

    return function NodeComponent( { ...props } ) {

    useEffect(() => {

      notifyGraphOnNodeMount(kernel);
      
      (async () => {
        await callHook('nodeDidMount', nodeResources, kernel);
      })();
      
      return () => {
        (async () => {
          await callHook('nodeWillUnmount', nodeResources, kernel);
          
          notifyGraphOnNodeUnmount(kernel.id);
          destroyKernel(kernel, nodeResources);
          
          await callHook('nodeDidUnmount', nodeResources, kernel);
        })();
      };
    }, []);

      return ( 
        <NodeProvider>
          <Module id = { rootModuleId } data-node-id = { nodeId } {...nodeProps} {...props } />
        </NodeProvider>
      )

    };
  }

  async callHook(hookName, nodeResources, ...args) {
    
    const hooks = nodeResources?.hooks;

    if ( !hooks ) {
      return null;
    }

    const hook  = hooks?.[hookName];

    if( !hook ) {
      return null;
    }
    
    if (typeof hook === 'function') {
      
      try {

        await hook(...args);

      } catch (error) {

        console.error(`[NodeManager] Error in ${hookName} hook:`, error);
        
        // Call nodeDidError hook if available
        if ( hookName !== 'nodeDidError' && hooks.nodeDidError ) {
          try {
            await hooks.nodeDidError( args[0], error, { hookName } );
          } catch (errorHookError) {
            console.error( '[NodeManager] Error in nodeDidError hook:', errorHookError );
          }
        }
      }
    }
  }

  /* Module Lifecycle Hooks
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  onModuleMount( moduleId ) {
    //console.log( `Mounting ${moduleId}` );
  }

  onModuleUnmount( moduleId ) {
    //console.log( `Unmouting ${moduleId}` );
  }

  /* Navigation Hook Registration
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  registerNavigationHooks(kernel, nodeResources) {
    const hooks = nodeResources?.hooks;
    if (!hooks) return;

    const navigationHookTypes = ['willNavigate', 'didNavigate'];

    for (const hookType of navigationHookTypes) {
      const hookDef = hooks[hookType];
      if (!hookDef) continue;

      const normalizedHook = this.normalizeNavigationHook(hookDef, kernel);
      if (normalizedHook) {
        kernel.router.registerNavigationHook(hookType, kernel.id, normalizedHook);
      }
    }
  }

  normalizeNavigationHook(hookDef, kernel) {
    const DEFAULT_PRIORITY = 10;

    // Direct function format
    if (typeof hookDef === 'function') {
      return {
        priority: DEFAULT_PRIORITY,
        callback: hookDef,
        kernel,
      };
    }

    // Object format with callback
    if (typeof hookDef === 'object' && hookDef !== null) {
      const callback = hookDef.callback;
      if (typeof callback !== 'function') {
        console.warn(`[NodeManager] Navigation hook for node "${kernel.nodeId}" has object format but no valid callback function`);
        return null;
      }

      return {
        priority: typeof hookDef.priority === 'number' ? hookDef.priority : DEFAULT_PRIORITY,
        callback,
        kernel,
      };
    }

    console.warn(`[NodeManager] Invalid navigation hook format for node "${kernel.nodeId}"`);
    return null;
  }

  unregisterNavigationHooks(kernel) {
    if (kernel?.router && kernel?.id) {
      kernel.router.unregisterNavigationHooks(kernel.id);
    }
  }


  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getInstanceItemData(nodeResources, instanceId) {

    const instanceRegistry = nodeResources?.instances;
    
    if (!instanceRegistry) {
      // No instance registry defined - that's OK for anonymous instances
      return null;
    }
    
    // Check if this is a named instance (not auto-generated nanoid)
    const isNamedInstance = instanceRegistry.hasOwnProperty(instanceId);
    
    if (!isNamedInstance) {
      // Anonymous instance (auto-generated ID) - no registry data
      return null;
    }
    
    // Named instance - must exist in registry
    const instanceRegistryItem = instanceRegistry[instanceId];
    
    if (!instanceRegistryItem) {
      throw new Error(
        `[Morpheus] Instance "${instanceId}" not found in instanceRegistry for node "${nodeResources.config.nodeId || 'unknown'}"`
      );
    }
    
    return instanceRegistryItem;
  }

  getFullyQualifiedNodeId( nodeId, instanceId = null ) {

    const separator = ':';
    
    if( !nodeId ) {
      return null;
    }

    if( !instanceId ) {
      return `${ nodeId }${ separator }Default`
    }

    return `${ nodeId }${ separator }Default` 

  }

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
      const routeSegments = route.split('/').filter(s => s);
      
      if (patternSegments.length !== routeSegments.length) {
        return false;
      }
      
      return patternSegments.every((seg, i) => {
        return seg.startsWith(':') || seg === routeSegments[i];
      });
    }
    
    return false;

  }
  

}