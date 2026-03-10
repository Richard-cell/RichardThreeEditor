import { UICanvasFactory } from './UICanvasFactory.js';
import { UICanvas } from './components/UICanvas.js';
import { AddObjectCommand } from '../commands/AddObjectCommand.js';

class UICanvasMediator {

    static request( editor, type ) {

        let canvas = UICanvas.getFirst( editor.scene );

        if ( canvas === null ) {

            canvas = UICanvasFactory.createCanvas();
            editor.camera.add( canvas );
            editor.execute( new AddObjectCommand( editor, canvas ) );

        }

        const element = UICanvasFactory.createElementByType( type );

        if ( element === null ) return;
        editor.execute( new AddObjectCommand( editor, element, canvas ) );

    }

}

export { UICanvasMediator };