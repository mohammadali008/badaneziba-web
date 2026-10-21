#version 330
uniform vec2 resolution;
uniform float phase;
out vec4 fragColor;

// Original 3D art direction for Badane Ziba: a continuously flowing copper-wax ribbon.
const float PI = 3.14159265359;
mat2 turn(float a) { float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }

float ribbon(vec3 p) {
    p.y -= 0.10 * sin(phase);
    p.xz = turn(0.38 + 0.36*sin(phase)) * p.xz;
    p.yz = turn(0.45 + 0.18*cos(phase)) * p.yz;
    p.xy = turn(phase) * p.xy;
    float a = atan(p.y,p.x);
    float radius = 1.12 + 0.10 * sin(3.0*a + 2.0*phase);
    vec2 section = vec2(length(p.xy)-radius,p.z);
    section = turn(a + phase + 0.30*sin(2.0*a)) * section;
    return (length(section / vec2(0.35,0.165)) - 1.0) * 0.15;
}
float scene(vec3 p) {
    float d = ribbon(p);
    vec3 a = vec3(1.69*cos(phase+0.3),0.9*sin(phase+0.3),0.65*sin(phase));
    vec3 b = vec3(1.80*cos(phase+3.5),1.2*sin(phase+3.5),0.5*cos(phase));
    d = min(d,length(p-a)-0.105);
    d = min(d,length(p-b)-0.065);
    return d;
}
vec3 normalAt(vec3 p) {
    vec2 e=vec2(0.0015,0.0);
    return normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),scene(p+e.yxy)-scene(p-e.yxy),scene(p+e.yyx)-scene(p-e.yyx)));
}
vec3 studio(vec3 v) {
    vec3 color = vec3(0.017,0.010,0.007);
    color += vec3(5.8,4.5,3.1) * pow(max(dot(v,normalize(vec3(-1.3,1.6,1.6))),0.0),16.0);
    color += vec3(2.8,3.0,3.3) * pow(max(dot(v,normalize(vec3(1.2,0.7,1.4))),0.0),42.0);
    color += vec3(3.4,0.38,0.055) * pow(max(dot(v,normalize(vec3(-1.0,-0.1,-1.6))),0.0),6.0);
    // Tall rectangular softboxes make the changing surface geometry legible.
    float stripA = exp(-pow((v.x+0.28)*10.0,2.0)) * smoothstep(-0.3,0.8,v.y) * smoothstep(-0.15,0.6,v.z);
    float stripB = exp(-pow((v.y-0.48)*18.0,2.0)) * smoothstep(-0.6,0.4,v.z);
    color += vec3(2.8,2.4,1.9)*stripA + vec3(1.4,0.85,0.42)*stripB;
    return color;
}
vec3 aces(vec3 x) { return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }

void main() {
    vec2 uv=(gl_FragCoord.xy-0.5*resolution)/resolution.y;
    vec3 origin=vec3(0.0,0.1,5.7);
    vec3 direction=normalize(vec3(uv, -2.02));
    float travel=0.0;
    bool hit=false;
    for(int i=0;i<112;i++) {
        float d=scene(origin+direction*travel);
        if(d<0.0011) {hit=true;break;}
        travel+=max(d*0.85,0.0005);
        if(travel>9.0) break;
    }
    vec3 color=vec3(0.006,0.006,0.0055);
    float halo=exp(-dot(uv*vec2(1.0,0.85),uv*vec2(1.0,0.85))*2.2);
    color+=vec3(0.009,0.002,0.0008)*halo;
    if(hit) {
        vec3 p=origin+direction*travel;
        vec3 n=normalAt(p);
        vec3 reflection=reflect(direction,n);
        vec3 copper=vec3(0.83,0.29,0.065);
        float variation=0.5+0.5*sin(1.4*p.y+phase);
        copper=mix(copper,vec3(0.60,0.095,0.035),variation*0.32);
        float fresnel=pow(1.0-max(dot(n,-direction),0.0),5.0);
        vec3 f0=mix(copper,vec3(1.0),fresnel*0.65);
        color=studio(reflection)*f0*0.85;
        float softLight=max(dot(n,normalize(vec3(-0.6,0.9,1.2))),0.0);
        color+=copper*(0.09+0.20*softLight);
        color+=vec3(0.12,0.014,0.002)*pow(1.0-max(dot(n,-direction),0.0),2.0);
        float ao=1.0;
        for(int j=1;j<=4;j++) {
            float h=0.045*float(j);
            ao-=max(0.0,h-scene(p+n*h))*0.5;
        }
        color*=clamp(ao,0.4,1.0);
    }
    // A subtle stage underneath the sculpture; no photographs or screen-space image motion.
    float stage=exp(-pow((uv.y+0.57)*23.0,2.0))*exp(-uv.x*uv.x*3.5);
    if(!hit) color+=vec3(0.11,0.022,0.003)*stage;
    color=pow(aces(color),vec3(1.0/2.2));
    fragColor=vec4(color,1.0);
}
