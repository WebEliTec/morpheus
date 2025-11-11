// apis/graph.jsx
export default class Graph {
  
  constructor() {
    this.graphData = null;  // ✅ Will hold reference to GraphManager's object
  }

  _setGraphData(graphData) {
    this.graphData = graphData;  // ✅ Store the reference
  }

  get nodeHierarchy() {
    return this.graphData?.nodeHierarchy || null;
  }

  get rootNode() {
    return this.graphData?.rootNode || null;
  }

  showGraph() {
    console.log(this.nodeHierarchy);  // ✅ Always current!
  }
}