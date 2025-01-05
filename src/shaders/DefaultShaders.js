export const DEFAULT_VERTEX_SHADER = `
    attribute vec3 position;
    attribute vec3 normal;
    attribute vec3 instancePosition;
    attribute vec4 instanceColor;
    attribute float ao;
    
    uniform mat4 uProjectionMatrix;
    uniform mat4 uViewMatrix;
    uniform vec3 uLightDirection;
    uniform bool uEnableAO;
    uniform bool uEnableLighting;
    uniform vec4 uSkyColor;
    uniform vec4 uVoidColor;
    uniform vec4 uHorizonColor;
    uniform vec4 uFogColor;
    uniform float uFogDensity;
    uniform float uFogStart;
    uniform float uFogEnd;
    uniform bool uEnableFog;
    
    varying vec4 vColor;
    varying vec3 vNormal;
    varying float vAo;
    varying float vFaceDarkening;
    varying float vFogFactor;
    varying float vHeight;
    
    void main() {
        vec3 worldPos = position + instancePosition;
        vec4 viewPos = uViewMatrix * vec4(worldPos, 1.0);
        gl_Position = uProjectionMatrix * viewPos;
        
        // Calculate fog factor
        float dist = length(viewPos.xyz);
        vFogFactor = uEnableFog ? clamp((uFogEnd - dist) / (uFogEnd - uFogStart), 0.0, 1.0) : 1.0;
        
        // Pass world height for sky/void interpolation
        vHeight = worldPos.y;
        
        vColor = instanceColor;
        
        // Calculate face darkening based on normal direction
        float topDarkening = 1.0;
        float sideDarkening = 0.35; // Sides are 65% darker
        float bottomDarkening = 0.6; // Bottom face is 40% darker
        
        // Determine which face we're on based on normal
        if (normal.y > 0.5) {
            vFaceDarkening = topDarkening;    // Top face
        } else if (normal.y < -0.5) {
            vFaceDarkening = bottomDarkening; // Bottom face
        } else {
            vFaceDarkening = sideDarkening;   // Side faces
        }
        
        // Only pass these if needed
        if (uEnableLighting) {
            vNormal = normalize(normal);
        }
        if (uEnableAO) {
            vAo = ao;
        } else {
            vAo = 1.0;
        }
    }
`;

export const DEFAULT_FRAGMENT_SHADER = `
    precision mediump float;
    
    varying vec4 vColor;
    varying vec3 vNormal;
    varying float vAo;
    varying float vFaceDarkening;
    varying float vFogFactor;
    varying float vHeight;
    
    uniform bool uEnableAO;
    uniform bool uEnableLighting;
    uniform vec3 uLightDirection;
    uniform vec3 uLightColor;
    uniform float uAmbientStrength;
    uniform vec4 uSkyColor;
    uniform vec4 uVoidColor;
    uniform vec4 uHorizonColor;
    uniform vec4 uFogColor;
    uniform bool uEnableFog;
    
    void main() {
        // Apply base color with face darkening
        vec3 finalColor = vColor.rgb * vFaceDarkening;
        
        // Apply lighting if enabled
        if (uEnableLighting) {
            vec3 ambient = uAmbientStrength * uLightColor;
            vec3 normalizedNormal = normalize(vNormal);
            vec3 normalizedLightDir = normalize(uLightDirection);
            float diff = max(dot(normalizedNormal, normalizedLightDir), 0.0);
            vec3 diffuse = diff * uLightColor;
            finalColor *= (ambient + diffuse);
        }
        
        // Apply AO if enabled
        if (uEnableAO) {
            finalColor *= vAo;
        }
        
        // Apply fog only to voxels, not to the sky
        if (uEnableFog) {
            vec3 foggedColor = mix(uFogColor.rgb, finalColor, vFogFactor);
            finalColor = foggedColor;
        }
        
        gl_FragColor = vec4(finalColor, vColor.a);
    }
`;

