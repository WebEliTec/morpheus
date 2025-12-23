"use client"

import { useState, useEffect } from 'react';
import GraphManager from './core/graphManager/graphManager';

import appConfig from '../morphSrc/app.config';
import devToolConfig from './dev/ui/devTool.config';
import libraryNodeConfig from './core/configs/libraryNode.config';

// ###################### Begin: Changes ####################
import APIManager from './core/APIManager';
// ###################### End: Changes #####################

/*
import Graph from './apis/graph';
import Router from './apis/router';
import Utility from './apis/utility';

import MediaManager from './apis/mediaManager';

import IndexedDBManager from './apis/indexedDBManager';
import LocalStorageManager from './apis/localStorageManager';*/

let NodeResourceProvider = null;
if (import.meta.env.PROD) {
  NodeResourceProvider = await import('@morphBuild/NodeResourceProvider.js').then(m => m.default);
}


export class Morpheus {
  
  constructor() {
    
    if (!!Morpheus.instance) {
      return Morpheus.getMorpheusObject();
    }

    Morpheus.instance = this;

    this.initializeApp();
    this.initializeDevTools();
  }

  static getMorpheusObject() {
    if (!Morpheus.instance) {
      Morpheus.instance = new Morpheus();
    }
    return Morpheus.instance;
  }



  /* Graph Change Handler
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  graphChangeListener() {
    // ✅ Simple: just notify devtools if kernel is available
    if (this.devToolsKernel) {
      this.devToolsKernel.notifyGraphChanged();
    }
  }

  /* DevTools Kernel Registration
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  registerDevToolsRootNodeKernel(kernel) {
    this.devToolsKernel = kernel;
    //console.log('[Morpheus] DevTools kernel registered');
  }

  /* Initialize App
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async initializeApp() {

    // Initialize APIManager before appWillInitialize hook
    this.apiManager = new APIManager(appConfig);
    this.apis       = await this.apiManager.initialize();

    this.executeAppHook('appWillInitialize');


    //Take appConfig here and determine which APIs to include

    this.apis                  = {};

    this.apis.graph               = new Graph();
    this.apis.router              = new Router();
    this.apis.utility             = new Utility();

    this.apis.media               = new MediaManager( appConfig );
    
    this.apis.indexedDBManager    = new IndexedDBManager( appConfig );
    this.apis.localStorageManager = new LocalStorageManager( appConfig );


    // Connect NodeResourceProvider to Graph API for preloading support
    if (import.meta.env.PROD && NodeResourceProvider) {
      const lazyLoadEnabled = appConfig.lazyLoadNodeResources ?? false;
      this.apis.graph._setNodeResourceProvider(NodeResourceProvider, lazyLoadEnabled);
    }

    this.executeAppHook('apisDidInitialize', this.apis );

    if ( appConfig.ServiceClass ) {
      this.services = new appConfig.ServiceClass( this.apis );
      this.executeAppHook('servicesDidInitialize', this.apis, this.services );
    }


    const config = {
      executionContext:       'app',
      apis:                   this.apis, 
      apiManager:             this.apiManager,
      services:               this.services,
      executionContextConfig: appConfig,
      libraryNodeConfig,
      graphChangeListener:    this.graphChangeListener.bind( this ),
      nodeResourceProvider:   NodeResourceProvider,
    }
    
    this.executeAppHook('graphWillInitialize', config );

    this.graphManager = new GraphManager( config );

    this.executeAppHook('appDidInitialize', this.apis, this.services, this.graphManager);

  }

  /* Initialize Dev Tools
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  async initializeDevTools() {

    // DevTools uses its own APIManager with all APIs enabled for inspection
    const devToolAPIManager = new APIManager({
      ...devToolConfig,
      supportedAPIs: [] // DevTools only needs core APIs
    });
    
    this.devToolApp = await devToolAPIManager.initialize();
    this.devToolApp.apis = {};
    this.devToolApp.apis.graph = this.apis.graph; // Share main app's graph for inspection

    const config = {
      executionContext:       'dev',
      apis:                   this.devToolApp,
      apiManager:             devToolAPIManager,
      executionContextConfig: devToolConfig,
      libraryNodeConfig,
      nodeResourceProvider:   null,
    }
    
    this.devToolGraphManager = new GraphManager(config);

  }

  /* Get Root Node (combines app + devtools)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  getRootNode() {
    const morpheus = this;
    const isDev = import.meta.env.DEV;;
    
    return function MorpheusGraphLoader() {
      const [AppRootNode, setAppRootNode]   = useState(null);
      const [DevToolsRoot, setDevToolsRoot] = useState(null);
      
      useEffect(() => {
        // Load app root node
        morpheus.graphManager.nodeManager.createNode("Root").then(node => {
          setAppRootNode(() => node);
        });
        
        // Load devtools root node in development
        if (isDev) {
          morpheus.devToolGraphManager.nodeManager.createNode("Root").then(node => {
            setDevToolsRoot(() => node);
          });
        }
      }, []);
      
      if (!AppRootNode) return <div></div>;
      
      return (
        <>
          <AppRootNode />
          {isDev && DevToolsRoot && <DevToolsRoot />}
        </>
      );
    };
  }

  /* Hook
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  executeAppHook(hookName, ...args) {
    const hook = appConfig.hooks?.[hookName];
    if (!hook) return;
    
    const callback = typeof hook === 'function' ? hook : hook.callback;
    
    if (typeof callback === 'function') {
      try {
        callback(...args);
      } catch (error) {
        console.error(`[Morpheus] Error in ${hookName} hook:`, error) ;
      }
    }
  }

}