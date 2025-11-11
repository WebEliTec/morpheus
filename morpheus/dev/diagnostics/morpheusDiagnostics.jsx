import compilerDiagnosticsRegistry from '../compiler/compilerDiagnosticsRegistry';
import ReportManager from './morpheusDiagnostics/inc/reportManager';
import SecureModeReporter from './morpheusDiagnostics/inc/secureModeReporter';

export default class MorpheusDiagnostics {
  
  isAdvancedDiagnosticsSystemActive = true;
  logItems                          = [];
  useNewDiagnosticSystem            = true;

  constructor( appConfig ) {
    this.nodeRegistry = appConfig.nodeRegistry;
    this.init();
  }

  init() {   

    this.secureModeReporter                = SecureModeReporter.getInstance();
    this.compilerDiagnosticsRegistry       = compilerDiagnosticsRegistry;
    this.developmentProcessItems           = this.getDevelopmentProcessItems();

    const diagnosticsRegistries = {
      compilerDiagnosticsRegistry: this.compilerDiagnosticsRegistry
    }

    this.reportManager                     = new ReportManager( this.developmentProcessItems, diagnosticsRegistries, this.handleLogItemsSubmission.bind(this) );

  }

  //Experimental Method. Make morpheusDiagnostics store logItems and coordinate, when morpheusDiagnosticsContext should be triggered
  storeLogItemsInMorpheusDiagnostics( identity, logItem ) {
    this.logItems.push( logItem );
  }


  /* Providing Contextcallbacks to ReportManagers (Old System)
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  setDiagnosticsContextCallbacks( callbacks ) {

    //console.log( 'Setting Diagnostics Context Callbacks...' );

    const { handleCompilationLogItemsUpdate } = callbacks;

    this.compilationLevelReporter.setContextCallback( handleCompilationLogItemsUpdate );

  }

  /* Providing Contextcallbacks to ReportManagers
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  setDiagnosticsContextCallbacks(callbacks) {
    //console.log('Setting Diagnostics Context Callbacks...');
    this.diagnosticsContextCallbacks = callbacks;
  }

  /* Factory Method for Diagnostic Contexts
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  createReporter(reporterTypeId, config = {}) {

    if( !this.isAdvancedDiagnosticsSystemActive ) {
      return this.secureModeReporter;
    }

    if (reporterTypeId === 'CompilationLevelReporter') {
      return this.reportManager.constructReporter( 'CompilationLevelReporter', config );
    }

    if (reporterTypeId === 'CompilationProcessReporter') {
      return this.reportManager.constructReporter( 'CompilationProcessReporter', config );
    }

    throw new Error(`Unknown reporter type: ${reporterTypeId}`);

  }

  getDevelopmentProcessItems() {

    const developmentItems = {};

    for (const [ nodeId, nodeItem ] of Object.entries( this.nodeRegistry )) {
      if( nodeItem.inDevelopment && nodeItem.type === 'library' ) {
        const [ frameworkId, appId, instanceId ] = nodeItem.identity;
        const identityKey = `${frameworkId}.${appId}.${instanceId}`;
        developmentItems[identityKey] = { frameworkId, appId, instanceId };
      }
    }
    

    return developmentItems;
  }

  handleLogItemsSubmission(logItems) {
  //console.log('MorpheusDiagnostics received submitted log items:', Object.keys(logItems).length, 'identities');
  
  // Store in MorpheusDiagnostics - handle nested structure
  for (const [identityString, identityData] of Object.entries(logItems)) {
    // identityData is now nested: { loading: { staticFileLoading: [...], traitLoading: [...] } }
    for (const [mainProcessId, mainProcessData] of Object.entries(identityData)) {
      for (const [subProcessId, items] of Object.entries(mainProcessData)) {
        if (Array.isArray(items)) {
          this.logItems.push(...items);
        }
      }
    }
  }
  
  // Forward to React context if callbacks are set - send the nested structure
  if (this.diagnosticsContextCallbacks?.handleCompilationLogItemsUpdate) {
    for (const [identityString, nestedStructure] of Object.entries(logItems)) {
      this.diagnosticsContextCallbacks.handleCompilationLogItemsUpdate(identityString, nestedStructure);
    }
  }
}


}