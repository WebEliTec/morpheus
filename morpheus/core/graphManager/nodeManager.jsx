import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import NodeCompiler from '../resourceCompiler/nodeCompiler';
import MorpheusKernel from '../resourceCompiler/MorpheusKernel';
import * as Lucide from 'lucide-react'; 

let ResourceProvider = null;
if (import.meta.env.PROD)  {
  ResourceProvider = await import('../../../morphBuildSrc/ResourceProvider.js').then(m => m.default);
}

const ParentKernelContext = createContext(null);

export default class NodeManager {


  constructor( { executionContext, contextConfig, libraryNodeConfig, app, notifyGraphOnNodeMount, notifyGraphOnNodeUnmount, mayCreateNode } ) {

    this.executionContext         = executionContext;
    this.contextConfig            = contextConfig;
    this.libraryNodeConfig        = libraryNodeConfig;
    this.app                      = app;
    this.nodeRegistry             = this.contextConfig.nodeRegistry;
    this.notifyGraphOnNodeMount   = notifyGraphOnNodeMount;    
    this.notifyGraphOnNodeUnmount = notifyGraphOnNodeUnmount;
    this.mayCreateNode            = mayCreateNode;

  }

  getNodeLoader() {
    
    const nodeManager = this; 
    
    return function NodeLoader( { id, instance, children, ...props } ) {

      const nodeId                       = id;
      const instanceId                   = instance ? instance : id;
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

      return Node ? <Node {...props} /> : <></>;

    };

  }

  async createNode( nodeId, instanceId, ...props ) {

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
          nodeRegistry:       this.nodeRegistry, 
          nodeId, 
          executionContext:   this.executionContext, 
          contextConfig:      this.contextConfig,
          libraryNodeConfig:  this.libraryNodeConfig,
          environment:        'client',
        });

        nodeResources  = await compiler.exec();

      } catch (error) {

        console.error(`Failed to compile resources for node '${nodeId}':`, error);
        throw error;

      }

    }

    const { traits }          = nodeResources;

    nodeResources.KernelClass = this.createKernelClass(traits);

    const app                 = this.app;
    const kernel              = this.initializeKernel( nodeId, instanceId, nodeProps, nodeResources, app  );

    await this.callHook( 'kernelDidInitialize', nodeResources, kernel );

    const NodeProvider        = this.createNodeProvider( kernel, nodeResources );
    const Module              = this.createModule( kernel, nodeResources.moduleRegistry );
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

  initializeKernel( nodeId, instanceId, nodeProps, nodeResources, app ) {
      
    const { KernelClass, constants, metaData, coreData, signalClusters } = nodeResources;

    const kernel             = new KernelClass();
    const instanceData       = this.getInstanceItemData(nodeResources, instanceId);

    kernel.id                = this.getFullyQualifiedNodeId( nodeId, instanceId );
    kernel.nodeId            = nodeId;
    kernel.instanceId        = instanceId;
    kernel.props             = nodeProps;
    kernel.parentId          = nodeProps?.parentId; 

    kernel.constants         = constants;
    
    kernel.metaData          = { ...metaData, ...(instanceData?.metaData || {}) };
    kernel.coreData          = { ...coreData, ...(instanceData?.coreData || {}) };
    kernel.signalClusters    = signalClusters;
    kernel.optimisticSignals = {};

    kernel.app               = app;
    kernel.media             = app.media;
    kernel.utility           = app.utility;
    kernel.graph             = app.graph;


    kernel.router              = app.router;

    const onNavigation         = () => {
      this.callHook( 'onNavigation', nodeResources, kernel );
    };

    kernel.router.triggerOnNavigationHook = onNavigation;

    kernel.runtimeData         = {};

    const onRuntimeDataChange  = ( changedRuntimeDataItems ) => {
      this.callHook( 'onRuntimeDataChange', nodeResources, kernel, changedRuntimeDataItems );
    };

    kernel.onRuntimeDataChange = onRuntimeDataChange;
   
    return kernel;
  }

  destroyKernel( kernel ) {
    
    if (!kernel) {
      console.warn('[NodeManager] Attempted to cleanup null kernel');
      return;
    }
    
    if (typeof kernel.onDestroy === 'function') {
      try {
        kernel.onDestroy();
      } catch (error) {
        console.error(`[NodeManager] Error in kernel.onDestroy for ${kernel.nodeId}:`, error);
      }
    }
    
    kernel.signals           = null;
    kernel.optimisticSignals = null;
    kernel.constants         = null;
    kernel.metaData          = null;
    kernel.coreData          = null;
    kernel.signalClusters    = null;
    kernel.nodeId            = null;
    kernel.instanceId        = null;
    kernel.fullyQualifiedId  = null;
  
  }

  /* Component Factories
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  createNodeProvider( kernel, nodeResources ) {
    
    const { signalClusters } = nodeResources;
    const nodeContext        = createContext();
    this.nodeContext         = nodeContext;

    if( !signalClusters ) {
      console.warn(`No signal or signalCluster provided for node '${kernel.nodeId}'`);
    }

    const signalDefinitions = [];

    if( signalClusters ) {
      Object.keys(signalClusters).forEach((signalClusterId) => {
        Object.entries(signalClusters[signalClusterId].signals).forEach(([signalId, signalDef]) => {
          signalDefinitions.push({ signalId, ...signalDef });
        });
      });
    }

    const callHook = this.callHook.bind(this); 
    
    return function NodeProvider( { children = null } ) {
      
      const [ signalChangeCounter, setSignalChangeCounter ] = useState(0);
      const [ changedSignals, setChangedSignals ]           = useState([]);
      const [signalsInitialized, setSignalsInitialized]     = useState(false);
      
      const signalInstances                                 = {};

      const [signalValues, setSignalValues] = useState(() => {
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
    const App                              = this.app;

    return function Module( { id, proxyId, children = null, ...props } ) {

      /* General
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      const moduleId            = proxyId ?? id;
      const context             = useContext( nodeContext );
      
      const moduleEntry         = moduleRegistry?.[moduleId];
      
      if( !moduleEntry ) {
        const errorMessage = `Module "${moduleId}" of node "${kernel.nodeId}" not found.`;
        console.warn( errorMessage );
        return <h1>{errorMessage }</h1>;
      }

      const Component           = moduleEntry?.component;

      /* Routing Reactivity
      /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

      const routeSubscription   = moduleEntry.routes ?? false;  // ← NEW
      const [ routeChangeCounter, setRouteChangeCounter ] = useState(0);

      useEffect(() => {
        if ( !routeSubscription ) return;
        
        return App.router.subscribe((newRoute) => {
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
      const subscribedSignals   = moduleEntry.signals || null;

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

          React   = { React }
          R       = { React }

          Graph   = { App.graph }

          Node    = { Node }
          N       = { Node }

          Module  = { Module }
          M       = { Module } 

          Kernel  = { kernel } 
          K       = { kernel } 
          _       = { kernel } 

          App     = { App }
          Media   = { App.media }
          Utility = { App.utility }
          Router  = { App?.router }

          Lucide  = { Lucide }

          {...props}>

          {children}

          </Component> : <h1>{`${`Module "${moduleId}" of node "${kernel.nodeId}" listed in module registry but not found in specified location.`}`}</h1>;

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
          destroyKernel(kernel);
          
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


  /* Helpers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getInstanceItemData(nodeResources, instanceId) {

    const instanceRegistry = nodeResources?.instanceRegistry;
    
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
    const instanceData = instanceRegistry[instanceId];
    
    if (!instanceData) {
      throw new Error(
        `[Morpheus] Instance "${instanceId}" not found in instanceRegistry for node "${nodeResources.config.nodeId || 'unknown'}"`
      );
    }
    
    return instanceData;
  }

  getFullyQualifiedNodeId( nodeId, instanceId = null ) {

    const separator = ':';
    
    if( !nodeId ) {
      return null;
    }

    if( !instanceId ) {
      return `${ nodeId }${ separator }${ nodeId }`
    }

    return `${ nodeId }${ separator }${ instanceId }` 

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