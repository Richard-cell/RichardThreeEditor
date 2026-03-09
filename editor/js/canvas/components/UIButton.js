import * as THREE from 'three';

class UIButton {

    static create() {
        const geometry = new THREE.PlaneGeometry( 0.2, 0.08 );
        const material = new THREE.MeshBasicMaterial( { color: 0x666666 } );

        const button = new THREE.Mesh( geometry, material );
        button.name = 'Button';
        button.userData.isUIElement = true;
        button.userData.uiType = 'Button';
        button.position.set( 0, 0, 0.001 );
        button.layers.set( 1 );

        return button;

    }

}

export { UIButton };