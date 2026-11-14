// Procedural GLSL for every body in the scene — no texture files needed.

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
float fbm(vec3 p){
  float a=0.5, s=0.0;
  for(int i=0;i<5;i++){ s+=a*snoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; }
  return s;
}
float fbm3(vec3 p){
  float a=0.5, s=0.0;
  for(int i=0;i<3;i++){ s+=a*snoise(p); p=p*2.03+vec3(1.7,9.2,3.1); a*=0.5; }
  return s;
}
vec3 rotY(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);}
vec3 rotAxis(vec3 p,vec3 k,float a){float c=cos(a),s=sin(a);return p*c+cross(k,p)*s+k*dot(k,p)*(1.0-c);}
`;

export const bodyVertex = /* glsl */ `
varying vec3 vObj;
varying vec3 vWN;
varying vec3 vWP;
void main(){
  vObj = position;
  vWN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

// PTYPE: 0 rocky · 1 earth · 2 gas giant · 3 colour-shifting clouds · 4 ice giant
export const planetFragment = /* glsl */ `
uniform float uTime;
uniform float uSeed;
uniform float uSpot;
uniform float uRadius;
uniform vec3 uA;
uniform vec3 uB;
uniform vec3 uC;
uniform vec3 uAtm;
varying vec3 vObj;
varying vec3 vWN;
varying vec3 vWP;
${NOISE}

#if PTYPE == 2
const vec3 SPOT = vec3(0.0, -0.3387, 0.9409);
vec3 gasSample(vec3 p0, float tt, float so){
  vec3 p = p0;
  float inside = 0.0;
  float r = 9.0;
  if (uSpot > 0.5) {
    vec3 e1 = normalize(cross(vec3(0.0,1.0,0.0), SPOT));
    vec3 e2 = cross(SPOT, e1);
    vec2 q = vec2(dot(p,e1), dot(p,e2)) / vec2(0.36, 0.2);
    r = length(q) + (dot(p,SPOT) < 0.0 ? 9.0 : 0.0);
    inside = smoothstep(1.35, 0.2, r);
    // the great storm: a vortex that keeps turning
    p = rotAxis(p, SPOT, inside * (1.6 + tt * 3.0));
  }
  float lat = p.y;
  // neighbouring bands blow in opposite directions
  float vel = sin(lat * 17.0);
  p = rotY(p, vel * tt * 0.5 * (1.0 - inside));
  float n  = fbm(p * vec3(2.6, 6.0, 2.6) + uSeed + so);
  float n2 = fbm(p * vec3(6.0, 15.0, 6.0) + uSeed * 2.0 + so);
  float n3 = fbm3(p * vec3(14.0, 30.0, 14.0) + so);
  float band = lat * 17.0 + n * 1.25 + n2 * 0.5;
  float b = sin(band) * 0.5 + 0.5;
  vec3 col = mix(uB, uA, smoothstep(0.25, 0.75, b));
  col = mix(col, uC, 0.35 * smoothstep(0.6, 1.0, sin(band * 0.5 + 1.7)));
  col *= 0.86 + 0.26 * n2 + 0.14 * n3;
  col = mix(col, uB * 0.6, smoothstep(0.7, 1.0, abs(lat)));
  float sm = smoothstep(1.0, 0.72, r);
  vec3 sc = uC * (0.8 + 0.45 * fbm3(p * 7.0 + so));
  sc = mix(sc, uC * 1.25 + 0.06, smoothstep(0.55, 0.0, r) * 0.45);
  col = mix(col, uA * 1.05, smoothstep(1.4, 1.02, r) * (1.0 - sm) * 0.55);
  col = mix(col, sc, sm);
  return col;
}
#endif

void main(){
  vec3 p = normalize(vObj);
  vec3 N = normalize(vWN);
  vec3 L = normalize(-vWP);               // the sun sits at the origin
  vec3 V = normalize(cameraPosition - vWP);
  vec3 albedo = vec3(0.5);
  vec3 emissive = vec3(0.0);
  float spec = 0.0;

#if PTYPE == 0
  float h = fbm(p * 2.2 + uSeed);
  float d = fbm(p * 6.0 + uSeed + 4.0);
  float ridge = 1.0 - abs(snoise(p * 4.0 + uSeed));
  float height = h * 0.7 + d * 0.3 + ridge * 0.15;
  albedo = mix(uA, uB, smoothstep(-0.35, 0.5, h + d * 0.3));
  albedo = mix(albedo, uC, smoothstep(0.05, 0.6, fbm(p * 3.5 + uSeed + 11.0)) * 0.8);
  albedo *= 0.8 + 0.3 * ridge;
  // screen-space bump mapping
  vec3 dpx = dFdx(vWP), dpy = dFdy(vWP);
  float hx = dFdx(height), hy = dFdy(height);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  vec3 grad = sign(det) * (hx * r1 + hy * r2);
  N = normalize(abs(det) * N - 0.05 * uRadius * grad);
#elif PTYPE == 1
  float cont = fbm(p * 1.6 + uSeed) + 0.25 * fbm(p * 5.0 + uSeed);
  float land = smoothstep(0.02, 0.08, cont);
  vec3 ocean = mix(uA * 0.55, uA * 1.4, smoothstep(-0.6, 0.02, cont));
  vec3 landCol = mix(uB, uC, smoothstep(0.15, 0.6, cont + 0.3 * snoise(p * 8.0)));
  float ice = smoothstep(0.78, 0.9, abs(p.y) + 0.08 * snoise(p * 6.0));
  albedo = mix(ocean, landCol, land);
  albedo = mix(albedo, vec3(0.95), ice);
  vec3 pc = rotY(p, uTime * 0.02);
  float c = smoothstep(0.05, 0.6, fbm(pc * 3.0 + vec3(0.0, uTime * 0.01, 0.0)) + 0.3 * fbm3(pc * 9.0));
  albedo = mix(albedo, vec3(1.0), c * 0.85);
  spec = pow(max(dot(reflect(-L, N), V), 0.0), 40.0) * (1.0 - land) * (1.0 - c) * 0.7;
  float nl0 = dot(N, L);
  float city = step(0.62, snoise(p * 34.0) * 0.5 + 0.5) * smoothstep(0.1, 0.3, cont);
  emissive = vec3(1.0, 0.72, 0.35) * city * land * (1.0 - ice) * (1.0 - c) * smoothstep(0.05, -0.25, nl0) * 1.6;
#elif PTYPE == 2
  float t = uTime * 0.035;
  float ph1 = fract(t), ph2 = fract(t + 0.5);
  vec3 c1 = gasSample(p, (ph1 - 0.5) * 4.0, floor(t) * 3.1);
  vec3 c2 = gasSample(p, (ph2 - 0.5) * 4.0, floor(t + 0.5) * 3.1 + 1.7);
  albedo = mix(c2, c1, 1.0 - abs(2.0 * ph1 - 1.0));
#elif PTYPE == 3
  vec3 q = p + 0.35 * vec3(snoise(p * 1.5 + uTime * 0.03), snoise(p * 1.5 + 7.0 + uTime * 0.03), snoise(p * 1.5 + 13.0));
  float n = fbm(q * 2.5 + uSeed);
  float n2 = fbm3(q * 5.0 + 20.0);
  float tc = n * 1.1 + p.y * 0.7 + uTime * 0.045;
  float w1 = pow(0.5 + 0.5 * cos(6.2832 * tc), 2.0);
  float w2 = pow(0.5 + 0.5 * cos(6.2832 * (tc - 0.3333)), 2.0);
  float w3 = pow(0.5 + 0.5 * cos(6.2832 * (tc - 0.6667)), 2.0);
  albedo = (uA * w1 + uB * w2 + uC * w3) / (w1 + w2 + w3);
  albedo *= 0.75 + 0.4 * n2;
  emissive = albedo * 0.1;
#else
  float n = fbm(p * vec3(1.5, 5.0, 1.5) + uSeed + vec3(uTime * 0.01, 0.0, 0.0));
  float band = p.y * 5.0 + n * 0.7;
  albedo = mix(uB, uA, 0.5 + 0.5 * sin(band));
  albedo = mix(albedo, uC, smoothstep(0.35, 0.9, fbm(p * 3.0 + uSeed + uTime * 0.008)) * 0.5);
#endif

  float nl = dot(N, L);
  float diff = pow(max(nl, 0.0), 0.85);
  float fres = pow(1.0 - max(dot(normalize(vWN), V), 0.0), 3.0);
  vec3 col = albedo * (diff * 1.3 + 0.035) + vec3(spec) + emissive;
  col += uAtm * fres * (0.12 + smoothstep(-0.2, 0.6, nl)) * 0.55;
  gl_FragColor = vec4(col, 1.0);
}
`;

export const sunFragment = /* glsl */ `
uniform float uTime;
varying vec3 vObj;
varying vec3 vWN;
varying vec3 vWP;
${NOISE}
void main(){
  vec3 p = normalize(vObj);
  vec3 V = normalize(cameraPosition - vWP);
  float n  = fbm(p * 3.0 + vec3(0.0, uTime * 0.07, 0.0));
  float n2 = fbm(p * 8.0 - vec3(uTime * 0.1) + n);
  float cells = 1.0 - abs(snoise(p * 16.0 + vec3(uTime * 0.12, 0.0, n)));
  float v = 0.55 + 0.32 * n + 0.26 * n2 + 0.12 * cells;
  vec3 col = mix(vec3(1.0, 0.22, 0.02), vec3(1.0, 0.68, 0.2), smoothstep(0.25, 0.85, v));
  col = mix(col, vec3(1.0, 0.93, 0.7), smoothstep(0.92, 1.3, v));
  float mu = max(dot(normalize(vWN), V), 0.0);
  col *= 0.6 + 0.55 * mu;
  col += vec3(1.0, 0.45, 0.1) * pow(1.0 - mu, 2.5) * 0.9;
  gl_FragColor = vec4(col * 1.02, 1.0);
}
`;

export const glowVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// Billboard halo. uInner = radius (in uv units, 0..1) of the body it surrounds.
export const glowFragment = /* glsl */ `
uniform float uTime;
uniform vec3 uColor;
uniform float uInner;
uniform float uRays;
varying vec2 vUv;
${NOISE}
void main(){
  vec2 c = vUv * 2.0 - 1.0;
  float d = length(c);
  float a = atan(c.y, c.x);
  float t = clamp((d - uInner) / (1.0 - uInner), 0.0, 1.0);
  float glow = pow(1.0 - t, 3.2);
  float rays = 0.5 + 0.5 * snoise(vec3(cos(a) * 2.5, sin(a) * 2.5, uTime * 0.12 + d * 1.5));
  glow *= mix(1.0, 0.55 + 0.9 * rays, uRays * smoothstep(0.0, 0.35, t));
  glow *= smoothstep(1.0, 0.85, d);
  gl_FragColor = vec4(uColor * glow, glow);
}
`;

export const ringFragment = /* glsl */ `
uniform float uInnerR;
uniform float uOuterR;
uniform float uPlanetR;
uniform vec3 uCenter;
uniform vec3 uColor;
varying vec3 vObj;
varying vec3 vWP;
varying vec3 vWN;
${NOISE}
void main(){
  float r = length(vObj.xy);
  float t = (r - uInnerR) / (uOuterR - uInnerR);
  float bands = 0.55 + 0.45 * snoise(vec3(t * 14.0, 3.0, 1.0)) + 0.25 * snoise(vec3(t * 60.0, 8.0, 2.0));
  float gap = 1.0 - smoothstep(0.035, 0.0, abs(t - 0.6)) * 0.92;
  float alpha = smoothstep(0.0, 0.04, t) * smoothstep(1.0, 0.94, t) * clamp(bands, 0.08, 1.0) * gap;
  // shadow cast by the planet onto its rings
  vec3 L = normalize(-vWP);
  vec3 oc = vWP - uCenter;
  float b = dot(oc, L);
  float disc = b * b - (dot(oc, oc) - uPlanetR * uPlanetR);
  float shadow = (b < 0.0) ? 1.0 - 0.88 * smoothstep(0.0, uPlanetR * 0.6, disc) : 1.0;
  vec3 col = mix(uColor * 0.7, uColor * 1.15, bands) * (0.25 + 0.95 * shadow);
  gl_FragColor = vec4(col, alpha * 0.9);
}
`;

export const starVertex = /* glsl */ `
attribute float aSize;
attribute float aPhase;
attribute vec3 aColor;
uniform float uTime;
uniform float uPixelRatio;
varying vec3 vColor;
varying float vTw;
void main(){
  vColor = aColor;
  vTw = 0.7 + 0.3 * sin(uTime * (0.6 + fract(aPhase) * 1.6) + aPhase * 6.2832);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * uPixelRatio * (0.8 + 0.2 * vTw);
}
`;

export const starFragment = /* glsl */ `
varying vec3 vColor;
varying float vTw;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(max(1.0 - d, 0.0), 2.2);
  gl_FragColor = vec4(vColor * vTw * a, a);
}
`;

export const nebulaFragment = /* glsl */ `
varying vec3 vObj;
${NOISE}
void main(){
  vec3 d = normalize(vObj);
  float n  = fbm(d * 1.4 + 3.0);
  float n2 = fbm(d * 2.6 + 17.0 + n * 0.6);
  float bandY = dot(d, normalize(vec3(0.25, 1.0, 0.15)));
  float milky = smoothstep(0.5, 0.0, abs(bandY)) * (0.5 + 0.5 * fbm3(d * 5.0));
  vec3 col = vec3(0.004, 0.006, 0.014);
  col += vec3(0.20, 0.07, 0.32) * smoothstep(0.05, 0.75, n) * 0.11;
  col += vec3(0.04, 0.16, 0.34) * smoothstep(0.1, 0.8, n2) * 0.10;
  col += vec3(0.30, 0.10, 0.12) * smoothstep(0.35, 0.9, n * n2 * 4.0) * 0.06;
  col += vec3(0.10, 0.11, 0.17) * milky * 0.16;
  gl_FragColor = vec4(col, 1.0);
}
`;

export const tailVertex = /* glsl */ `
attribute float aT;
attribute float aPhase;
uniform float uTime;
uniform float uPixelRatio;
uniform float uScale;
varying float vT;
void main(){
  vT = aT;
  vec3 p = position;
  p.yz *= 1.0 + 0.25 * sin(uTime * 1.3 + aPhase * 6.2832);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPixelRatio * uScale * mix(2.2, 0.5, aT) / max(-mv.z, 1.0);
}
`;

export const tailFragment = /* glsl */ `
uniform vec3 uColor;
varying float vT;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = pow(max(1.0 - d, 0.0), 2.0) * pow(1.0 - vT, 1.6) * 0.55;
  gl_FragColor = vec4(uColor * a, a);
}
`;
