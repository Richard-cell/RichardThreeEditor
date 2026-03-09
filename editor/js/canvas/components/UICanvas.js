import * as THREE from 'three';

class UICanvas {
    static create(camera){
        const canvas = new THREE.Group();
        canvas.name = 'MainCanvas';

        canvas.userData.isCanvas = true;
        canvas.userData.renderMode = 'ScreenSpaceCamera';

        canvas.position.set(0, 0, -1);
        canvas.layers.set(1); // Asegura que el canvas esté en la capa 1 para renderizar con la cámara de UI

        return canvas;
    }

    static getAll( scene ) {

        const canvases = [];

        scene.traverse( function ( child ) {

            if ( child.userData.isCanvas === true ) canvases.push( child );

        } );

        return canvases;

    }

    static getFirst( scene ) {

        const canvases = UICanvas.getAll( scene );
        return canvases.length > 0 ? canvases[ 0 ] : null;

    }
    
}

export { UICanvas };