export default function Root( {_} ) {

  const nodeRegistry = _.services.getNodeRegistry();

  return (
    <div className="fade-in p-4">
      <div className="morph-box w-100 p-4">
        <h2 className="dev-heading-beta mb-1">Nodes</h2>
        <p className="running-text-beta">
          Defined in <span class="path">morpheus/app.config.jsx</span> 
        </p>

      </div>
    </div>
  )
}
