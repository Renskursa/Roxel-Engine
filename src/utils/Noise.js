export class Noise {
    constructor(seed = Math.random()) {
        // Initialize and shuffle permutation table for consistent noise
        this.permutation = new Array(256).fill(0).map((_, i) => i);
        
        let rand = this.seededRandom(seed);
        // Fisher-Yates shuffle
        for (let i = this.permutation.length - 1; i > 0; i--) {
            const j = Math.floor(rand() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }
        
        this.perm = [...this.permutation, ...this.permutation];
    }

    seededRandom(seed) {
        return function() {
            seed = Math.sin(seed) * 10000;
            return seed - Math.floor(seed);
        };
    }

    noise2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);

        const u = this.fade(x);
        const v = this.fade(y);

        const A = this.perm[X] + Y;
        const B = this.perm[X + 1] + Y;

        return this.lerp(
            v,
            this.lerp(u, this.grad2D(this.perm[A], x, y), this.grad2D(this.perm[B], x - 1, y)),
            this.lerp(u, this.grad2D(this.perm[A + 1], x, y - 1), this.grad2D(this.perm[B + 1], x - 1, y - 1))
        );
    }

    noise3D(x, y, z) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;

        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);

        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);

        const A  = this.perm[X] + Y;
        const AA = this.perm[A] + Z;
        const AB = this.perm[A + 1] + Z;
        const B  = this.perm[X + 1] + Y;
        const BA = this.perm[B] + Z;
        const BB = this.perm[B + 1] + Z;

        return this.lerp(w, 
            this.lerp(v,
                this.lerp(u, 
                    this.grad3D(this.perm[AA], x, y, z),
                    this.grad3D(this.perm[BA], x-1, y, z)
                ),
                this.lerp(u,
                    this.grad3D(this.perm[AB], x, y-1, z),
                    this.grad3D(this.perm[BB], x-1, y-1, z)
                )
            ),
            this.lerp(v,
                this.lerp(u,
                    this.grad3D(this.perm[AA+1], x, y, z-1),
                    this.grad3D(this.perm[BA+1], x-1, y, z-1)
                ),
                this.lerp(u,
                    this.grad3D(this.perm[AB+1], x, y-1, z-1),
                    this.grad3D(this.perm[BB+1], x-1, y-1, z-1)
                )
            )
        );
    }

    // Ken Perlin's improved noise functions
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    
    lerp(t, a, b) { return a + t * (b - a); }
    
    grad2D(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
    }

    grad3D(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
}
