// engine.js
export class CanvasManager {
  static createFullscreenCanvas() {
    // Add CSS to document
    const style = document.createElement('style');
    style.textContent = `
      * { margin: 0; padding: 0; }
      html, body { 
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      canvas {
        display: block;
        width: 100vw;
        height: 100vh;
        position: fixed;
        top: 0;
        left: 0;
      }
    `;
    document.head.appendChild(style);

    // Create canvas element
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    
    return canvas;
  }

  static setCanvasSize(canvas, width, height) {
    canvas.style.width = width;
    canvas.style.height = height;
    canvas.width = width;
    canvas.height = height;
  }
}
