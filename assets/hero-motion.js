// Animate the existing raster artwork; no external services or video downloads.
const hero = document.querySelector(".hero");
const canvas = hero.querySelector(".hero-motion");
const button = hero.querySelector(".motion-toggle");
const particles = hero.querySelector(".hero-particles");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let paused = reduced.matches;
let visible = true;
let ready = false;
let frame = 0;
let elapsed = 0;
let previous = 0;
const motionSpeed = 2;
const gl = canvas.getContext("webgl", {
  alpha: false,
  antialias: false,
  powerPreference: "low-power",
});

if (gl) {
  const vertex = `attribute vec2 position; varying vec2 uv;
    void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment = `precision mediump float;
    varying vec2 uv; uniform sampler2D artwork;
    uniform vec2 resolution; uniform float time;
    void main(){
      vec2 p=vec2(uv.x,1.-uv.y);
      float aspect=resolution.x/resolution.y;
      float imageAspect=1672./941.;
      vec2 cover=vec2(min(aspect/imageAspect,1.),min(imageAspect/aspect,1.));
      vec2 q=(p-.5)*cover*.94+.5;
      float flow=time*.22;
      float strength=smoothstep(.18,.8,p.x);
      q.x+=sin(p.y*6.+flow)*.013*strength+sin(flow*.63)*.006;
      q.y+=sin(p.x*7.-flow*.8)*.019*strength+cos(flow*.72)*.006;
      vec3 color=texture2D(artwork,clamp(q,.001,.999)).rgb;
      float glow=.5+.5*sin(p.x*8.-p.y*5.-time*.55);
      color*=1.+glow*.10*strength;
      gl_FragColor=vec4(color,1.);
    }`;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
      throw Error("Shader unavailable");
    return s;
  }
  try {
    const program = gl.createProgram();
    gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error("Renderer unavailable");
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const time = gl.getUniformLocation(program, "time");
    const resolution = gl.getUniformLocation(program, "resolution");
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    for (const param of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
      gl.texParameteri(gl.TEXTURE_2D, param, gl.CLAMP_TO_EDGE);
    for (const param of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
      gl.texParameteri(gl.TEXTURE_2D, param, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "artwork"), 0);
    function render() {
      const ratio = Math.min(devicePixelRatio || 1, 1.5);
      const width = Math.round(hero.clientWidth * ratio);
      const height = Math.round(hero.clientHeight * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      gl.viewport(0, 0, width, height);
      gl.uniform2f(resolution, width, height);
      gl.uniform1f(time, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    function tick(now) {
      if (!previous) previous = now;
      const delta = now - previous;
      if (delta >= 32) {
        const seconds = Math.min(delta, 80) / 1000;
        elapsed += seconds * motionSpeed;
        previous = now;
        render();
      }
      frame = requestAnimationFrame(tick);
    }
    function sync() {
      cancelAnimationFrame(frame);
      previous = 0;
      const running = ready && !paused && visible && !document.hidden;
      hero.dataset.motion = running ? "running" : "paused";
      button.textContent = paused ? "背景の動きを再生" : "背景の動きを停止";
      button.setAttribute("aria-pressed", String(paused));
      if (running) frame = requestAnimationFrame(tick);
    }
    const image = new Image();
    image.onload = () => {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      ready = true;
      render();
      canvas.classList.add("is-ready");
      button.hidden = false;
      sync();
    };
    image.src = new URL("./blue-filaments.webp", import.meta.url).href;
    for (let i = 0; i < 22; i++) {
      const dot = document.createElement("i");
      dot.style.cssText = `--x:${36 + ((i * 29) % 63)}%;--y:${8 + ((i * 17) % 79)}%;--duration:${(12 + (i % 9)) / motionSpeed}s;--delay:-${(i * 0.91) / motionSpeed}s;--size:${i % 4 === 0 ? 3 : 2}px`;
      particles.append(dot);
    }
    button.addEventListener("click", () => {
      paused = !paused;
      sync();
    });
    reduced.addEventListener("change", () => {
      paused = reduced.matches;
      sync();
    });
    document.addEventListener("visibilitychange", sync);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(hero);
    new ResizeObserver(() => {
      if (ready) render();
    }).observe(hero);
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      ready = false;
      sync();
      canvas.classList.remove("is-ready");
      button.hidden = true;
    });
  } catch {
    // Keep the original CSS background if GPU rendering is unavailable.
    canvas.remove();
  }
}
