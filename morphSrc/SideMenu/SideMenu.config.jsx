const config = {

  //parentId: 'MenuDelta',
  

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

  moduleRegistry: {

    SideMenu: {
      isRoot:  true,
      routes:  true,  
      signals: ['selectedMenuItem']
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
      
      const menuItems = this.getCoreDataItem('menuItems');
      const menuItem  = menuItems[ menuItemId ];
      
      if (!menuItem) {
        console.warn(`[Menu] Menu item "${menuItemId}" not found`);
        return;
      }
      
      // Update signal
      this.setSignal('selectedMenuItem', menuItemId);
      
      // Navigate using Router
      this.router.navigate(menuItem.route);
    },


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