import Graph from '../apis/graph';
import Router from '../apis/router';
import Utility from '../apis/utility';
import apiRegistry from './configs/apiRegistry.js';

export default class APIManager {
  
  constructor( appConfig ) {

    console.log( 'API Manager' );

    this.appConfig           = appConfig;
    this.supportedAPIs       = appConfig.supportedAPIs || [];
    this.apis                = {};
    this.enabledAdvancedAPIs = [];
    
    this.validateSupportedAPIs();

  }
  
  /* Validation
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  validateSupportedAPIs() {
    const availableAdvancedAPIs = Object.keys(apiRegistry);
    
    for (const apiName of this.supportedAPIs) {
      if (!availableAdvancedAPIs.includes(apiName)) {
        throw new Error(
          `[APIManager] Unknown API "${apiName}" in supportedAPIs. ` +
          `Available advanced APIs: ${availableAdvancedAPIs.join(', ')}`
        );
      }
    }
  }
  
  /* Initialization
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  async initialize() {
    
    this.initializeCoreAPIs();
    
    await this.initializeAdvancedAPIs();
    
    return this.apis;
  }
  
  initializeCoreAPIs() {

    this.apis.graph   = new Graph( this.appConfig );
    this.apis.router  = new Router( this.appConfig );
    this.apis.utility = new Utility( this.appConfig );

  }
  
  async initializeAdvancedAPIs() {

    for (const apiName of this.supportedAPIs) {

      const registryEntry = apiRegistry[apiName];
      
      try {
        const module       = await import(/* @vite-ignore */ registryEntry.path);
        const APIClass     = module.default;
        
        this.apis[apiName] = new APIClass(this.appConfig);

        this.enabledAdvancedAPIs.push(apiName);
        
      } catch (error) {
        throw new Error( `[APIManager] Failed to load API "${apiName}": ${error.message}` );
      }

    }

  }
  
  /* API Access
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  getAPIs() {
    return this.apis;
  }
  
  isAdvancedAPIEnabled(apiName) {
    return this.enabledAdvancedAPIs.includes(apiName);
  }
  
  /* Kernel Assignment
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  assignAPIsToKernel(kernel) {
    
    // Assign Core APIs (always available)
    kernel.apis    = this.apis;
    kernel.graph   = this.apis.graph;
    kernel.router  = this.apis.router;
    kernel.utility = this.apis.utility;
    
    // Assign Advanced APIs (enabled ones get instance, disabled get proxy)
    for (const [apiName, registryEntry] of Object.entries(apiRegistry)) {
      const isEnabled = this.isAdvancedAPIEnabled(apiName);
      
      if (isEnabled) {
        // Assign the actual API instance
        kernel[apiName] = this.apis[apiName];
        
        // Assign aliases
        for (const alias of registryEntry.aliases) {
          kernel[alias] = this.apis[apiName];
        }
      } else {
        // Assign disabled proxy
        const proxy = this.createDisabledAPIProxy(apiName);
        kernel[apiName] = proxy;
        
        // Assign proxy to aliases as well
        for (const alias of registryEntry.aliases) {
          kernel[alias] = proxy;
        }
      }
    }
  }
  
  /* Disabled API Proxy
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  createDisabledAPIProxy(apiName) {
    return new Proxy({}, {
      get(target, property) {
        throw new Error(
          `[Morpheus] API "${apiName}" is not enabled. ` +
          `Add "${apiName}" to supportedAPIs in app.config.js to use this API.`
        );
      },
      set(target, property, value) {
        throw new Error(
          `[Morpheus] API "${apiName}" is not enabled. ` +
          `Add "${apiName}" to supportedAPIs in app.config.js to use this API.`
        );
      }
    });
  }
}