export const DEFAULT_VERTEX_SHADER = `
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec4 color;
    attribute vec2 uv;

    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uModelMatrix;
    uniform bool uEnableLighting;

    varying vec4 vColor;
    varying vec3 vNormal;

    void main() {
        vec4 worldPos = uModelMatrix * vec4(position, 1.0);
        gl_Position = uProjectionMatrix * uViewMatrix * worldPos;

        vColor = color;
        vNormal = normal;
    }
`;

export const DEFAULT_FRAGMENT_SHADER = `
    precision mediump float;

    varying vec4 vColor;
    varying vec3 vNormal;

    uniform bool uEnableLighting;
    uniform vec3 uLightDirection;
    uniform vec3 uLightColor;
    uniform float uAmbientStrength;

    void main() {
        vec3 finalColor = vColor.rgb;
        if (uEnableLighting) {
            vec3 ambient = uAmbientStrength * uLightColor;
            vec3 n = normalize(vNormal);
            vec3 l = normalize(uLightDirection);
            float diff = max(dot(n, l), 0.0);
            vec3 diffuse = diff * uLightColor;
            finalColor *= (ambient + diffuse);
        }
        gl_FragColor = vec4(finalColor, vColor.a);
    }
`;

