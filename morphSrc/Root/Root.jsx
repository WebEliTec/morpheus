import '../globals.scss';

export default function Root({ Kernel, Node, Module, Router }) {
  return (
    <div className="fade-in">
      <Node id="MainMenu" />
      <Node id="SideBar" />
      <Node id="Main" />
    </div>
  );
}