const config = {


  /* Core Data
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  coreData: {

    menuItems: {
      home: {
        label: 'Home',
        route: '/home'
      }, 

      contentSystem: {
        label: 'Content System',
        route: '/content-system'
      }, 

    }, 

  }, 

  metaData: {
    title: 'Test'
  },

  /* Signals
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  signals: {
    selectedMenuItem: {
      type:    'primitive', 
      default: 'home'
    },
  }, 

  /* Module Registry
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  modules: {

    MainMenu: {
      isRoot:  true,
      routes:  true,  
      signals: ['selectedMenuItem'], 
    }

  },

  /* Kernel
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  kernel: {

    /* Menu Item Management
    /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

    getActiveMenuItem() {
      const currentRoute      = this.router.getSegment(1);
      const currentRouteCamel = this.utility.toCamelCase( currentRoute || 'home' );
      return currentRouteCamel;
    },

    getMenuItems() {
      return this.getCoreDataItem('menuItems');
    },
    
    /* Navigation
    /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */
    navigate( menuItemId ) {

      console.log( Date.now() );
      
      const menuItems = this.getCoreDataItem('menuItems');
      const menuItem  = menuItems[ menuItemId ];
      
      if (!menuItem) {
        console.warn(`[Menu] Menu item "${menuItemId}" not found`);
        return;
      }
      
      this.setSignal('selectedMenuItem', menuItemId);
      
      this.router.navigate(menuItem.route);
    },

    sayHi() {
      console.log('Hello from Foreign Node!');
    },

    getData( value ) {
      return value;
    }


  },

  /* Hooks
  /* *** *** *** *** *** *** *** *** *** *** *** *** *** *** */

  hooks: {

    kernelDidMount (kernel, props) {
      
      const nodeProps = props[0] || {};
          
      if (nodeProps.menuItems) {
        kernel.coreData.menuItems = nodeProps.menuItems;
      }

    }
  },

}
export default config;



export function MainMenu( { _ } ) {
  
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