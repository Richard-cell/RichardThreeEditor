import { UITabbedPanel } from './libs/ui.js';

import { SidebarObject } from './Sidebar.Object.js';
import { SidebarGeometry } from './Sidebar.Geometry.js';
import { SidebarMaterial } from './Sidebar.Material.js';
import { SidebarScript } from './Sidebar.Script.js';
import { SidebarUI } from './Sidebar.UI.js';

function SidebarProperties( editor ) {

    const strings = editor.strings;

    const container = new UITabbedPanel();
    container.setId( 'properties' );

    container.addTab( 'objectTab', strings.getKey( 'sidebar/properties/object' ), new SidebarObject( editor ) );
    container.addTab( 'geometryTab', strings.getKey( 'sidebar/properties/geometry' ), new SidebarGeometry( editor ) );
    container.addTab( 'materialTab', strings.getKey( 'sidebar/properties/material' ), new SidebarMaterial( editor ) );
    container.addTab( 'scriptTab', strings.getKey( 'sidebar/properties/script' ), new SidebarScript( editor ) );
    container.addTab( 'uiTab', 'UI', new SidebarUI( editor ) );
    container.select( 'objectTab' );

    function getTabByTabId( tabs, tabId ) {

        return tabs.find( function ( tab ) {

            return tab.dom.id === tabId;

        } );

    }

    const geometryTab = getTabByTabId( container.tabs, 'geometryTab' );
    const materialTab = getTabByTabId( container.tabs, 'materialTab' );
    const scriptTab = getTabByTabId( container.tabs, 'scriptTab' );
    const uiTab = getTabByTabId( container.tabs, 'uiTab' );

    function toggleTabs( object ) {

        container.setHidden( object === null );

        if ( object === null ) return;

        geometryTab.setHidden( ! object.geometry );
        materialTab.setHidden( ! object.material );
        scriptTab.setHidden( object === editor.camera );

        // Mostrar pestaña UI solo para elementos UI
        uiTab.setHidden( ! object.userData.isUIElement );

        // Seleccionar pestaña UI automaticamente si es elemento UI
        if ( object.userData.isUIElement ) {

            container.select( 'uiTab' );

        } else if ( container.selected === 'uiTab' ) {

            container.select( 'objectTab' );

        } else if ( container.selected === 'geometryTab' ) {

            container.select( geometryTab.isHidden() ? 'objectTab' : 'geometryTab' );

        } else if ( container.selected === 'materialTab' ) {

            container.select( materialTab.isHidden() ? 'objectTab' : 'materialTab' );

        } else if ( container.selected === 'scriptTab' ) {

            container.select( scriptTab.isHidden() ? 'objectTab' : 'scriptTab' );

        }

    }

    editor.signals.objectSelected.add( toggleTabs );
    toggleTabs( editor.selected );

    return container;

}

export { SidebarProperties };