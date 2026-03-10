import * as THREE from 'three';

class UIButton {

    static createTexture( text = 'Button' ) {

        const canvas = document.createElement( 'canvas' );
        canvas.width = 256;
        canvas.height = 96;

        const ctx = canvas.getContext( '2d' );

        ctx.fillStyle = '#666666';
        ctx.roundRect( 0, 0, 256, 96, 12 );
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText( text, 128, 48 );

        const texture = new THREE.CanvasTexture( canvas );
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;

    }

    static create() {

        const geometry = new THREE.PlaneGeometry( 0.2, 0.08 );
        const material = new THREE.MeshBasicMaterial( {
            map: UIButton.createTexture( 'Button' ),
            color: 0xffffff,
            side: THREE.DoubleSide,
            transparent: true,
        } );

        const button = new THREE.Mesh( geometry, material );
        button.name = 'Button';
        button.userData.isUIElement = true;
        button.userData.uiType = 'Button';
        button.userData.buttonText = 'Button';
        button.position.set( 0, 0, 0.001 );
        button.layers.set( 1 );

        return button;

    }

}

export { UIButton };