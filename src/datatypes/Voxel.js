/**
 * Represents a single voxel (volumetric pixel) in a 3D space
 */
export class Voxel {
    /**
     * @param {number} x - X position in world space
     * @param {number} y - Y position in world space
     * @param {number} z - Z position in world space
     * @param {number} type - Type ID of the voxel (e.g., 0 for air, 1 for dirt, etc.)
     * @param {number} groupId - Group ID of the voxel (optional)
     */
    constructor(x, y, z, type, groupId = null) {
        this.x = Math.floor(x);
        this.y = Math.floor(y);
        this.z = Math.floor(z);
        this.type = type;
        this.visible = true;
        this.light = 15;
        this.groupId = groupId;
        this.color = null;
        this.colorGradient = null;
        this.visibleFaces = {
            front: true,
            back: true,
            top: true,
            bottom: true,
            right: true,
            left: true
        };
    }

    setColor(r, g, b, a = 255) {
        this.color = [
            r / 255,
            g / 255,
            b / 255,
            a / 255
        ];
        this.colorGradient = null;
        return this;
    }

    setGradient(color1, color2, direction = null) {
        this.colorGradient = {
            start: color1.map(v => v / 255),
            end: color2.map(v => v / 255),
            direction: direction
        };
        this.color = null;
        return this;
    }

    autoSetGradientDirection(direction) {
        if (this.colorGradient && !this.colorGradient.direction) {
            this.colorGradient.direction = direction;
        }
    }

    updateVisibility(neighbors) {
        this.visible = !neighbors.every(n => n);
    }

    updateVisibleFaces(neighbors) {
        this.visibleFaces.front = !neighbors.front?.isSolid();
        this.visibleFaces.back = !neighbors.back?.isSolid();
        this.visibleFaces.top = !neighbors.top?.isSolid();
        this.visibleFaces.bottom = !neighbors.bottom?.isSolid();
        this.visibleFaces.right = !neighbors.right?.isSolid();
        this.visibleFaces.left = !neighbors.left?.isSolid();
        
        this.visible = Object.values(this.visibleFaces).some(face => face);
    }

    getPositionHash() {
        return `${this.x},${this.y},${this.z}`;
    }

    isSolid() {
        return this.type !== 0;
    }

    clone() {
        return new Voxel(this.x, this.y, this.z, this.type);
    }

    getColor() {
        if (this.color) {
            return this.color;
        }
        return [1, 1, 1, 1];
    }
}