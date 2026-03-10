import * as THREE from 'three';

class UITransformGizmo {

    constructor( scene ) {

        this.scene = scene;
        this._group = null;
        this._visible = false;

    }

    show( object ) {

        this.hide();

        this._group = new THREE.Group();
        this._group.position.copy( object.position );
        this._group.position.z = 0.003;

        // ── Flecha X (roja) → apunta a la derecha ──
        const arrowX = this._createArrow( 0xff3333 );
        arrowX.rotation.z = - Math.PI / 2;
        arrowX.position.set( 0, 0, 0 ); // ← sin offset, arranca del centro
        arrowX.userData.gizmoAxis = 'X';
        this._group.add( arrowX );

        // ── Flecha Y (verde) → apunta hacia arriba ──
        const arrowY = this._createArrow( 0x33ff33 );
        arrowY.position.set( 0, 0, 0 ); // ← sin offset, arranca del centro
        arrowY.userData.gizmoAxis = 'Y';
        this._group.add( arrowY );

        // ── Cuadro central XY (azul) ──
        const centerGeo = new THREE.PlaneGeometry( 0.04, 0.04 );
        const centerMat = new THREE.MeshBasicMaterial( {
            color: 0x4a90d9,
            transparent: true,
            opacity: 0.9,
            depthTest: false,
            side: THREE.DoubleSide
        } );
        const center = new THREE.Mesh( centerGeo, centerMat );
        center.userData.gizmoAxis = 'XY';
        center.renderOrder = 1001;
        this._group.add( center );

        this.scene.add( this._group );
        this._visible = true;

    }

    _createArrow( color ) {

        const group = new THREE.Group();

        
        const points = [
            new THREE.Vector3( 0, 0.02, 0 ),
            new THREE.Vector3( 0, 0.12, 0 )
        ];
        const lineGeo = new THREE.BufferGeometry().setFromPoints( points );
        const lineMat = new THREE.LineBasicMaterial( { color, depthTest: false } );
        const line = new THREE.Line( lineGeo, lineMat );
        line.renderOrder = 1000;
        group.add( line );

        const coneGeo = new THREE.ConeGeometry( 0.012, 0.035, 8 );
        const coneMat = new THREE.MeshBasicMaterial( { color, depthTest: false } );
        const cone = new THREE.Mesh( coneGeo, coneMat );
        cone.position.y = 0.1;
        cone.renderOrder = 1000;
        group.add( cone );

        return group;

    }

    updatePosition( position ) {

        if ( this._group ) {

            this._group.position.x = position.x;
            this._group.position.y = position.y;

        }

    }

    hitTest( raycaster ) {

        if ( ! this._group ) return null;

        const meshes = [];
        this._group.traverse( ( child ) => {

            if ( child.isMesh ) meshes.push( child );

        } );

        const intersects = raycaster.intersectObjects( meshes );
        if ( intersects.length > 0 ) {

            let obj = intersects[ 0 ].object;
            while ( obj && ! obj.userData.gizmoAxis ) obj = obj.parent;
            return obj ? obj.userData.gizmoAxis : null;

        }

        return null;

    }

    hide() {

        if ( this._group ) {

            this.scene.remove( this._group );
            this._group = null;
            this._visible = false;

        }

    }

    get visible() { return this._visible; }

}

export { UITransformGizmo };