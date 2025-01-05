export class MathUtils {
    static DEG_TO_RAD = Math.PI / 180;
    static RAD_TO_DEG = 180 / Math.PI;

    static degToRad(degrees) {
        return degrees * MathUtils.DEG_TO_RAD;
    }

    static radToDeg(radians) {
        return radians * MathUtils.RAD_TO_DEG;
    }
}
