// singularityEngine.js
export default class SingularityEngine {
  constructor() {
    if (!!SingularityEngine.instance) {
      return SingularityEngine.instance;
    }
    
    SingularityEngine.instance = this;
    this.cccApiUrl = "http://127.0.0.1:8000/api/";
    this.contentClasses = null;
    
    // Store the promise so consumers can await it
    this.ready = this.init();
    
    return this;
  }
  
  async init() {
    await this.retrieveContentClasses();
  }
  
  async retrieveContentClasses() {
    try {
      const response = await fetch(`${this.cccApiUrl}content_classes_all`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // response.json() automatically parses JSON
      const data = await response.json();
      
      // If data is STILL a string (double-encoded), parse again:
      if (typeof data === 'string') {
        this.contentClasses = JSON.parse(data);
      } else {
        this.contentClasses = data;
      }
      
      return this.contentClasses;
    } catch (error) {
      console.error('Error fetching all content classes:', error);
      throw error;
    }
  }
  
  getContentClasses() {
    return this.contentClasses;
  }
}