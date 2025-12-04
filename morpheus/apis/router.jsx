// Router.js

export default class Router {
  
  constructor() {
    this.listeners             = new Set();
    this.nodeOnNavigationHooks = {}
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
  
  /* Segment Retrieval
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getSegment(index = 1, defaultValue = null) {
    const adjustedIndex = index -1;
    const { segments }  = this.getUrl();
    return segments[adjustedIndex] || defaultValue;
  }

  getFirstSegment() {
    return this.getSegment( 1 );
  }

  getSecondSegment() {
    return this.getSegment( 2 );
  }

  getThirdSegment() {
    return this.getSegment( 3 );
  }

  getFourthSegment() {
    return this.getSegment( 4 );
  }

  getFifthSegment() {
    return this.getSegment( 5 );
  }

  getSixthSegment() {
    return this.getSegment( 6 );
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
    const absolutePath = path.startsWith('/') ? path : `/${path}`;
    window.history.pushState({}, '', absolutePath);
    //this.triggerOnNavigationHook();

    this.triggerNodeNavigationHooks();
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

  /* Hook System
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  triggerNodeNavigationHooks() {
    
    const currentRoute = this.getUrl().url;
    
    Object.values(this.nodeOnNavigationHooks).forEach(hookFn => {
      try {
        hookFn(currentRoute);  // Call each node's onNavigation hook
      } catch (error) {
        console.error('[Router] Error in node onNavigation hook:', error);
      }
    });
  }

}

