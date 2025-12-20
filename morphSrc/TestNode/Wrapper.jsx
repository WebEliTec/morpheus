import { values } from "lodash"

export default function Wrapper({ _, Module, Node, Component }) {
  function handleChange( value ) {
    _.setRuntimeDataItem( 'inputValue', value );
  }
  
  const articles = _.getCoreData( 'articles' );
  
  return (
    <div className="test-node fade-in p-6 bg-gray-900 min-h-screen">
      
      {/* Top Controls */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="component-wrapper">
          <Component id="TestComponentA" />
          <Component id="TestComponentB" />
          <Component id="TestComponentC" />
          <Component id="TestComponentD" />
          <Component id="TestComponentE" />
          <Component id="TestComponentF" />
        </div>

        {/* <input 
          type="text" 
          onChange={ e => handleChange( e.target.value ) }  
          className="test-input px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-100 placeholder-gray-500"
          placeholder="Search or filter..."
        />
        <Module id="InputValueDisplay" /> */}
        <Module id="Counter" />
        <Module id="Toggler" />
        <Module id="AnotherModule" />
      </div>
      
      {/* Articles Grid */}
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-cyan-400 mb-6">
          Hacker News Feed
        </h1>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
          { articles && articles.map( (article, index) => {
            return (
              <article 
                key={index} 
                className="bg-gray-800 rounded-lg shadow-lg hover:shadow-cyan-500/20 transition-all duration-200 p-6 border border-gray-700 hover:border-cyan-500/50 flex flex-col"
              >
                {/* Title */}
                <h2 className="text-lg font-semibold text-gray-100 mb-3 hover:text-cyan-400 transition-colors line-clamp-2">
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    {article.title}
                  </a>
                </h2>
                
                {/* Date */}
                <time className="text-sm text-gray-400 mb-4">
                  {new Date(article.pubDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </time>
                
                {/* Content Snippet */}
                {article.contentSnippet && (
                  <p className="text-gray-300 text-sm mb-4 flex-grow line-clamp-3">
                    {article.contentSnippet}
                  </p>
                )}
                
                {/* Actions */}
                <div className="flex gap-3 mt-auto pt-4 border-t border-gray-700">
                  <a 
                    href={article.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Read Article
                  </a>
                  
                  <a 
                    href={article.comments} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    Comments
                  </a>
                </div>
              </article>
            )
          }) }
        </div>
        
        {/* Empty State */}
        { (!articles || articles.length === 0) && (
          <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-gray-400 text-lg">No articles yet. Loading...</p>
          </div>
        )}
      </div>
    </div>
  )
}