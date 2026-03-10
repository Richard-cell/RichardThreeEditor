import { UICanvas } from './components/UICanvas.js';
import { UIButton } from './components/UIButton.js';
import { UIImage } from './components/UIImage.js';

const uiComponents = {
    'Button': () => UIButton.create(),
    'Image':  () => UIImage.create(),
};

class UICanvasFactory {

    static createCanvas() {

        return UICanvas.create();

    }

    static createElementByType( type ) {

        const creator = uiComponents[ type ];

        if ( creator === undefined ) {

            console.warn( `UICanvasFactory: tipo desconocido "${ type }"` );
            return null;

        }

        return creator();

    }

}

export { UICanvasFactory };