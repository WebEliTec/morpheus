export default function Main( { _, Node, Module, Lucide, React } ) {

  const activeViewNodeId = _.getActiveViewNodeName();
  
  return (
    <div id="morpheus-ui">
      <Module id = "Header" />
      <div id = "morpheus-ui-view">
        { activeViewNodeId == 'CompilationLogs' && <Node id = 'CompilationLogs' />  }
        { activeViewNodeId == 'AppLiveView'     && <Node id = 'AppLiveView' />  }
        { activeViewNodeId == 'Docs'            && <Node id = 'Docs' />  }
      </div>
    </div>
  )
}