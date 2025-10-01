import { Component } from '../core/Component.js';

export class ColliderComponent extends Component {
    constructor(shape) {
        super();
        this.shape = shape;
    }

    get name() {
        return 'ColliderComponent';
    }
}