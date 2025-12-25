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
      <Node id="IndexedDBTester"/>
      
      <div className="p-4">
        <h2 className="heading-alpha mb-6">kernelDIDChange Tester</h2>
        <button class="morph-button mb-16" onClick = { () => toggleArticles() } onMouseEnter = { handleMouseEnter } >
          Toggle Article
        </button>
        {shouldShowArticles && <Node id="Articles" />}
      </div>

    </div>
  );
}