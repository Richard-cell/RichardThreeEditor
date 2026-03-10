import { Command } from '../Command.js';
import { ObjectLoader } from 'three';

class AddObjectCommand extends Command {

	/**
	 * @param {Editor} editor
	 * @param {THREE.Object3D|null} [object=null]
	 * @param {THREE.Object3D|null} [parent=null]
	 * @constructor
	 */
	constructor( editor, object = null, parent = null ) {

		super( editor );

		this.type = 'AddObjectCommand';

		this.object = object;
		this.parent = parent;

		if ( object !== null ) {

			this.name = editor.strings.getKey( 'command/AddObject' ) + ': ' + object.name;

		}

	}

	execute() {

		if ( this.parent !== null ) {

			this.parent.add( this.object );
			this.editor.signals.objectAdded.dispatch( this.object );
			this.editor.signals.sceneGraphChanged.dispatch();

		} else {

			this.editor.addObject( this.object );

		}

		this.editor.select( this.object );

	}

	undo() {

		if ( this.parent !== null ) {

			this.parent.remove( this.object );
			this.editor.signals.objectRemoved.dispatch( this.object );
			this.editor.signals.sceneGraphChanged.dispatch();

		} else {

			this.editor.removeObject( this.object );

		}

		this.editor.deselect();

	}

	toJSON() {

		const output = super.toJSON( this );

		output.object = this.object.toJSON();
		output.parentUuid = this.parent !== null ? this.parent.uuid : null;

		return output;

	}

	fromJSON( json ) {

		super.fromJSON( json );

		this.object = this.editor.objectByUuid( json.object.object.uuid );

		if ( this.object === undefined ) {

			const loader = new ObjectLoader();
			this.object = loader.parse( json.object );

		}

		if ( json.parentUuid !== null ) {

			this.parent = this.editor.objectByUuid( json.parentUuid );

		}

	}

}

export { AddObjectCommand };