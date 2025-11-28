export default function Wrapper( {_} ) {
  
  const menuItems      = _.getMenuItems();
  const menuItemIds    = Object.keys( menuItems );
  const activeMenuItem = _.getActiveMenuItem();
  
  return (
    <div className={`morph-menu`}>

      <div className="morph-menu-overlay"></div>

      <div className="morph-menu-inner">
        {menuItemIds.map((menuItemId) => {

          const item     = menuItems[menuItemId];
          const label    = item.label;
          const isActive = activeMenuItem === menuItemId;

          return (
            <div className={`morph-menu-item ${isActive ? 'active' : ''}`} key={menuItemId} onClick={() => _.navigate(menuItemId)}>
              {label}
            </div>
          );
        })}
      </div>

      
    </div>
  )
}