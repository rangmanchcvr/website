import { Renderer, Program, Mesh, Triangle, Color } from 'https://esm.sh/ogl@1.0.11';

const PAD = 20;

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform vec2 uCenter;
uniform vec2 uHalfSize;
uniform float uRadius;
uniform float uAngle;
uniform float uPx;
uniform vec3 uLineColor;
uniform vec3 uBaseColor;
uniform float uIntensity;
uniform float uShineSize;
uniform float uShineFade;
uniform float uThickness;
uniform float uBaseWidth;

out vec4 fragColor;

float sdRoundedRect(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float shapeSDF(vec2 p) { return sdRoundedRect(p, uHalfSize, uRadius); }

float gaussianLine(float d, float sigma) {
  float x = d / (sigma + 1e-6);
  float k = mix(1.0, 1.6, smoothstep(0.0, 1.5, x));
  return exp(-k * x * x);
}

void main() {
  vec2 p = gl_FragCoord.xy - uCenter;
  float d = shapeSDF(p);
  vec2 L = vec2(cos(uAngle), sin(uAngle));

  float base = (1.0 - smoothstep(0.0, uBaseWidth, abs(d))) * 0.45;

  vec2 nEll = normalize(p / (uHalfSize * uHalfSize) + 1e-6);
  float phi = acos(clamp(abs(dot(nEll, L)), 0.0, 1.0));
  float rim = 1.0 - smoothstep(uShineSize - uShineFade, uShineSize + uShineFade + 1e-4, phi);
  float line = gaussianLine(d, uThickness);
  float edgeClamp = 1.0 - smoothstep(0.5 * uPx, 3.0 * uPx, abs(d));
  float hi = line * rim * edgeClamp * uIntensity;

  vec3 col = uBaseColor * base + uLineColor * hi;
  float a = clamp(base + hi, 0.0, 1.0);
  fragColor = vec4(col, a);
}
`;

class SpecularButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const size = this.getAttribute('size') || 'lg';
    const radius = parseFloat(this.getAttribute('radius')) || 999;
    const tint = this.getAttribute('tint') || '#ffffff';
    const tintOpacity = parseFloat(this.getAttribute('tint-opacity')) || 0;
    const blur = parseFloat(this.getAttribute('blur')) || 0;
    const textColor = this.getAttribute('text-color') || '#ffffff';
    const lineColor = this.getAttribute('line-color') || '#9d0000';
    const baseColor = this.getAttribute('base-color') || '#525252';
    const intensity = parseFloat(this.getAttribute('intensity')) || 1;
    const shineSize = parseFloat(this.getAttribute('shine-size')) || 10;
    const shineFade = parseFloat(this.getAttribute('shine-fade')) || 40;
    const thickness = parseFloat(this.getAttribute('thickness')) || 1;
    const speed = parseFloat(this.getAttribute('speed')) || 0.35;
    const followMouse = this.getAttribute('follow-mouse') !== 'false';
    const proximity = parseFloat(this.getAttribute('proximity')) || 250;
    const autoAnimate = this.getAttribute('auto-animate') === 'true';
    const disabled = this.hasAttribute('disabled');
    const href = this.getAttribute('href');

    this.shadowRoot.innerHTML = `
      <style>
        @import url('components/SpecularButton.css');
        .specular-button {
          --sb-radius: ${radius}px;
          --sb-tint: ${tint};
          --sb-tint-opacity: ${tintOpacity};
          --sb-blur: ${blur}px;
          --sb-text-color: ${textColor};
          text-decoration: none;
        }
        .btn-overture {
          background: transparent;
          color: #ffffff;
          border: 1px solid transparent;
        }
        .btn-overture:hover {
          background: transparent;
          border-color: transparent;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: none;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: .5rem;
          font-size: .85rem;
          letter-spacing: .06em;
          padding: 1rem 1.7rem;
          border-radius: 999px;
          transition: all .35s var(--ease-theatre);
        }
        ::slotted(i) {
          margin-left: 0.5rem;
        }
      </style>
      ${href 
        ? `<a href="${href}" class="specular-button specular-button--${size} btn btn-overture">` 
        : `<button type="button" class="specular-button specular-button--${size} btn btn-overture" ${disabled ? 'disabled' : ''}>`
      }
        <span class="specular-button__fx" aria-hidden="true"></span>
        <span class="specular-button__label"><slot></slot></span>
      ${href ? `</a>` : `</button>`}
    `;

    this.btn = this.shadowRoot.querySelector(href ? 'a' : 'button');
    this.fx = this.shadowRoot.querySelector('.specular-button__fx');

    const dpr = window.devicePixelRatio || 1;
    this.renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr });
    const gl = this.renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    this.addEventListener('click', (e) => {
      if (href && href.startsWith('#')) {
        e.preventDefault();
        if (window.lenis) {
          window.lenis.scrollTo(href);
        } else {
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });

    const geometry = new Triangle(gl);
    if (geometry.attributes.uv) delete geometry.attributes.uv;

    this.program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uCenter: { value: [0, 0] },
        uHalfSize: { value: [1, 1] },
        uRadius: { value: 0 },
        uAngle: { value: 2.4 },
        uPx: { value: dpr },
        uLineColor: { value: [1, 1, 1] },
        uBaseColor: { value: [0.32, 0.32, 0.32] },
        uIntensity: { value: 1 },
        uShineSize: { value: 0.17 },
        uShineFade: { value: 0.7 },
        uThickness: { value: 1 },
        uBaseWidth: { value: dpr }
      }
    });

    this.mesh = new Mesh(gl, { geometry, program: this.program });
    this.fx.appendChild(gl.canvas);

    this.sizeRef = { w: 1, h: 1 };
    this.resize = () => {
      const rect = this.btn.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      this.sizeRef.w = w;
      this.sizeRef.h = h;
      this.renderer.setSize(w + PAD * 2, h + PAD * 2);
      this.program.uniforms.uCenter.value = [(PAD + w / 2) * dpr, (PAD + h / 2) * dpr];
      this.program.uniforms.uHalfSize.value = [(w / 2) * dpr, (h / 2) * dpr];
    };
    
    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(this.btn);
    this.resize();

    this.pointerAngle = null;
    this.proximityT = 0;
    this.onPointerMove = e => {
      const rect = this.btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = Math.max(rect.left - e.clientX, 0, e.clientX - rect.right);
      const dy = Math.max(rect.top - e.clientY, 0, e.clientY - rect.bottom);
      const dist = Math.hypot(dx, dy);
      
      if (dist === 0) {
        const nx = (e.clientX - cx) / (rect.width / 2);
        const ny = (cy - e.clientY) / (rect.height / 2);
        this.pointerAngle = Math.atan2(2 / rect.height, -2 / rect.width) + nx * 0.3 + ny * 0.15;
      } else {
        this.pointerAngle = Math.atan2(cy - e.clientY, e.clientX - cx);
      }
      const t = Math.max(0, 1 - dist / Math.max(proximity, 1));
      this.proximityT = t * t * (3 - 2 * t);
    };
    window.addEventListener('pointermove', this.onPointerMove);

    this.angle = 2.4;
    this.idleAngle = 2.4;
    this.bright = 0;
    this.last = performance.now();
    
    this.lineC = new Color(lineColor);
    this.baseC = new Color(baseColor);

    this.update = now => {
      this.raf = requestAnimationFrame(this.update);
      const dt = Math.min((now - this.last) / 1000, 0.05);
      this.last = now;

      this.idleAngle += speed * dt;
      const steer = followMouse && this.pointerAngle != null && (!autoAnimate || this.proximityT > 0);
      const target = steer ? this.pointerAngle : this.idleAngle;
      const diff = ((target - this.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      this.angle += diff * (1 - Math.exp(-dt * 7));

      const brightTarget = autoAnimate ? 1 : this.proximityT;
      this.bright += (brightTarget - this.bright) * (1 - Math.exp(-dt * 8));

      this.program.uniforms.uAngle.value = this.angle;
      this.program.uniforms.uRadius.value = Math.min(radius, Math.min(this.sizeRef.w, this.sizeRef.h) / 2) * dpr;
      this.program.uniforms.uLineColor.value = [this.lineC.r, this.lineC.g, this.lineC.b];
      this.program.uniforms.uBaseColor.value = [this.baseC.r, this.baseC.g, this.baseC.b];
      this.program.uniforms.uIntensity.value = intensity * this.bright;
      this.program.uniforms.uShineSize.value = (shineSize * Math.PI) / 180;
      this.program.uniforms.uShineFade.value = (shineFade * Math.PI) / 180;
      this.program.uniforms.uThickness.value = thickness * dpr;
      
      this.renderer.render({ scene: this.mesh });
    };
    this.raf = requestAnimationFrame(this.update);
  }

  disconnectedCallback() {
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.ro) this.ro.disconnect();
    window.removeEventListener('pointermove', this.onPointerMove);
    const gl = this.renderer?.gl;
    if (gl) {
      if (gl.canvas.parentNode === this.fx) this.fx.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  }
}

customElements.define('specular-button', SpecularButton);
