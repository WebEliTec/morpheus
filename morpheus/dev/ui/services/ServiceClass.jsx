class ServiceClass {

  constructor( config ) {
    this.apis         = config.apis;
    this.appConfig    = config.appConfig;
    this.nodeRegistry = this.appConfig.nodes;
    
  }

  getNodeRegistry() {
    return this.nodeRegistry;
  }

}

export default ServiceClass;