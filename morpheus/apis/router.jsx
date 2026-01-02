// Router.js
export default class Router {
  
  constructor() {
    this.listeners         = new Set();
    this.willNavigateHooks = new Map();
    this.didNavigateHooks  = new Map();
  }
  
  /* Get URL 
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getUrlInfo() {
    const url = window.location.pathname;
    
    return {
      url: url,
      segments: this.parseSegments(url)
    };
  }

  getUrl() {
    return window.location.pathname;
  }
  
  /* Hook Registration
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  registerNavigationHook(type, kernelId, hookConfig) {
    const registry = type === 'willNavigate' ? this.willNavigateHooks : this.didNavigateHooks;
    registry.set(kernelId, hookConfig);
  }
  
  unregisterNavigationHooks(kernelId) {
    this.willNavigateHooks.delete(kernelId);
    this.didNavigateHooks.delete(kernelId);
  }
  
  /* Hook Execution
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  executeWillNavigateHooks(previousUrl, newUrl) {
    const sortedHooks = Array.from(this.willNavigateHooks.values())
      .sort((a, b) => a.priority - b.priority);
    
    for (const hookConfig of sortedHooks) {
      try {
        const result = hookConfig.callback(hookConfig.kernel, previousUrl, newUrl);
        if (result === false) {
          console.log(`[Router] Navigation to "${newUrl}" cancelled by node "${hookConfig.kernel.nodeId}"`);
          return false;
        }
      } catch (error) {
        console.error(`[Router] Error in willNavigate hook:`, error);
      }
    }
    return true;
  }
  
  executeDidNavigateHooks(previousUrl, newUrl) {
    const sortedHooks = Array.from(this.didNavigateHooks.values())
      .sort((a, b) => a.priority - b.priority);
    
    for (const hookConfig of sortedHooks) {
      try {
        hookConfig.callback(hookConfig.kernel, previousUrl, newUrl);
      } catch (error) {
        console.error(`[Router] Error in didNavigate hook:`, error);
      }
    }
  }
  
  /* Segment Retrieval
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getSegment(index = 1, defaultValue = null) {
    const adjustedIndex = index - 1;
    const { segments }  = this.getUrl();
    return segments[adjustedIndex] || defaultValue;
  }
  
  /* Segment Existence & Comparison
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  isSegmentSet(index) {
    const segment = this.getSegment(index);
    return segment !== null && segment !== undefined;
  }
  
  isSegmentEqualTo(index, string) {
    const segment = this.getSegment(index);
    return segment === string;
  }
  
  doesSegmentInclude(index, string) {
    const segment = this.getSegment(index);
    return segment ? segment.includes(string) : false;
  }
  
  hasSegments(count) {
    const { segments } = this.getUrl();
    return segments.length >= count;
  }
  
  getSegmentCount() {
    const { segments } = this.getUrl();
    return segments.length;
  }
  
  /* Navigation
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  navigate(path) {

    const previousUrl  = this.getUrl().url;
    const absolutePath = path.startsWith('/') ? path : `/${path}`;
    
    // Execute willNavigate hooks - can cancel navigation
    const shouldNavigate = this.executeWillNavigateHooks(previousUrl, absolutePath);
    if (!shouldNavigate) {
      return false;
    }
    
    // Update URL
    window.history.pushState({}, '', absolutePath);
    
    // Execute didNavigate hooks
    this.executeDidNavigateHooks(previousUrl, absolutePath);
    
    // Notify module listeners (existing reactivity system)
    this.notifyListeningNodes();
    
    return true;

  }
  
  /* Subscription System
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeningNodes() {
    const currentRoute = this.getUrl().url;
    this.listeners.forEach(cb => cb(currentRoute));
  }
  
  parseSegments(url) {
    return url.split('/').filter(segment => segment.length > 0);
  }
  
  /* Route Checks
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  isHome() {
    const { segments } = this.getUrl();
    return segments.length === 0;
  }
  
  toHome() {
    this.navigate('/');
  }
}