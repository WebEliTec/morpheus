// Router.js

// Router.js

export class Router_I {
  
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

  getFullUrl() {
    if (this.isServer) return '/';
    return window.location.href;
  }

  getOrigin() {
    if (this.isServer) return '';
    return window.location.origin;
  }

  getProtocol() {
    if (this.isServer) return 'https:';
    return window.location.protocol;
  }

  getHost() {
    if (this.isServer) return '';
    return window.location.host;
  }
  
  /* Segment Retrieval
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getSegment(index = 0, defaultValue = null) {

    const addedIndex = index - 1;

    const { segments } = this.getUrl();
    return segments[addedIndex ] || defaultValue;
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

  getLastSegment() {
    const segments = this.getUrl().segments;
    return segments[segments.length - 1] || null;
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

  /* Query String Handling
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  getQuery() {
    if (this.isServer) return {};
    
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params);
  }

  getQueryParam(key, defaultValue = null) {
    const query = this.getQuery();
    return query[key] || defaultValue;
  }

  hasQueryParam(key) {
    const query = this.getQuery();
    return key in query;
  }

  setQueryParam(key, value) {
    if (this.isServer) return;
    
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url.toString());
    this.notifyListeners();
  }

  removeQueryParam(key) {
    if (this.isServer) return;
    
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url.toString());
    this.notifyListeners();
  }

  setQueryParams(paramsObject) {
    if (this.isServer) return;
    
    const url = new URL(window.location);
    Object.entries(paramsObject).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    window.history.pushState({}, '', url.toString());
    this.notifyListeners();
  }

  clearQuery() {
    if (this.isServer) return;
    
    const url = new URL(window.location);
    url.search = '';
    window.history.pushState({}, '', url.toString());
    this.notifyListeners();
  }

  navigateWithQuery(path, queryParams = {}) {
    if (this.isServer) return;
    
    const url = new URL(path, window.location.origin);
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    window.history.pushState({}, '', url.toString());
    this.notifyListeners();
  }


  /* Hash/Fragment Handling
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  getHash() {
    if (this.isServer) return '';
    return window.location.hash.slice(1); // Remove #
  }

  setHash(hash) {
    if (this.isServer) return;
    window.location.hash = hash;
  }

  /* Route Matching
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  matchesPattern(pattern) {
    const currentRoute = this.getUrl().url;
    return matchPattern(pattern, currentRoute);
  }

  isRoute(exactPath) {
    const { url } = this.getUrl();
    return url === exactPath;
  }

  startsWithRoute(prefix) {
    const { url } = this.getUrl();
    return url.startsWith(prefix);
  }

  // Extract params from dynamic routes
  extractParams(pattern) {
    const currentRoute = this.getUrl().url;
    
    if (!pattern.includes(':')) return {};
    
    const patternSegments = pattern.split('/').filter(s => s);
    const routeSegments = currentRoute.split('/').filter(s => s);
    
    if (patternSegments.length !== routeSegments.length) {
      return null;
    }
    
    const params = {};
    patternSegments.forEach((seg, i) => {
      if (seg.startsWith(':')) {
        const paramName = seg.slice(1);
        params[paramName] = routeSegments[i];
      }
    });
    
    return params;
  }

  
  /* Navigation
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  navigate(path) {
    if (this.isServer) return;  // ← Guard this
    
    window.history.pushState({}, '', path);
    this.notifyListeners();
  }

  /* Navigation Controls
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  back() {
    if (this.isServer) return;
    window.history.back();
  }

  forward() {
    if (this.isServer) return;
    window.history.forward();
  }

  replace(path) {
    if (this.isServer) return;
    
    window.history.replaceState({}, '', path);
    this.notifyListeners();
  }

  reload() {
    if (this.isServer) return;
    window.location.reload();
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


  scrollToTop() {
    if (this.isServer) return;
    window.scrollTo(0, 0);
  }

  scrollToHash() {
    if (this.isServer) return;
    const hash = this.getHash();
    if (hash) {
      const element = document.getElementById(hash);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
}

}


export class Router_II {
  
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

  getFullUrl() {
    if (this.isServer) return '/';
    return window.location.href;
  }

  getOrigin() {
    if (this.isServer) return '';
    return window.location.origin;
  }

  getProtocol() {
    if (this.isServer) return 'https:';
    return window.location.protocol;
  }

  getHost() {
    if (this.isServer) return '';
    return window.location.host;
  }
  
  /* Segment Retrieval
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  getSegment(index = 0, defaultValue = null) {

    const addedIndex = index - 1;

    const { segments } = this.getUrl();
    return segments[addedIndex ] || defaultValue;
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

  getLastSegment() {
    const segments = this.getUrl().segments;
    return segments[segments.length - 1] || null;
  }
  
  /* Segment Existence & Comparison
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  isSegmentSet(index) {
    const { segments } = this.getUrl();
    return index >= 0 && index < segments.length && segments[index] !== undefined;
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

  /* Query String Handling
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  getQuery() {
    if (this.isServer) return {};
    
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params);
  }

  getQueryParam(key, defaultValue = null) {
    const query = this.getQuery();
    return query[key] || defaultValue;
  }

  hasQueryParam(key) {
    const query = this.getQuery();
    return key in query;
  }

  setQueryParam(key, value) {
    if (this.isServer) return;
    
    const url = new URL(window.location);
    url.searchParams.set(key, value);
    window.history.pushState({}, '', url.toString());
    this.notifyListeners();
  }

  removeQueryParam(key) {
    if (this.isServer) return;
    
    const url = new URL(window.location);
    url.searchParams.delete(key);
    window.history.pushState({}, '', url.toString());
    this.notifyListeners();
  }

  setQueryParams(paramsObject) {
    if (this.isServer) return;
    
    const url = new URL(window.location);
    Object.entries(paramsObject).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    window.history.pushState({}, '', url.toString());
    this.notifyListeners();
  }

  clearQuery() {
    if (this.isServer) return;
    
    const url = new URL(window.location);
    url.search = '';
    window.history.pushState({}, '', url.toString());
    this.notifyListeners();
  }

  navigateWithQuery(path, queryParams = {}) {
    if (this.isServer) return;
    
    const url = new URL(path, window.location.origin);
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    window.history.pushState({}, '', url.toString());
    this.notifyListeners();
  }


  /* Hash/Fragment Handling
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  getHash() {
    if (this.isServer) return '';
    return window.location.hash.slice(1); // Remove #
  }

  setHash(hash) {
    if (this.isServer) return;
    window.location.hash = hash;
  }

  /* Route Matching
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  matchesPattern(pattern) {
    const currentRoute = this.getUrl().url;
    return matchPattern(pattern, currentRoute);
  }

  isRoute(exactPath) {
    const { url } = this.getUrl();
    return url === exactPath;
  }

  startsWithRoute(prefix) {
    const { url } = this.getUrl();
    return url.startsWith(prefix);
  }

  // Extract params from dynamic routes
  extractParams(pattern) {
    const currentRoute = this.getUrl().url;
    
    if (!pattern.includes(':')) return {};
    
    const patternSegments = pattern.split('/').filter(s => s);
    const routeSegments = currentRoute.split('/').filter(s => s);
    
    if (patternSegments.length !== routeSegments.length) {
      return null;
    }
    
    const params = {};
    patternSegments.forEach((seg, i) => {
      if (seg.startsWith(':')) {
        const paramName = seg.slice(1);
        params[paramName] = routeSegments[i];
      }
    });
    
    return params;
  }

  
  /* Navigation
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  navigate(path) {
    if (this.isServer) return;  // ← Guard this
    
    window.history.pushState({}, '', path);
    this.notifyListeners();
  }

  /* Navigation Controls
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
  back() {
    if (this.isServer) return;
    window.history.back();
  }

  forward() {
    if (this.isServer) return;
    window.history.forward();
  }

  replace(path) {
    if (this.isServer) return;
    
    window.history.replaceState({}, '', path);
    this.notifyListeners();
  }

  reload() {
    if (this.isServer) return;
    window.location.reload();
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


  scrollToTop() {
    if (this.isServer) return;
    window.scrollTo(0, 0);
  }

  scrollToHash() {
    if (this.isServer) return;
    const hash = this.getHash();
    if (hash) {
      const element = document.getElementById(hash);
      element?.scrollIntoView({ behavior: 'smooth' });
    }
}

}
