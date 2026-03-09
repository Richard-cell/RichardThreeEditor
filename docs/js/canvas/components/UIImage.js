import * as THREE from 'three';

class UIImage {

    static create() {
        const geometry = new THREE.PlaneGeometry( 0.2, 0.2 );
        const material = new THREE.MeshBasicMaterial( {
            color: 0xffffff,
            side: THREE.DoubleSide
        } );

        const image = new THREE.Mesh( geometry, material );
        image.name = 'Image';
        image.userData.isUIElement = true;
        image.userData.uiType = 'Image';
        image.position.set( 0, 0, 0.001 );
        image.layers.set(1);

        return image;

    }

}

export { UIImage };