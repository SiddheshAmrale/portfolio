import { useEffect, useRef } from 'react';

// A slow, domain-warped aurora drawn by one fragment shader.
//
// Cost control: the canvas renders at RENDER_SCALE of its CSS size (the field
// is soft, so the browser's upscale is invisible), draws at most 30 frames a
// second, and stops entirely while the hero is off screen, the tab is hidden,
// or the visitor prefers reduced motion (one still frame instead).
const RENDER_SCALE = 0.35;
const FRAME_MS = 1000 / 30;

const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;

const FRAG = `
precision mediump float;
uniform vec2 r;
uniform float t;
uniform vec2 m;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*r)/r.y;
  vec2 q=vec2(fbm(p*1.4+vec2(0.,t*.04)),fbm(p*1.4+vec2(5.2,-t*.035)));
  float f=fbm(p*1.1+1.8*q+vec2(t*.02,0.));
  vec3 base=vec3(.012,.016,.035);
  vec3 cyan=vec3(.08,.55,.58);
  vec3 indigo=vec3(.30,.27,.80);
  vec3 col=base;
  col=mix(col,cyan,smoothstep(.52,.95,f)*.38);
  col=mix(col,indigo,smoothstep(.45,.9,q.y)*.30);
  // Light that leans toward the pointer.
  float d=length(p-m*vec2(r.x/r.y,1.)*.5);
  col+=vec3(.10,.16,.28)*exp(-d*d*2.2)*.45;
  // Keep the edges and the bottom dark so the type stays crisp.
  col*=smoothstep(1.45,.15,length(p*vec2(.75,1.15)-vec2(.25,.12)));
  col*=smoothstep(-.62,.05,p.y)*.75+.25;
  gl_FragColor=vec4(col,1.);
}`;

export default function ShaderBackdrop({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl', {
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
      preserveDrawingBuffer: false,
      // No WebGL at all on software/blocklisted GPUs: the static CSS gradient
      // underneath is the fallback, and weak devices skip the shader cost.
      failIfMajorPerformanceCaveat: true,
    });
    if (!gl) return; // CSS gradient underneath stays as the fallback.

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uR = gl.getUniformLocation(prog, 'r');
    const uT = gl.getUniformLocation(prog, 't');
    const uM = gl.getUniformLocation(prog, 'm');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let last = 0;
    let visible = true;
    let mx = 0.35;
    let my = 0.2;
    let tx = mx;
    let ty = my;
    const t0 = performance.now() - 20000; // start mid-flow, not at a seam

    const resize = () => {
      const w = Math.max(1, Math.round(canvas.clientWidth * RENDER_SCALE));
      const hgt = Math.max(1, Math.round(canvas.clientHeight * RENDER_SCALE));
      if (canvas.width !== w || canvas.height !== hgt) {
        canvas.width = w;
        canvas.height = hgt;
        gl.viewport(0, 0, w, hgt);
      }
      gl.uniform2f(uR, w, hgt);
    };

    const draw = (now: number) => {
      mx += (tx - mx) * 0.04;
      my += (ty - my) * 0.04;
      gl.uniform1f(uT, (now - t0) / 1000);
      gl.uniform2f(uM, mx, my);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      last = now;
      draw(now);
    };
    const start = () => {
      if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    resize();
    draw(performance.now());
    // Only reveal the canvas once a frame has really been drawn; a blocked or
    // crashed GPU would otherwise show a blank (white) canvas over the hero.
    if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR) return;
    canvas.style.opacity = '1';
    const onLost = (e: Event) => {
      e.preventDefault();
      canvas.style.opacity = '0';
      stop();
    };
    canvas.addEventListener('webglcontextlost', onLost);

    const ro = new ResizeObserver(() => {
      resize();
      if (!raf) draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
      else stop();
    });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVis);
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('webglcontextlost', onLost);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={className}
      style={{ opacity: 0, transition: 'opacity 1.6s cubic-bezier(.16,1,.3,1)' }}
    />
  );
}
