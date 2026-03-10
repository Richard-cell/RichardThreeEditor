import { UIPanel, UIRow, UIText, UIButton, UISelect, UIDiv } from './libs/ui.js';

function SidebarUI( editor ) {

    const container = new UIPanel();
    container.setId( 'sidebar-ui' );
    container.setBorderTop( '0' );
    container.setPaddingTop( '20px' );

    //PANEL IMAGEN
    const imagePanel = new UIPanel();
    imagePanel.setBorderTop( '0' );

    const imageRow = new UIRow();
    const imageLabel = new UIText( 'Image' ).setWidth( '90px' );

    const imagePreview = document.createElement( 'img' );
    imagePreview.style.cssText = 'width:80px;height:80px;object-fit:contain;background:#333;border:1px solid #555;display:block;';

    const imagePreviewWrapper = new UIPanel();
    imagePreviewWrapper.dom.appendChild( imagePreview );
    imagePreviewWrapper.setMarginBottom( '8px' );

    imageRow.add( imageLabel, imagePreviewWrapper );
    imagePanel.add( imageRow );

    const loadImageBtn = new UIButton( 'Load Image' );
    const clearImageBtn = new UIButton( 'Clear' );
    clearImageBtn.setMarginLeft( '4px' );

    const imgBtnRow = new UIRow();
    imgBtnRow.add( new UIText( '' ).setWidth( '90px' ), loadImageBtn, clearImageBtn );
    imagePanel.add( imgBtnRow );

    const fileInput = document.createElement( 'input' );
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild( fileInput );

    loadImageBtn.onClick( function () { fileInput.click(); } );

    fileInput.addEventListener( 'change', function () {

        const file = fileInput.files[ 0 ];
        if ( ! file ) return;

        const reader = new FileReader();
        reader.onload = function ( e ) {
            const dataURL = e.target.result;
            const object = editor.selected;
            if ( ! object || ! object.userData.isUIElement ) return;

            const loader = new THREE.TextureLoader();
            const texture = loader.load( dataURL, function () {
                object.material.needsUpdate = true;
                editor.signals.objectChanged.dispatch( object );

                if ( editor.signals.rendererUpdated ) {
                    editor.signals.rendererUpdated.dispatch();
                }

            } );
            texture.colorSpace = THREE.SRGBColorSpace;

            if ( object.material ) {
                object.material.map = texture;
                object.material.color.set( 0xffffff );
                object.material.needsUpdate = true;
            }

            object.userData.imageDataURL = dataURL;
            imagePreview.src = dataURL;
            editor.signals.objectChanged.dispatch( object );
        };

        reader.readAsDataURL( file );
        fileInput.value = '';

    } );

    clearImageBtn.onClick( function () {

        const object = editor.selected;
        if ( ! object || ! object.userData.isUIElement ) return;

        if ( object.material ) {

            object.material.map = null;
            object.material.color.set( 0xffffff );
            object.material.needsUpdate = true;

        }

        delete object.userData.imageDataURL;
        imagePreview.src = '';
        editor.signals.objectChanged.dispatch( object );

    } );

    //PANEL BOTON
    const buttonPanel = new UIPanel();
    buttonPanel.setBorderTop( '0' );

    // Evento dropdown
    const eventRow = new UIRow();
    const eventLabel = new UIText( 'On Click' ).setWidth( '90px' );
    const eventSelect = new UISelect().setWidth( '150px' );
    eventSelect.setOptions( { 'customScript': 'Custom Script' } );
    eventSelect.setValue( 'customScript' );
    eventRow.add( eventLabel, eventSelect );
    buttonPanel.add( eventRow );

    // Editor de script
    const scriptRow = new UIRow();
    scriptRow.setDisplay( 'block' );

    const scriptLabel = new UIText( 'Script' ).setWidth( '90px' ).setVerticalAlign( 'top' ).setPaddingTop( '4px' );

    const scriptArea = document.createElement( 'textarea' );
    scriptArea.style.cssText = `
        width: 100%;
        height: 120px;
        background: #1a1a1a;
        color: #eee;
        border: 1px solid #555;
        font-family: monospace;
        font-size: 11px;
        padding: 6px;
        box-sizing: border-box;
        resize: vertical;
    `;
    scriptArea.placeholder = '// Ej: console.log("clicked!");\n// scene, camera, renderer disponibles';

    const scriptWrapper = document.createElement( 'div' );
    scriptWrapper.style.cssText = 'flex:1; display:block; width: 100%;';
    scriptWrapper.appendChild( scriptArea );

    const scriptWrapperUI = new UIPanel();
    scriptWrapperUI.dom.appendChild( scriptWrapper );
    scriptWrapperUI.setWidth( '100%' );

    scriptRow.add( scriptWrapperUI );
    buttonPanel.add( scriptRow );

    scriptArea.addEventListener( 'input', function () {

        const object = editor.selected;
        if ( ! object || ! object.userData.isUIElement ) return;
        object.userData.onClickScript = scriptArea.value;

    } );

    // SWITCH PANEL SEGUN TIPO
    function showPanelFor( object ) {

        container.clear();

        if ( ! object || ! object.userData.isUIElement ) return;

        const type = object.userData.uiType;

        if ( type === 'Image' ) {

            imagePreview.src = object.userData.imageDataURL || '';
            container.add( imagePanel );

        } else if ( type === 'Button' ) {

            scriptArea.value = object.userData.onClickScript || '';
            container.add( buttonPanel );

        }

    }

    editor.signals.objectSelected.add( showPanelFor );

    return container;

}

export { SidebarUI };