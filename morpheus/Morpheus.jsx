"use client"

import { useState, useEffect } from 'react';
import GraphManager from './core/graphManager/graphManager';

import appConfig from '../morphSrc/app.config';
import devToolConfig from './dev/ui/devTool.config';
import libraryNodeConfig from './libraryNode.config';

import MediaManager from './apis/mediaManager';
import Graph from './apis/graph';
import Router from './apis/router';
import Utility from './apis/utility';


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

  initializeApp() {
    this.app          = {};
    this.app.media    = new MediaManager( appConfig );
    this.app.graph    = new Graph();
    this.app.router   = new Router();
    this.app.utility  = new Utility();

    const config = {
      executionContext: 'app',
      app:              this.app, 
      contextConfig:    appConfig,
      libraryNodeConfig,
      graphChangeListener: this.graphChangeListener.bind( this ),
    }

    this.graphManager = new GraphManager( config );
  }

  /* Initialize Dev Tools
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  initializeDevTools() {
    this.devToolApp           = {};
    this.devToolApp.media     = new MediaManager( devToolConfig );
    this.devToolApp.graph     = new Graph();
    this.devToolApp.utility   = new Utility();
    this.devToolApp.router    = new Router();
    this.devToolApp.app       = {}; 
    this.devToolApp.app.graph = this.app.graph;

    const config = {
      executionContext: 'dev',
      app:                this.devToolApp, 
      contextConfig:      devToolConfig, 
      libraryNodeConfig,
    }

    this.devToolGraphManager  = new GraphManager( config );
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

}