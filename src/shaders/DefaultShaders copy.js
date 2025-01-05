export const DEFAULT_SHADER = {
    vertex: `#version 300 es
        in vec3 vertex;
        in vec4 color;
        in vec4 gradient;
        in vec4 gradientData;
        in float gradientType;
        in float gradientScale;
        in vec3 faceVisibility;

        uniform mat4 modelMatrix;
        uniform mat4 viewMatrix;
        uniform mat4 projectionMatrix;
        uniform float u_animationProgress;

        out vec4 v_color;
        out vec4 v_gradient;
        out vec4 v_gradientData;
        out float v_gradientType;
        out float v_gradientScale;
        out vec3 v_normal;
        out vec3 v_position;

        void main() {
            // Debug the input values
            vec4 localPos = vec4(vertex, 1.0);
            vec4 worldPos = modelMatrix * localPos;
            vec4 viewPos = viewMatrix * worldPos;
            vec4 clipPos = projectionMatrix * viewPos;
            
            gl_Position = clipPos;
            
            // Pass debug values to fragment shader using varying
            v_position = worldPos.xyz;
            v_normal = normalize(faceVisibility);
            
            v_color = color;
            v_gradient = gradient;
            v_gradientData = gradientData;
            v_gradientType = gradientType;
            v_gradientScale = gradientScale;
        }
    `,
    fragment: `#version 300 es
        precision highp float;

        in vec4 v_color;
        in vec4 v_gradient;
        in vec4 v_gradientData;
        in float v_gradientType;
        in float v_gradientScale;
        in vec3 v_normal;
        in vec3 v_position;

        uniform float u_animationProgress;
        uniform vec3 sunDirection;
        uniform vec3 sunColor;
        uniform float sunIntensity;
        uniform vec3 ambientLight;
        uniform float ambientIntensity;
        
        out vec4 fragColor;

        vec4 calculateGradient(vec3 pos, vec4 startColor, vec4 endColor, float type, float scale) {
            if(type < 0.0) return startColor;
            
            float t = 0.0;
            if(type == 0.0) {
                t = pos.x / scale;
            } else if(type == 1.0) {
                t = pos.y / scale;
            } else if(type == 2.0) {
                t = pos.z / scale;
            } else if(type == 3.0) {
                t = (atan(pos.z, pos.x) / 6.28318) + 0.5;
            }
            
            return mix(startColor, endColor, clamp(t, 0.0, 1.0));
        }

        void main() {
            // Calculate base color using gradient or solid color
            vec4 baseColor = v_gradientType >= 0.0 ? 
                calculateGradient(v_position, v_gradient, v_gradientData, v_gradientType, v_gradientScale) : 
                v_color;
            
            // Apply lighting
            vec3 normal = normalize(v_normal);
            float diffuse = max(dot(normal, -sunDirection), 0.0);
            vec3 lighting = (ambientLight * ambientIntensity) + 
                          (sunColor * sunIntensity * diffuse);
            
            // Apply lighting to color
            vec3 finalColor = baseColor.rgb * lighting;
            fragColor = vec4(finalColor, baseColor.a);
        }
    `
};

export const SHADOW_SHADER = {
    vertex: `#version 300 es
    in vec3 position;
    uniform mat4 lightSpaceMatrix;
    uniform mat4 modelMatrix;
    void main() {
        gl_Position = lightSpaceMatrix * modelMatrix * vec4(position, 1.0);
    }`,
    fragment: `#version 300 es
    precision highp float;
    out vec4 fragColor;
    void main() {
        fragColor = vec4(vec3(gl_FragCoord.z), 1.0);
    }`
};

export const WIREFRAME_SHADER = {
    vertex: `#version 300 es
    in vec3 position;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
    fragment: `#version 300 es
    precision highp float;
    out vec4 fragColor;
    void main() {
        fragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }`
};

export const TEST_SHADER = {
    vertex: `#version 300 es
    in vec3 position;
    in vec4 color;
    
    out vec4 v_color;
    
    void main() {
        gl_Position = vec4(position, 1.0);
        v_color = color;
    }`,
    fragment: `#version 300 es
    precision highp float;
    
    in vec4 v_color;
    out vec4 fragColor;
    
    void main() {
        fragColor = v_color;
    }
    `
};
