// services/ServiceClass.js
class ServiceClass {

  constructor(apis) {

    this.apis     = apis;
    this.isReady  = this.initialize();

  }
  
  async initialize() {

    await this.fetchArticles();

  }


  async fetchArticles() {
     try {
      const res = await fetch( "https://n8n.srv1194794.hstgr.cloud/webhook/24eb5680-e280-4fde-9350-47c5b037a2b1" );
      
      if (!res.ok) {
        console.error('Fetch failed:', res.status, res.statusText);
        return;
      }

      this.articles = await res.json();

    } catch (error) {

      console.error('Error fetching RSS:', error);

    }
  }
  
  getArticles() {
    return this.articles;
  }

  async whenReady() {
    await this.isReady;
    return this;
  }

}

export default ServiceClass;