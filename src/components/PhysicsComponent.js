import { vec3 } from 'gl-matrix';
import { Component } from '../core/Component.js';

export class PhysicsComponent extends Component {
    constructor(options = {}) {
        super();
        this.velocity = options.velocity || vec3.create();
        this.acceleration = options.acceleration || vec3.create();
        this.mass = options.mass || 1;
    }

    get name() {
        return 'PhysicsComponent';
    }
}