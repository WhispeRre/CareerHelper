'use client';

import { useEffect, useRef } from 'react';

import styles from './soft-aurora.module.css';
import { hexToVec3 } from './soft-aurora-utils';

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uResolution;
uniform float uSpeed;
uniform float uScale;
uniform float uBrightness;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uNoiseFreq;
uniform float uNoiseAmp;
uniform float uBandHeight;
uniform float uBandSpread;
uniform float uOctaveDecay;
uniform float uLayerOffset;
uniform float uColorSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;
uniform bool uEnableMouse;

#define TAU 6.28318

vec3 gradientHash(vec3 p) {
  p = vec3(
    dot(p, vec3(127.1, 311.7, 234.6)),
    dot(p, vec3(269.5, 183.3, 198.3)),
    dot(p, vec3(169.5, 283.3, 156.9))
  );
  vec3 h = fract(sin(p) * 43758.5453123);
  float phi = acos(2.0 * h.x - 1.0);
  float theta = TAU * h.y;
  return vec3(cos(theta) * sin(phi), sin(theta) * cos(phi), cos(phi));
}

float quinticSmooth(float t) {
  float t2 = t * t;
  float t3 = t * t2;
  return 6.0 * t3 * t2 - 15.0 * t2 * t2 + 10.0 * t3;
}

vec3 cosineGradient(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(TAU * (c * t + d));
}

float perlin3D(float amplitude, float frequency, float px, float py, float pz) {
  float x = px * frequency;
  float y = py * frequency;

  float fx = floor(x); float fy = floor(y); float fz = floor(pz);
  float cx = ceil(x);  float cy = ceil(y);  float cz = ceil(pz);

  vec3 g000 = gradientHash(vec3(fx, fy, fz));
  vec3 g100 = gradientHash(vec3(cx, fy, fz));
  vec3 g010 = gradientHash(vec3(fx, cy, fz));
  vec3 g110 = gradientHash(vec3(cx, cy, fz));
  vec3 g001 = gradientHash(vec3(fx, fy, cz));
  vec3 g101 = gradientHash(vec3(cx, fy, cz));
  vec3 g011 = gradientHash(vec3(fx, cy, cz));
  vec3 g111 = gradientHash(vec3(cx, cy, cz));

  float d000 = dot(g000, vec3(x - fx, y - fy, pz - fz));
  float d100 = dot(g100, vec3(x - cx, y - fy, pz - fz));
  float d010 = dot(g010, vec3(x - fx, y - cy, pz - fz));
  float d110 = dot(g110, vec3(x - cx, y - cy, pz - fz));
  float d001 = dot(g001, vec3(x - fx, y - fy, pz - cz));
  float d101 = dot(g101, vec3(x - cx, y - fy, pz - cz));
  float d011 = dot(g011, vec3(x - fx, y - cy, pz - cz));
  float d111 = dot(g111, vec3(x - cx, y - cy, pz - cz));

  float sx = quinticSmooth(x - fx);
  float sy = quinticSmooth(y - fy);
  float sz = quinticSmooth(pz - fz);

  float lx00 = mix(d000, d100, sx);
  float lx10 = mix(d010, d110, sx);
  float lx01 = mix(d001, d101, sx);
  float lx11 = mix(d011, d111, sx);

  float ly0 = mix(lx00, lx10, sy);
  float ly1 = mix(lx01, lx11, sy);

  return amplitude * mix(ly0, ly1, sz);
}

float auroraGlow(float t, vec2 shift) {
  vec2 uv = gl_FragCoord.xy / uResolution.y;
  uv += shift;

  float noiseVal = 0.0;
  float freq = uNoiseFreq;
  float amp = uNoiseAmp;
  vec2 samplePos = uv * uScale;

  for (float i = 0.0; i < 3.0; i += 1.0) {
    noiseVal += perlin3D(amp, freq, samplePos.x, samplePos.y, t);
    amp *= uOctaveDecay;
    freq *= 2.0;
  }

  float yBand = uv.y * 10.0 - uBandHeight * 10.0;
  return 0.3 * max(exp(uBandSpread * (1.0 - 1.1 * abs(noiseVal + yBand))), 0.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  float t = uSpeed * 0.4 * uTime;

  vec2 shift = vec2(0.0);
  if (uEnableMouse) {
    shift = (uMouse - 0.5) * uMouseInfluence;
  }

  vec3 col = vec3(0.0);
  col += 0.99 * auroraGlow(t, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.2 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(1.0), vec3(0.3, 0.20, 0.20)) * uColor1;
  col += 0.99 * auroraGlow(t + uLayerOffset, shift) * cosineGradient(uv.x + uTime * uSpeed * 0.1 * uColorSpeed, vec3(0.5), vec3(0.5), vec3(2.0, 1.0, 0.0), vec3(0.5, 0.20, 0.25)) * uColor2;

  col *= uBrightness;
  float alpha = clamp(length(col), 0.0, 1.0);
  gl_FragColor = vec4(col, alpha);
}
`;

type SoftAuroraProps = {
  speed?: number;
  scale?: number;
  brightness?: number;
  color1?: string;
  color2?: string;
  noiseFrequency?: number;
  noiseAmplitude?: number;
  bandHeight?: number;
  bandSpread?: number;
  octaveDecay?: number;
  layerOffset?: number;
  colorSpeed?: number;
  enableMouseInteraction?: boolean;
  mouseInfluence?: number;
};

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertex: string, fragment: string) {
  const vertexCompiled = createShader(gl, gl.VERTEX_SHADER, vertex);
  const fragmentCompiled = createShader(gl, gl.FRAGMENT_SHADER, fragment);
  if (!vertexCompiled || !fragmentCompiled) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexCompiled);
  gl.attachShader(program, fragmentCompiled);
  gl.linkProgram(program);
  gl.deleteShader(vertexCompiled);
  gl.deleteShader(fragmentCompiled);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

export default function SoftAurora({
  speed = 0.6,
  scale = 1.5,
  brightness = 1,
  color1 = '#f7f7f7',
  color2 = '#e100ff',
  noiseFrequency = 2.5,
  noiseAmplitude = 1,
  bandHeight = 0.5,
  bandSpread = 1,
  octaveDecay = 0.1,
  layerOffset = 0,
  colorSpeed = 1,
  enableMouseInteraction = true,
  mouseInfluence = 0.25,
}: SoftAuroraProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldAnimate = !prefersReducedMotion;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl', {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!context) return;

    const gl: WebGLRenderingContext = context;
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) return;

    container.appendChild(canvas);
    gl.clearColor(0, 0, 0, 0);
    gl.useProgram(program);

    const triangleBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangleBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 0, 0,
        3, -1, 2, 0,
        -1, 3, 0, 2,
      ]),
      gl.STATIC_DRAW,
    );

    const stride = 4 * Float32Array.BYTES_PER_ELEMENT;
    const positionLocation = gl.getAttribLocation(program, 'position');
    const uvLocation = gl.getAttribLocation(program, 'uv');

    if (positionLocation >= 0) {
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, stride, 0);
    }

    if (uvLocation >= 0) {
      gl.enableVertexAttribArray(uvLocation);
      gl.vertexAttribPointer(uvLocation, 2, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
    }

    const uniforms = {
      uTime: gl.getUniformLocation(program, 'uTime'),
      uResolution: gl.getUniformLocation(program, 'uResolution'),
      uSpeed: gl.getUniformLocation(program, 'uSpeed'),
      uScale: gl.getUniformLocation(program, 'uScale'),
      uBrightness: gl.getUniformLocation(program, 'uBrightness'),
      uColor1: gl.getUniformLocation(program, 'uColor1'),
      uColor2: gl.getUniformLocation(program, 'uColor2'),
      uNoiseFreq: gl.getUniformLocation(program, 'uNoiseFreq'),
      uNoiseAmp: gl.getUniformLocation(program, 'uNoiseAmp'),
      uBandHeight: gl.getUniformLocation(program, 'uBandHeight'),
      uBandSpread: gl.getUniformLocation(program, 'uBandSpread'),
      uOctaveDecay: gl.getUniformLocation(program, 'uOctaveDecay'),
      uLayerOffset: gl.getUniformLocation(program, 'uLayerOffset'),
      uColorSpeed: gl.getUniformLocation(program, 'uColorSpeed'),
      uMouse: gl.getUniformLocation(program, 'uMouse'),
      uMouseInfluence: gl.getUniformLocation(program, 'uMouseInfluence'),
      uEnableMouse: gl.getUniformLocation(program, 'uEnableMouse'),
    };

    let animationFrameId = 0;
    const currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];

    function handleMouseMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      targetMouse = [
        (e.clientX - rect.left) / rect.width,
        1 - (e.clientY - rect.top) / rect.height,
      ];
    }

    function handleMouseLeave() {
      targetMouse = [0.5, 0.5];
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(container.offsetWidth * dpr));
      const height = Math.max(1, Math.floor(container.offsetHeight * dpr));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${container.offsetWidth}px`;
        canvas.style.height = `${container.offsetHeight}px`;
      }

      gl.viewport(0, 0, width, height);
      gl.uniform3f(uniforms.uResolution, width, height, width / height);
    }

    window.addEventListener('resize', resize);
    resize();
    const colorVec1 = hexToVec3(color1);
    const colorVec2 = hexToVec3(color2);
    gl.uniform1f(uniforms.uSpeed, speed);
    gl.uniform1f(uniforms.uScale, scale);
    gl.uniform1f(uniforms.uBrightness, brightness);
    gl.uniform3f(uniforms.uColor1, colorVec1[0], colorVec1[1], colorVec1[2]);
    gl.uniform3f(uniforms.uColor2, colorVec2[0], colorVec2[1], colorVec2[2]);
    gl.uniform1f(uniforms.uNoiseFreq, noiseFrequency);
    gl.uniform1f(uniforms.uNoiseAmp, noiseAmplitude);
    gl.uniform1f(uniforms.uBandHeight, bandHeight);
    gl.uniform1f(uniforms.uBandSpread, bandSpread);
    gl.uniform1f(uniforms.uOctaveDecay, octaveDecay);
    gl.uniform1f(uniforms.uLayerOffset, layerOffset);
    gl.uniform1f(uniforms.uColorSpeed, colorSpeed);
    gl.uniform1f(uniforms.uMouseInfluence, mouseInfluence);
    gl.uniform1i(uniforms.uEnableMouse, enableMouseInteraction && shouldAnimate ? 1 : 0);

    if (enableMouseInteraction && shouldAnimate) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    function update(time: number) {
      gl.uniform1f(uniforms.uTime, shouldAnimate ? time * 0.001 : 0);

      if (enableMouseInteraction && shouldAnimate) {
        currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
        currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
        gl.uniform2f(uniforms.uMouse, currentMouse[0], currentMouse[1]);
      } else {
        gl.uniform2f(uniforms.uMouse, 0.5, 0.5);
      }

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (shouldAnimate) {
        animationFrameId = requestAnimationFrame(update);
      }
    }

    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      if (enableMouseInteraction && shouldAnimate) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
      gl.deleteBuffer(triangleBuffer);
      gl.deleteProgram(program);
      if (canvas.parentNode === container) {
        container.removeChild(canvas);
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [
    bandHeight,
    bandSpread,
    brightness,
    color1,
    color2,
    colorSpeed,
    enableMouseInteraction,
    layerOffset,
    mouseInfluence,
    noiseAmplitude,
    noiseFrequency,
    octaveDecay,
    scale,
    speed,
  ]);

  return <div ref={containerRef} className={styles.container} />;
}
