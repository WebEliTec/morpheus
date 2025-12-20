import '../globals.scss';

export default function Root({ Kernel, Node, Module, Router }) {
  const shouldShowArticles = Kernel.shouldShowArticles();

  const toggleArticles = () => {
    Kernel.toggleArticles();
  };

  const handleMouseEnter = () => {
    console.log('Preload!');
    Kernel.preloadNode('Articles');
  };

  return (
    <div className="fade-in">
      <Node id="MainMenu" />
      <Node id="SideBar" />
      <Node id="NodeEcho" />
      <Node id="TestNode" />
      
      <button onClick = { () => toggleArticles() } onMouseEnter = { handleMouseEnter } >
        Toggle Articles
      </button>
      
      {shouldShowArticles && <Node id="Articles" />}
    </div>
  );
}