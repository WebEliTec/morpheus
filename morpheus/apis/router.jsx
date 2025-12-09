// Router.js

export default class Router {
  
  constructor() {
    this.listeners         = new Set();
    this.willNavigateHooks = new Map();
    this.didNavigateHooks  = new Map();
  }
  
  /* Get URL 
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getUrl() {
    
    const url = window.location.pathname;
    
    return {
      url: url,
      segments: this.parseSegments(url)
    };
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
  executeNavigationHooks(type, previousUrl, newUrl) {
    const registry = type === 'willNavigate' ? this.willNavigateHooks : this.didNavigateHooks;
    
    // Convert to array and sort by priority (lower first)
    const sortedHooks = Array.from(registry.values())
      .sort((a, b) => a.priority - b.priority);
    
    for (const hookConfig of sortedHooks) {
      try {
        hookConfig.callback(hookConfig.kernel, previousUrl, newUrl);
      } catch (error) {
        console.error(`[Router] Error in ${type} hook:`, error);
      }
    }
  }
  
  /* Segment Retrieval
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getSegment(index = 1, defaultValue = null) {
    const adjustedIndex = index -1;
    const { segments }  = this.getUrl();
    return segments[adjustedIndex] || defaultValue;
  }  

  /* Segment Existence & Comparison
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  isSegmentSet(index) {
    const segment = this.getSegment(index);  // Reuse your getSegment logic
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
    
    this.executeNavigationHooks('willNavigate', previousUrl, absolutePath);
    
    window.history.pushState({}, '', absolutePath);
    
    this.executeNavigationHooks('didNavigate', previousUrl, absolutePath);
    
    this.notifyListeners();
  }
  
  /* Subscription SYSTEM
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  notifyListeners() {
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

