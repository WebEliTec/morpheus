// apis/graph.jsx
export default class Graph {
  
  constructor() {
    this.graphData = null; 
  }

  _setGraphData(graphData) {
    this.graphData = graphData;  
  }

  get nodeHierarchy() {
    return this.graphData?.nodeHierarchy || null;
  }

  get rootNode() {
    return this.graphData?.rootNode || null;
  }

  showGraph() {
    console.log(this.nodeHierarchy); 
  }
}