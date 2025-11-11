import { createIdentityString } from '@morpheus/helpers';
import { nanoid } from 'nanoid'

export default class ReportManager {

  reporters            = {};
  logItems             = {};

  submissionConfig     = { batchSize: 10, maxWaitTime: 3000 };

  lastSubmission       = Date.now();
  submissionTimer      = null;

  lastLogItemCount     = 0;
  unchangedCountChecks = 0;
  maxUnchangedChecks   = 5;

  constructor( developmentProcessItems, diagnosticsRegistries, submissionCallback ) {
    this.developmentProcessItems = developmentProcessItems;
    this.diagnosticsRegistries   = diagnosticsRegistries;
    this.submissionCallback      = submissionCallback;
    this.startSubmissionTimer();
  }

  /* Reporter Constructor
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  constructReporter( reporterTypeId, config = {} ) {

    const reporterCallback = this.handleIncomingReport.bind(this);

    if (reporterTypeId === 'CompilationLevelReporter') {
      const reporter           = new CompilationLevelReporter( config, reporterCallback );
      this.reporters[nanoid()] = reporter;
      return reporter;
    }

    if (reporterTypeId === 'CompilationProcessReporter') {
      const reporter           = new CompilationProcessReporter( config, reporterCallback );
      this.reporters[nanoid()] = reporter;
      return reporter;
    }
    
    throw new Error(`Unknown reporter type: ${reporterTypeId}`);

  }
  
  /* Main Method For Report Handeling
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  handleIncomingReport( reportItem ) {

    const { reporterId, context, payload, reporterSpecificlogItemData, assumedReportType } = reportItem;

    const { identity } = context;

    if (!this.shouldReport( identity ) ) {
      return null;
    }

    const diagnosticsRegistry = this.getDiagnosticsRegistry( reporterId );
    const { locationEntry }   = this.getDiagnosticRegistryItem( diagnosticsRegistry, context );
    const expectedReportType  = locationEntry.type;

    if( !this.doReportTypesMach( expectedReportType, assumedReportType ) ) {
      return null;
    }

    this.executePayloadModifierCallback( payload, locationEntry );

    /**
     * System Layers refer to the specific name of a given systemLevelIds' name
     * During Compilation, Morpheus may be viewed as having levelIndex 0, and the system layer's name 
     * is always "Morpheus". Some more thought has to be put in the conceptual system 
     * of levelIndeces (levelIndex), levelId and systemLayer. 
     * 
     * For Diagnostics during runtime, each Framework, App, Insatnce may provide 
     * custom diagnostics registries. So, if Jung had a diagnostic registry, the 
     * systemLayer property of its diagnostics Registry would be "Jung".
     * 
     */

    const systemLayer   = diagnosticsRegistry.meta.systemLayer;


    const shortMessage   = this.processShortMessageTemplate(locationEntry, payload);
    this.attemptJsError( locationEntry, shortMessage );


    const timestamp      = new Date().toISOString();
    const identityString = createIdentityString(identity, '-', true);
    const id             = `${timestamp}-${context.className}-${context.methodName}-${context.locationCode}-${identityString}-${nanoid()}`;

    const mainprocessId  = this.getProcessIdFromClassName( diagnosticsRegistry, context.className );
    const subprocessId   = locationEntry.subprocessId;

    const logItem = {

      id,

      metaData: {

        reporterId,

        id,
        timestamp,
        identity, 
        reportType: expectedReportType,

        mainprocessId,
        subprocessId,

        systemLayer,

      },

      coreData: {
        shortMessage,
        context,
        payload,
        ...reporterSpecificlogItemData,
      },

    }

    this.storeLogItem( identity, logItem );

  }

  getDiagnosticsRegistry( reporterId ) {
    
    switch ( reporterId ) {
      case 'CompilationLevelReporter':
        return this.diagnosticsRegistries.compilerDiagnosticsRegistry;
        break;
      case 'CompilationProcessReporter':
        return this.diagnosticsRegistries.compilerDiagnosticsRegistry;
    
      default:
        break;
    }
  }

  getDiagnosticRegistryItem( diagnosticsRegistry, context ) {
  
    const { className, methodName, locationCode } = context;

    const classData = diagnosticsRegistry[className];

    if (!classData) return { locationEntry: null };

    const methodData = classData[methodName];

    if (!methodData || methodName === 'meta') return { locationEntry: null };

    const locationEntry = methodData[locationCode];
    if (!locationEntry || locationCode === 'meta') return { locationEntry: null };

    locationEntry.subprocessId = methodData.meta.process;

    return { locationEntry };
  }

  doReportTypesMach( expectedReportType, assumedReportType ) {

    if( expectedReportType != assumedReportType ) {
      throw new Error('Assumed report type submitted by reporter and actual report type from Diagnostics Registry do not match.');
    }

    return true;
  }

  shouldReport( identity ) {
    const identityString = createIdentityString(identity);
    return this.developmentProcessItems.hasOwnProperty(identityString);
  }

  executePayloadModifierCallback( payload, locationEntry ) {

    const payloadModifier  = locationEntry?.payloadModifier;
    if( typeof payloadModifier === 'function' ) {
      payloadModifier( payload );
    }

  }

  processShortMessageTemplate(locationEntry, payload = {}) {
    
    if (!locationEntry?.shortMessage ) {
      return locationEntry?.description || 'No short message template available';
    }
    
    return locationEntry.shortMessage.replace(/\{(\w+)\}/g, (match, key) => {
      return payload.hasOwnProperty(key) ? payload[key] : match;
    });
  }

  attemptJsError( locationEntry, shortMessage ) {


    if( locationEntry.type != 'error' ) {
      return null;
    }

    if( !locationEntry?.throwError ) {
      return null;
    }

    throw new Error( shortMessage);

  }

  getProcessIdFromClassName( diagnosticsRegistry, className) {
    const classData = diagnosticsRegistry[className];
    return classData?.meta?.process || 'unknown';
  }

  /* Log Item Storing & Management
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  storeLogItem(identity, logItem) {
    const identityString = createIdentityString(identity);
    const { mainprocessId, subprocessId } = logItem.metaData;

    // Create nested structure like the old system
    if (!this.logItems[identityString]) {
      this.logItems[identityString] = {};
    }
    
    // Create Object for mainprocess
    if (!this.logItems[identityString][mainprocessId]) {
      this.logItems[identityString][mainprocessId] = {};
    }

    // Create Object for subprocess
    if (!this.logItems[identityString][mainprocessId][subprocessId]) {
      this.logItems[identityString][mainprocessId][subprocessId] = [];
    }
    
    this.logItems[identityString][mainprocessId][subprocessId].push(logItem);
  }

  /* LogItems Submission Management
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  startSubmissionTimer() {
    this.submissionTimer = setInterval(() => {
      this.checkSubmissionConditions();
    }, 1000);
  }

  checkSubmissionConditions() {
    
    //console.log( 'checkSubmissionConditions' );

    const totalLogItems           = this.getTotalLogItemCount();
    const timeSinceLastSubmission = Date.now() - this.lastSubmission;

    // Check for idle state and return early if timer was stopped
    if (this.checkForIdleState(totalLogItems)) {
      return;
    }
  
    
    const shouldSubmitByCount     = totalLogItems >= this.submissionConfig.batchSize;
    const shouldSubmitByTime      = timeSinceLastSubmission >= this.submissionConfig.maxWaitTime;
    const hasLogItems             = totalLogItems > 0;
    
    if (hasLogItems && (shouldSubmitByCount || shouldSubmitByTime)) {
      this.submitLogItems();
    }
  }

  // Add this new method
  checkForIdleState(totalLogItems) {

    // Check if log count hasn't changed
    if (totalLogItems === this.lastLogItemCount) {
      this.unchangedCountChecks++;
    } else {
      this.unchangedCountChecks = 0; // Reset if count changed
    }
    
    this.lastLogItemCount = totalLogItems;
    
    // Stop checking if count hasn't changed for 5 consecutive checks and no items
    if (this.unchangedCountChecks >= this.maxUnchangedChecks && totalLogItems === 0) {
      clearInterval(this.submissionTimer);
      this.submissionTimer = null;
      //console.log('Submission timer stopped - no activity detected');
      return true; // Indicates timer was stopped
    }
    

    return false; // Timer continues running
  }


  getTotalLogItemCount() {
  let total = 0;
  
  for (const identityItems of Object.values(this.logItems)) {
    for (const mainProcessItems of Object.values(identityItems)) {
      for (const subProcessItems of Object.values(mainProcessItems)) {
        if (Array.isArray(subProcessItems)) {
          total += subProcessItems.length;
        }
      }
    }
  }
  
  return total;
}

  async submitLogItems() {

    if (this.getTotalLogItemCount() === 0) return;

    const logItemsToSubmit = { ...this.logItems };
    
    // Calculate the count BEFORE clearing this.logItems
    const totalItemsToSubmit = this.getTotalLogItemCount();
    
    this.logItems       = {};
    this.lastSubmission = Date.now();

    //console.log(`Submitting ${totalItemsToSubmit} log items`);
    
    // Implement your actual submission logic here
    await this.performSubmission(logItemsToSubmit);

  }

  async performSubmission(logItems) {
  

    if (this.submissionCallback && typeof this.submissionCallback === 'function') {
      this.submissionCallback(logItems);
    }
    
    // Your other submission logic here if needed (API calls, file writes, etc.)
    // console.log('Log items processed by ReportManager');
    
  }


}


class CompilationLevelReporter {

  reporterId = 'CompilationLevelReporter';
  
  constructor( config, reporterCallback ) {

    const { identity, className } = config;

    this.reporterCallback = reporterCallback;
    this.identity         = identity;
    this.className        = className;    

  }

  report( context, payload, assumedReportType ) {

    const softwareId = this.getSoftwareId( context );

    const reporterSpecificlogItemData = {
      softwareId,
    }

    const reportItem = {
      reporterId: this.reporterId,
      context,
      payload, 
      reporterSpecificlogItemData,
      assumedReportType
    }

    this.reporterCallback( reportItem );

  }

  getContext( levelIndex, methodName, locationCode ) {
    return {
      levelIndex,
      identity:     this.identity,
      className:    this.className,
      methodName, 
      locationCode,
    }
  }

  getSoftwareId( context ) {

    const levelIndex = context.levelIndex;
    const identity   = context.identity;

    switch ( levelIndex ) {
      case 1:
        return identity.frameworkId;
        break;
      case 2:
        return identity.appId;
        break;
      case 3:
        return identity.instanceId;
        break;
    }

  }

  info( levelIndex, methodName, locationCode, payload = {} ) {
    const context = this.getContext( levelIndex, methodName, locationCode );
    this.report( context, payload, 'info' );
  }

  warn( levelIndex, methodName, locationCode, payload = {} ) {
    const context = this.getContext( levelIndex, methodName, locationCode );
    this.report( context, payload, 'warn' );
  }

  error( levelIndex, methodName, locationCode, payload = {} ) {
    const context = this.getContext( levelIndex, methodName, locationCode );
    this.report( context, payload, 'error' );
  }

  success( levelIndex, methodName, locationCode, payload = {} ) {
    const context = this.getContext( levelIndex, methodName, locationCode );
    this.report( context, payload, 'success' );
  }


}


class CompilationProcessReporter {

  reporterId = 'CompilationProcessReporter';
  
  constructor( config, reporterCallback ) {

    //console.log('CompilationProcessReporter Constructed');

    const { identity, className } = config;

    this.reporterCallback = reporterCallback;
    this.identity         = identity;
    this.className        = className;    

  }

  report( context, payload, assumedReportType ) {

    const reporterSpecificlogItemData = {}

    const reportItem = {
      reporterId: this.reporterId,
      context,
      payload, 
      reporterSpecificlogItemData,
      assumedReportType
    }

    this.reporterCallback( reportItem );

  }

  getContext( methodName, locationCode ) {
    return {
      identity:     this.identity,
      className:    this.className,
      methodName, 
      locationCode,
    }
  }


  info( methodName, locationCode, payload = {} ) {
    const context = this.getContext( methodName, locationCode );
    this.report( context, payload, 'info' );
  }

  warn( methodName, locationCode, payload = {} ) {
    const context = this.getContext( methodName, locationCode );
    this.report( context, payload, 'warn' );
  }

  error( methodName, locationCode, payload = {} ) {
    const context = this.getContext( methodName, locationCode );
    this.report( context, payload, 'error' );
  }

  success( methodName, locationCode, payload = {} ) {
    const context = this.getContext( methodName, locationCode );
    this.report( context, payload, 'success' );
  }


}