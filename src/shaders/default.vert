#version 300 es
precision highp float;

// Attributes
layout(location = 0) in vec3 position;
layout(location = 1) in vec3 normal;
layout(location = 2) in vec4 color;
layout(location = 3) in vec2 uv;

// Uniforms
uniform mat4 uProjectionMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uModelMatrix;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uAmbientStrength;
uniform bool uEnableLighting;
uniform bool uEnableAO; // Kept for consistency, but not used

// Varying
out vec4 vColor;
out vec3 vNormal;
out vec3 vWorldPosition;
out float vAO;

void main() {
    vec4 worldPosition = uModelMatrix * vec4(position, 1.0);
    gl_Position = uProjectionMatrix * uViewMatrix * worldPosition;

    vWorldPosition = worldPosition.xyz;
    vNormal = mat3(uModelMatrix) * normal;

    vec3 lightDir = normalize(uLightDirection);
    float diff = max(dot(vNormal, lightDir), 0.0);
    vec3 diffuse = uEnableLighting ? diff * uLightColor : vec3(1.0);
    vec3 ambient = uAmbientStrength * uLightColor;

    vColor = vec4((ambient + diffuse) * color.rgb, color.a);
    vAO = 1.0; // AO not implemented in mesh generation
}