import * as THREE from 'three';

class UIScaleHandles {

    constructor( scene ) {

        this.scene = scene;
        this._group = null;
        this._handleSize = 0.05;
        this._handles = [];
        this._objectSize = new THREE.Vector2();

    }

    _getObjectSize( object ) {

        const geo = object.geometry;
        if ( geo ) {

            geo.computeBoundingBox();
            const box = geo.boundingBox.clone();
            const size = new THREE.Vector3();
            box.getSize( size );
            return new THREE.Vector2(
                size.x * object.scale.x,
                size.y * object.scale.y
            );

        }

        return new THREE.Vector2( 0.2, 0.1 );

    }

    show( object ) {

        this.hide();

        const size = this._getObjectSize( object );
        const hw = size.x / 2;
        const hh = size.y / 2;

        this._group = new THREE.Group();
        this._group.position.set( object.position.x, object.position.y, 0.004 );

        const corners = [
            { name: 'TL', x: - hw, y:   hh },
            { name: 'TR', x:   hw, y:   hh },
            { name: 'BL', x: - hw, y: - hh },
            { name: 'BR', x:   hw, y: - hh },
        ];

        this._handles = [];

        corners.forEach( ( corner ) => {

            const geo = new THREE.PlaneGeometry( this._handleSize, this._handleSize );
            const mat = new THREE.MeshBasicMaterial( {
                color: 0xffffff,
                depthTest: false,
                side: THREE.DoubleSide
            } );

            const handle = new THREE.Mesh( geo, mat );
            handle.position.set( corner.x, corner.y, 0 );
            handle.renderOrder = 1002;
            handle.userData.isScaleHandle = true;
            handle.userData.corner = corner.name;

            const edgeGeo = new THREE.EdgesGeometry( geo );
            const edgeMat = new THREE.LineBasicMaterial( { color: 0x00aaff, depthTest: false } );
            const edge = new THREE.LineSegments( edgeGeo, edgeMat );
            edge.renderOrder = 1003;
            handle.add( edge );

            this._group.add( handle );
            this._handles.push( handle );

        } );

        this.scene.add( this._group );

    }

    update( object ) {

        if ( ! this._group ) return;

        const size = this._getObjectSize( object );
        const hw = size.x / 2;
        const hh = size.y / 2;

        this._group.position.set( object.position.x, object.position.y, 0.004 );

        const positions = {
            'TL': { x: - hw, y:   hh },
            'TR': { x:   hw, y:   hh },
            'BL': { x: - hw, y: - hh },
            'BR': { x:   hw, y: - hh },
        };

        this._handles.forEach( ( handle ) => {

            const pos = positions[ handle.userData.corner ];
            if ( pos ) handle.position.set( pos.x, pos.y, 0 );

        } );

    }

    hitTest( raycaster ) {

        if ( ! this._group || this._handles.length === 0 ) return null;

        const intersects = raycaster.intersectObjects( this._handles, false );
        if ( intersects.length > 0 ) {

            return intersects[ 0 ].object.userData.corner;

        }

        return null;

    }

    hide() {

        if ( this._group ) {

            this.scene.remove( this._group );
            this._group = null;
            this._handles = [];

        }

    }

}

export { UIScaleHandles };