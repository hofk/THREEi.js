// Example: implicit surface, two cylinder parallel

const x1 = 1.1;
const z1 = 0.5;
const r1 = 0.4;
const f1 = (x,y,z) => ( (x-x1)*(x-x1) + (z-z1)*(z-z1) - r1 ); 

const x2 = -0.7;
const z2 = 0.5;
const r2 = 0.8;
const f2 = (x,y,z) => ( (x-x2)*(x-x2) + (z-z2)*(z-z2) - r2 );

const s = 0.15;
const isf = (x,y,z) => ( f1(x,y,z)*f2(x,y,z) - s ); // IMPLICIT SURFACE Function

const dx = (x,y,z) => ( 2*(x-x1)*f2(x,y,z) + 2*(x-x2)*f1(x,y,z) ); // PARTIAL DERIVATE to x
const dy = (x,y,z) => ( 0 ); // PARTIAL DERIVATE to y
const dz = (x,y,z) => ( 2*(z-z1)*f2(x,y,z) + 2*(z-z2)*f1(x,y,z) ); // PARTIAL DERIVATE to z

const xs = 2.0; // x START POINT
const ys = 0; // y START POINT
const zs = 0; // z START POINT

const e = 0.001; // epsilon 
const d = 0.1; // rough edge length of triangles

const opt = {};
opt.fc = 20000; // max. face count 
opt.pc = 10000; // max. positions count
opt.b = [ Infinity, -Infinity, 4, -4, Infinity, -Infinity ]; // bounds xMax, xMin, yMax, yMin, zMax, zMin
