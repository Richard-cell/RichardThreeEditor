import * as THREE from 'three';

class UISelectionOutline {

    constructor( scene ) {

        this.scene = scene;
        this._outline = null;

    }

    show( object ) {

        this.hide();

        // Obtener el tamaño del objeto
        const box = new THREE.Box3().setFromObject( object );
        const size = new THREE.Vector3();
        box.getSize( size );

        // Crear borde alrededor del objeto
        const geometry = new THREE.EdgesGeometry( new THREE.PlaneGeometry( size.x, size.y ) );
        const material = new THREE.LineBasicMaterial( {
            color: 0x00aaff,
            depthTest: false,
            transparent: true,
            opacity: 1
        } );

        this._outline = new THREE.LineSegments( geometry, material );
        this._outline.position.copy( object.position );
        this._outline.position.z = 0.002; // Encima del objeto
        this._outline.renderOrder = 999;

        this.scene.add( this._outline );

    }

    // Actualizar posicion cuando el objeto se mueve
    updatePosition( position ) {

        if ( this._outline ) {

            this._outline.position.x = position.x;
            this._outline.position.y = position.y;

        }

    }

    hide() {

        if ( this._outline ) {

            this.scene.remove( this._outline );
            this._outline.geometry.dispose();
            this._outline.material.dispose();
            this._outline = null;

        }

    }

}

export { UISelectionOutline };