// Router.js

export default class Router {
  
  constructor() {
    this.listeners = new Set();
    this.isServer = typeof window === 'undefined';  // ← Add this
    
    // Only add listener on client-side
    if (!this.isServer) {  // ← Guard this
      window.addEventListener('popstate', () => {
        this.notifyListeners();
      });
    }
  }
  
  /* Get URL and Segments
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getUrl() {
    // Guard against server-side
    if (this.isServer) {
      return {
        url: '/',
        segments: []
      };
    }
    
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
    const { segments } = this.getUrl();
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

  /* Parse URL into Segments
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  
  /* Navigation
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  navigate(path) {
    if (this.isServer) return;
    
    // Ensure path starts with '/'
    const absolutePath = path.startsWith('/') ? path : `/${path}`;
    
    window.history.pushState({}, '', absolutePath);
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

}

/* Pattern Matching Helpers
/* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

export function shouldModuleRerender(subscription, currentRoute) {
  if (!subscription || subscription === false) {
    return false;
  }
  
  if (subscription === true) {
    return true;
  }
  
  if (typeof subscription === 'string') {
    return matchPattern(subscription, currentRoute);
  }
  
  if (Array.isArray(subscription)) {
    return subscription.some(pattern => matchPattern(pattern, currentRoute));
  }
  
  return false;
}

export function matchPattern(pattern, route) {
  if (pattern === route) {
    return true;
  }
  
  if (pattern.includes('*')) {
    const prefix = pattern.replace('*', '');
    return route.startsWith(prefix);
  }
  
  if (pattern.includes(':')) {
    const patternSegments = pattern.split('/').filter(s => s);
    const routeSegments = route.split('/').filter(s => s);
    
    if (patternSegments.length !== routeSegments.length) {
      return false;
    }
    
    return patternSegments.every((seg, i) => {
      return seg.startsWith(':') || seg === routeSegments[i];
    });
  }
  
  return false;
}