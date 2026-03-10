/* eslint-disable padded-blocks */
/* eslint-disable no-trailing-spaces */
/* eslint-disable eol-last */
/* eslint-disable no-multi-spaces */
/* eslint-disable indent */
import * as THREE from 'three';
import { UIPanel } from '../libs/ui.js';
import { UISelectionOutline } from './UISelectionOutline.js';
import { UITransformGizmo } from './UITransformGizmo.js';
import { UIScaleHandles } from './UIScaleHandles.js';


class UICanvasViewport {

    constructor( editor ) {

        this.editor = editor;
        this._zoom = 1;
        this._pan = { active: false, start: new THREE.Vector2() };
        this._drag = { active: false, object: null, startMouse: new THREE.Vector2(), startPos: new THREE.Vector3() };
        this._raycaster = new THREE.Raycaster();
        this._mouse = new THREE.Vector2();
        this._cloneMap = new Map();
        this._selectedClone = null;
        this._activeGizmoAxis = null;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x1a1a1a );

        this._outline = new UISelectionOutline( this.scene );
        this._gizmo = new UITransformGizmo( this.scene );
        this._scaleHandles = new UIScaleHandles( this.scene );
        this._activeCorner = null;
        this._scaleStartMouse = new THREE.Vector2();
        this._scaleStartScale = new THREE.Vector3();
        this._scaleStartSize = new THREE.Vector3();

        this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0.1, 10 );
        this.camera.position.set( 0, 0, 5 );
        this.camera.lookAt( 0, 0, 0 );
        this.camera.layers.enableAll();
        this._raycaster.layers.enableAll();

        this.renderer = new THREE.WebGLRenderer( { antialias: true } );
        this.renderer.setPixelRatio( 1 );

        const gridHelper = new THREE.GridHelper( 20, 200, 0x444444, 0x333333 );
        gridHelper.rotation.x = Math.PI / 2;
        this.scene.add( gridHelper );

        const aspect = 16 / 9;
        const borderGeometry = new THREE.EdgesGeometry( new THREE.PlaneGeometry( aspect * 2, 2 ) );
        const borderMaterial = new THREE.LineBasicMaterial( { color: 0x4a90d9 } );
        this._border = new THREE.LineSegments( borderGeometry, borderMaterial );
        this.scene.add( this._border );

        this.container = new UIPanel();
        this.container.setId( 'canvas-viewport' );
        this.container.dom.style.overflow = 'hidden';
        this.container.dom.appendChild( this.renderer.domElement );

        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';

        this._initControls();

        // Señales
        editor.signals.objectSelected.add( ( object ) => {

            if ( object && object.userData.isUIElement === true ) {

                const clone = this._cloneMap.get( object.uuid );
                if ( clone ) {

                    this._selectedClone = clone;
                    this._outline.show( clone );
                    this._gizmo.show( clone );
                    this._scaleHandles.show( clone );
                    this.render();

                }

            } else {

                this._selectedClone = null;
                this._outline.hide();
                this._gizmo.hide();
                this._scaleHandles.hide();
                this.render();

            }

        } );

        editor.signals.objectAdded.add( ( object ) => {

            if ( object.userData.isUIElement === true || object.userData.isCanvas === true ) {

                const clone = object.clone();
                clone.userData.originalUuid = object.uuid;

                if ( object.material ) {
                    clone.material = object.material;
                }

                this._cloneMap.set( object.uuid, clone );
                this.scene.add( clone );
                this.render();

            }

        } );

        editor.signals.objectRemoved.add( ( object ) => {

            if ( object.userData.isCanvas === true ) {

                const toRemove = [];
                this._cloneMap.forEach( ( clone, uuid ) => {

                    toRemove.push( uuid );
                    this.scene.remove( clone );

                } );
                toRemove.forEach( uuid => this._cloneMap.delete( uuid ) );

                this._outline.hide();
                this._gizmo.hide();
                this._selectedClone = null;

                this.render();
                return;

            }

            const clone = this._cloneMap.get( object.uuid );
            if ( clone ) {

                this.scene.remove( clone );
                this._cloneMap.delete( object.uuid );

                if ( this._selectedClone === clone ) {

                    this._outline.hide();
                    this._gizmo.hide();
                    this._selectedClone = null;

                }

                this.render();

            }

        } );

        editor.signals.objectChanged.add( ( object ) => {

            if ( this._drag.active ) return;

            const clone = this._cloneMap.get( object.uuid );
            if ( clone ) {

                clone.position.copy( object.position );

                if ( object.material ) {
                    clone.material = object.material;  
                }

                this.render();

            }

        } );

        editor.signals.windowResize.add( () => this.onResize() );

        const resizeObserver = new ResizeObserver( () => this.onResize() );

        setTimeout( () => {

            resizeObserver.observe( this.container.dom );
            this.onResize();

        }, 200 );

    }

    _initControls() {

        const dom = this.renderer.domElement;

        dom.addEventListener( 'wheel', ( e ) => {

            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this._zoom *= zoomFactor;
            this._zoom = Math.max( 0.1, Math.min( 10, this._zoom ) );
            this._updateCameraZoom();
            this.render();

        }, { passive: false } );

        // MOUSEDOWN
        dom.addEventListener( 'mousedown', ( e ) => {

            if ( e.button === 1 || e.button === 2 ) {

                e.preventDefault();
                this._pan.active = true;
                this._pan.start.set( e.clientX, e.clientY );
                return;

            }

            if ( e.button === 0 ) {

                this._updateMouse( e );
                this._raycaster.setFromCamera( this._mouse, this.camera );


                const corner = this._scaleHandles.hitTest( this._raycaster );
                console.log( 'corner hit:', corner, 'selectedClone:', this._selectedClone );
                if ( corner && this._selectedClone ) {

                    this._activeCorner = corner;
                    this._drag.active = true;
                    this._drag.object = this._selectedClone;
                    this._drag.startMouse.set( e.clientX, e.clientY );
                    this._drag.startPos.copy( this._selectedClone.position );
                    this._scaleStartMouse.set( e.clientX, e.clientY );
                    this._scaleStartScale.copy( this._selectedClone.scale );

                    const box = new THREE.Box3().setFromObject( this._selectedClone );
                    box.getSize( this._scaleStartSize );
                    return;

                }

                const gizmoAxis = this._gizmo.hitTest( this._raycaster );
                if ( gizmoAxis ) {

                    this._activeGizmoAxis = gizmoAxis;
                    this._drag.active = true;
                    this._drag.object = this._selectedClone;
                    this._drag.startMouse.set( e.clientX, e.clientY );
                    if ( this._selectedClone ) this._drag.startPos.copy( this._selectedClone.position );
                    return;

                }

                const uiObjects = [ ...this._cloneMap.values() ];
                const intersects = this._raycaster.intersectObjects( uiObjects );

                if ( intersects.length > 0 ) {

                    const hit = intersects[ 0 ].object;
                    const original = this.editor.scene.getObjectByProperty( 'uuid', hit.userData.originalUuid );
                    if ( original ) this.editor.select( original );

                    this._drag.active = true;
                    this._drag.object = hit;
                    this._drag.startMouse.set( e.clientX, e.clientY );
                    this._drag.startPos.copy( hit.position );

                } else {

                    this._outline.hide();
                    this._gizmo.hide();
                    this._scaleHandles.hide();
                    this._selectedClone = null;
                    this.editor.deselect();
                    this.render();

                }

                

            }

        } );

        // MOUSEMOVE
        dom.addEventListener( 'mousemove', ( e ) => {

            if ( this._pan.active ) {

            const dx = ( e.clientX - this._pan.start.x ) / dom.offsetWidth * ( this.camera.right - this.camera.left );
            const dy = ( e.clientY - this._pan.start.y ) / dom.offsetHeight * ( this.camera.top - this.camera.bottom );

            this.camera.position.x -= dx;
            this.camera.position.y += dy;

            this._pan.start.set( e.clientX, e.clientY );
            this.render();
            return;

        }

        // ESCALA con handles
        if ( this._activeCorner && this._drag.active && this._drag.object ) {

            const dx = ( e.clientX - this._scaleStartMouse.x ) / dom.offsetWidth * ( this.camera.right - this.camera.left );
            const dy = ( e.clientY - this._scaleStartMouse.y ) / dom.offsetHeight * ( this.camera.top - this.camera.bottom );

            const corner = this._activeCorner;

            let deltaX = 0;
            let deltaY = 0;

            if ( corner === 'TR' || corner === 'BR' ) deltaX =   dx;
            if ( corner === 'TL' || corner === 'BL' ) deltaX = - dx;
            if ( corner === 'TL' || corner === 'TR' ) deltaY = - dy;
            if ( corner === 'BL' || corner === 'BR' ) deltaY =   dy;

            const newScaleX = Math.max( 0.01, this._scaleStartScale.x + deltaX * 5 );
            const newScaleY = Math.max( 0.01, this._scaleStartScale.y + deltaY * 5 );

            this._drag.object.scale.x = newScaleX;
            this._drag.object.scale.y = newScaleY;

            this._scaleHandles.update( this._drag.object );
            this._outline.show( this._drag.object );
            this._gizmo.updatePosition( this._drag.object.position );

            this.render();
            return;

        }

        // DRAG - mover objetos
        if ( this._drag.active && this._drag.object ) {

            let dx = ( e.clientX - this._drag.startMouse.x ) / dom.offsetWidth * ( this.camera.right - this.camera.left );
            let dy = ( e.clientY - this._drag.startMouse.y ) / dom.offsetHeight * ( this.camera.top - this.camera.bottom );

            if ( this._activeGizmoAxis === 'X' ) dy = 0;
            if ( this._activeGizmoAxis === 'Y' ) dx = 0;

            let newX = this._drag.startPos.x + dx;
            let newY = this._drag.startPos.y - dy;

            const box = new THREE.Box3().setFromObject( this._drag.object );
            const size = new THREE.Vector3();
            box.getSize( size );
            const halfW = size.x / 2;
            const halfH = size.y / 2;

            const canvasAspect = dom.offsetWidth / dom.offsetHeight;
            const limitX = canvasAspect - halfW;
            const limitY = 1.0 - halfH;

            newX = Math.max( - limitX, Math.min( limitX, newX ) );
            newY = Math.max( - limitY, Math.min( limitY, newY ) );

            this._drag.object.position.x = newX;
            this._drag.object.position.y = newY;

            this._outline.updatePosition( this._drag.object.position );
            this._gizmo.updatePosition( this._drag.object.position );
            this._scaleHandles.update( this._drag.object );

            this.render();

        }

        } );

        // MOUSEUP
        dom.addEventListener( 'mouseup', () => {

            if ( this._activeCorner && this._drag.active && this._drag.object ) {

            const original = this.editor.scene.getObjectByProperty( 'uuid', this._drag.object.userData.originalUuid );
            if ( original ) {

                original.scale.copy( this._drag.object.scale );
                this.editor.signals.objectChanged.dispatch( original );

            }

        } else if ( this._drag.active && this._drag.object ) {

            const original = this.editor.scene.getObjectByProperty( 'uuid', this._drag.object.userData.originalUuid );
            if ( original ) {

                original.position.copy( this._drag.object.position );
                this.editor.signals.objectChanged.dispatch( original );

            }

        }

        this._activeCorner = null;
        this._activeGizmoAxis = null;
        this._pan.active = false;
        this._drag.active = false;
        this._drag.object = null;

        } );

        // TOUCH SUPPORT
        const getTouchPos = ( touch ) => ( { clientX: touch.clientX, clientY: touch.clientY, button: 0 } );

        dom.addEventListener( 'touchstart', ( e ) => {

            e.preventDefault();
            if ( e.touches.length === 1 ) {

                this._touchStartX = e.touches[ 0 ].clientX;
                this._touchStartY = e.touches[ 0 ].clientY;
                this._touchMoved = false;
                dom.dispatchEvent( new MouseEvent( 'mousedown', getTouchPos( e.touches[ 0 ] ) ) );

            } else if ( e.touches.length === 2 ) {

                // Pinch zoom - guardar distancia inicial
                const dx = e.touches[ 0 ].clientX - e.touches[ 1 ].clientX;
                const dy = e.touches[ 0 ].clientY - e.touches[ 1 ].clientY;
                this._pinchStartDist = Math.sqrt( dx * dx + dy * dy );
                this._pinchStartZoom = this._zoom;

            }

        }, { passive: false } );

        dom.addEventListener( 'touchmove', ( e ) => {

            e.preventDefault();

            if ( e.touches.length === 1 ) {

                this._touchMoved = true;
                dom.dispatchEvent( new MouseEvent( 'mousemove', getTouchPos( e.touches[ 0 ] ) ) );

            } else if ( e.touches.length === 2 ) {

                const dx = e.touches[ 0 ].clientX - e.touches[ 1 ].clientX;
                const dy = e.touches[ 0 ].clientY - e.touches[ 1 ].clientY;
                const dist = Math.sqrt( dx * dx + dy * dy );
                this._zoom = Math.max( 0.1, Math.min( 10, this._pinchStartZoom * ( dist / this._pinchStartDist ) ) );
                this._updateCameraZoom();
                this.render();

            }

        }, { passive: false } );

        dom.addEventListener( 'touchend', ( e ) => {

            e.preventDefault();
            dom.dispatchEvent( new MouseEvent( 'mouseup', {} ) );

        }, { passive: false } );

        dom.addEventListener( 'contextmenu', ( e ) => e.preventDefault() );

    }

    _updateMouse( e ) {

        const rect = this.renderer.domElement.getBoundingClientRect();
        this._mouse.x = ( ( e.clientX - rect.left ) / rect.width ) * 2 - 1;
        this._mouse.y = - ( ( e.clientY - rect.top ) / rect.height ) * 2 + 1;

    }

    _updateCameraZoom() {

        const aspect = this.container.dom.offsetWidth / this.container.dom.offsetHeight;
        this.camera.left   = - aspect / this._zoom;
        this.camera.right  =   aspect / this._zoom;
        this.camera.top    =   1 / this._zoom;
        this.camera.bottom = - 1 / this._zoom;
        this.camera.updateProjectionMatrix();

    }

    onResize() {

        const width = this.container.dom.offsetWidth;
        const height = this.container.dom.offsetHeight;

        if ( width === 0 || height === 0 ) return;

        const aspect = width / height;

        if ( this._border ) {

            this.scene.remove( this._border );
            this._border.geometry.dispose();
            const borderGeometry = new THREE.EdgesGeometry( new THREE.PlaneGeometry( aspect * 2, 2 ) );
            const borderMaterial = new THREE.LineBasicMaterial( { color: 0x4a90d9 } );
            this._border = new THREE.LineSegments( borderGeometry, borderMaterial );
            this.scene.add( this._border );

        }

        this.camera.left   = - aspect / this._zoom;
        this.camera.right  =   aspect / this._zoom;
        this.camera.top    =   1 / this._zoom;
        this.camera.bottom = - 1 / this._zoom;
        this.camera.updateProjectionMatrix();

        this.renderer.setPixelRatio( 1 );
        this.renderer.setSize( width, height, false );
        this.render();

    }

    render() {

        this.renderer.render( this.scene, this.camera );

    }

}

export { UICanvasViewport };