const APP = {

	Player: function () {

		let renderer;

		const loader = new THREE.ObjectLoader();
		let camera, scene;
		let uiScene = null;
		let uiCamera = null;

		let events = {};

		const dom = document.createElement( 'div' );

		this.dom = dom;
		this.canvas = null;

		this.width = 500;
		this.height = 500;

		function updateUICameraAspect( width, height ) {

			if ( ! uiCamera ) return;
			const aspect = width / height;
			uiCamera.left   = - aspect;
			uiCamera.right  =   aspect;
			uiCamera.top    =   1;
			uiCamera.bottom = - 1;
			uiCamera.updateProjectionMatrix();

		}

		this.load = async function ( json ) {

			const project = json.project;

			if ( renderer !== undefined ) {

				renderer.dispose();
				dom.removeChild( renderer.domElement );
				this.canvas = null;

			}

			if ( project.renderer === 'WebGPURenderer' ) {

				const { WebGPURenderer } = await import( 'three/webgpu' );
				renderer = new WebGPURenderer( { antialias: true, logarithmicDepthBuffer: true } );
				await renderer.init();

			} else {

				renderer = new THREE.WebGLRenderer( { antialias: true, logarithmicDepthBuffer: true } );

			}

			renderer.setPixelRatio( window.devicePixelRatio );

			if ( project.shadows !== undefined ) renderer.shadowMap.enabled = project.shadows;
			if ( project.shadowType !== undefined ) renderer.shadowMap.type = project.shadowType;
			if ( project.toneMapping !== undefined ) renderer.toneMapping = project.toneMapping;
			if ( project.toneMappingExposure !== undefined ) renderer.toneMappingExposure = project.toneMappingExposure;

			dom.appendChild( renderer.domElement );
			this.canvas = renderer.domElement;

			this.setScene( loader.parse( json.scene ) );
			this.setCamera( loader.parse( json.camera ) );

			// Setup UI Screen Space Overlay
			uiScene = new THREE.Scene();
			uiCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0.1, 10 );
			uiCamera.position.set( 0, 0, 5 );

			scene.traverse( function ( child ) {

				if ( child.userData.isUIElement === true ) {

					const clone = child.clone();
					clone.layers.set( 0 );
					uiScene.add( clone );

				}

			} );

			// Eventos de botones UI en Play
			renderer.domElement.addEventListener( 'click', function ( e ) {

				if ( ! uiScene || ! uiCamera ) return;

				const rect = renderer.domElement.getBoundingClientRect();
				const mouse = new THREE.Vector2(
					( ( e.clientX - rect.left ) / rect.width ) * 2 - 1,
					- ( ( e.clientY - rect.top ) / rect.height ) * 2 + 1
				);

				const raycaster = new THREE.Raycaster();
				raycaster.setFromCamera( mouse, uiCamera );

				const objects = [];
				uiScene.traverse( ( child ) => { if ( child.isMesh ) objects.push( child ); } );

				const intersects = raycaster.intersectObjects( objects );
				if ( intersects.length === 0 ) return;

				const hit = intersects[ 0 ].object;

				// Buscar el objeto original con el script
				let scriptSource = null;
				scene.traverse( ( child ) => {

					if ( child.userData.isUIElement && child.userData.uiType === 'Button' ) {

						if ( child.userData.onClickScript ) {

							scriptSource = child.userData.onClickScript;

						}

					}

				} );

				if ( scriptSource ) {

					try {

						new Function( 'scene', 'camera', 'renderer', scriptSource )( scene, camera, renderer );

					} catch ( err ) {

						console.error( 'UIButton script error:', err );

					}

				}

			} );

			updateUICameraAspect( this.width, this.height );

			events = {
				init: [],
				start: [],
				stop: [],
				keydown: [],
				keyup: [],
				pointerdown: [],
				pointerup: [],
				pointermove: [],
				update: []
			};

			let scriptWrapParams = 'player,renderer,scene,camera';
			const scriptWrapResultObj = {};

			for ( var eventKey in events ) {

				scriptWrapParams += ',' + eventKey;
				scriptWrapResultObj[ eventKey ] = eventKey;

			}

			const scriptWrapResult = JSON.stringify( scriptWrapResultObj ).replace( /\"/g, '' );

			for ( const uuid in json.scripts ) {

				const object = scene.getObjectByProperty( 'uuid', uuid, true );

				if ( object === undefined ) {

					console.warn( 'APP.Player: Script without object.', uuid );
					continue;

				}

				const scripts = json.scripts[ uuid ];

				for ( let i = 0; i < scripts.length; i ++ ) {

					const script = scripts[ i ];

					const functions = ( new Function( scriptWrapParams, script.source + '\nreturn ' + scriptWrapResult + ';' ).bind( object ) )( this, renderer, scene, camera );

					for ( const name in functions ) {

						if ( functions[ name ] === undefined ) continue;

						if ( events[ name ] === undefined ) {

							console.warn( 'APP.Player: Event type not supported (', name, ')' );
							continue;

						}

						events[ name ].push( functions[ name ].bind( object ) );

					}

				}

			}

			dispatch( events.init, arguments );

		};

		this.setCamera = function ( value ) {

			camera = value;
			camera.aspect = this.width / this.height;
			camera.updateProjectionMatrix();
			camera.layers.set( 0 );

		};

		this.setScene = function ( value ) {

			scene = value;

		};

		this.setPixelRatio = function ( pixelRatio ) {

			renderer.setPixelRatio( pixelRatio );

		};

		this.setClearColor = function ( color ) {

			renderer.setClearColor( color );

		};

		this.setSize = function ( width, height ) {

			this.width = width;
			this.height = height;

			if ( camera ) {

				camera.aspect = this.width / this.height;
				camera.updateProjectionMatrix();

			}

			if ( renderer ) {

				renderer.setSize( width, height );

			}

			updateUICameraAspect( width, height );

		};

		function dispatch( array, event ) {

			for ( let i = 0, l = array.length; i < l; i ++ ) {

				array[ i ]( event );

			}

		}

		let time, startTime, prevTime;

		function animate() {

			time = performance.now();

			try {

				dispatch( events.update, { time: time - startTime, delta: time - prevTime } );

			} catch ( e ) {

				console.error( ( e.message || e ), ( e.stack || '' ) );

			}

			// Render escena 3D
			renderer.render( scene, camera );

			// Render UI encima (Screen Space Overlay)
			if ( uiScene && uiCamera ) {

				renderer.autoClear = false;
				renderer.clearDepth(); // Limpiar depth buffer para que UI siempre quede encima
				renderer.render( uiScene, uiCamera );
				renderer.autoClear = true;

			}

			prevTime = time;

		}

		this.play = function () {

			startTime = prevTime = performance.now();

			document.addEventListener( 'keydown', onKeyDown );
			document.addEventListener( 'keyup', onKeyUp );
			document.addEventListener( 'pointerdown', onPointerDown );
			document.addEventListener( 'pointerup', onPointerUp );
			document.addEventListener( 'pointermove', onPointerMove );

			dispatch( events.start, arguments );

			renderer.setAnimationLoop( animate );

		};

		this.stop = function () {

			document.removeEventListener( 'keydown', onKeyDown );
			document.removeEventListener( 'keyup', onKeyUp );
			document.removeEventListener( 'pointerdown', onPointerDown );
			document.removeEventListener( 'pointerup', onPointerUp );
			document.removeEventListener( 'pointermove', onPointerMove );

			dispatch( events.stop, arguments );

			renderer.setAnimationLoop( null );

		};

		this.render = function ( time ) {

			dispatch( events.update, { time: time * 1000, delta: 0 } );

			renderer.render( scene, camera );

			if ( uiScene && uiCamera ) {

				renderer.autoClear = false;
				renderer.clearDepth();
				renderer.render( uiScene, uiCamera );
				renderer.autoClear = true;

			}

		};

		this.dispose = function () {

			if ( renderer ) {

				renderer.dispose();

			}

			camera = undefined;
			scene = undefined;
			uiScene = null;
			uiCamera = null;

		};

		function onKeyDown( event ) { dispatch( events.keydown, event ); }
		function onKeyUp( event ) { dispatch( events.keyup, event ); }
		function onPointerDown( event ) { dispatch( events.pointerdown, event ); }
		function onPointerUp( event ) { dispatch( events.pointerup, event ); }
		function onPointerMove( event ) { dispatch( events.pointermove, event ); }

	}

};

export { APP };