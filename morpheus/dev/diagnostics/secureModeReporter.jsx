export default class SecureModeReporter {
  
  static instance = null;

  constructor() {
    
    if ( SecureModeReporter.instance) {
      return MorpheusDiagnostics.instance;
    }

     SecureModeReporter.instance = this;

     //console.log( 'SecureModeReporter Active' );

  }

  static getInstance() {
    if (!SecureModeReporter.instance) {
      SecureModeReporter.instance = new SecureModeReporter();
    } 
    return SecureModeReporter.instance;
  }

  info() {
    console.log('Some Info received by SecureModeReporter');
  }

  success() {
    console.log('Some Success received by SecureModeReporter');
  }


}