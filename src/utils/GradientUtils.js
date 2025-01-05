export const GradientType = {
    LINEAR_X: 'linear_x',    // Type 0
    LINEAR_Y: 'linear_y',    // Type 1
    LINEAR_Z: 'linear_z',    // Type 2
    ANGULAR: 'angular'       // Type 3
};

export class GradientUtils {
    static DEG_TO_RAD = Math.PI / 180;
    
    static calculateGradientVector(angle) {
        const rad = angle * GradientUtils.DEG_TO_RAD;
        return {
            x: Math.cos(rad),
            y: Math.sin(rad)
        };
    }

    static normalizeWorldPosition(x, y, z, gradientType, scale = 1) {
        switch (gradientType) {
            case 'linear_x':
                return x / scale;
            case 'linear_y':
                return y / scale;
            case 'linear_z':
                return z / scale;
            case 'angular':
                const angleRad = Math.atan2(z, x);
                return (angleRad + Math.PI) / (2 * Math.PI);
            default:
                return 0;
        }
    }
}