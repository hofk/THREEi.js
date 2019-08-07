// Example: implicit surface, two cylinder sphere

const x1 = 1.1;
const z1 = 0.5;
const r1 = 0.14;
const f1 = (x,y,z) => ( (x-x1)*(x-x1) + (z-z1)*(z-z1) - r1 ); // cylinder 1
const x2 = -0.7;
const z2 = 0.5;
const r2 = 0.8;
const f2 = (x,y,z) => ( (x-x2)*(x-x2) + (z-z2)*(z-z2) - r2 ); // cylinder 2
const x3 = 0.0;
const y3 = 0.5;
const z3 = 0.0;
const r3 = 3.1;
const f3 = (x,y,z) => ( (x-x3)*(x-x3) + (y-y3)*(y-y3) + (z-z3)*(z-z3) - r3 ); // sphere

const s = 0.4;
const isf = (x,y,z) => ( f1(x,y,z)*f2(x,y,z)*f3(x,y,z) - s ); // IMPLICIT SURFACE Function

const dx = (x,y,z) => ( 2*(x-x1)*f2(x,y,z)*f3(x,y,z) + 2*(x-x2)*f1(x,y,z)*f3(x,y,z) + 2*(x-x3)*f1(x,y,z)*f2(x,y,z) ); // PARTIAL DERIVATE to x
const dy = (x,y,z) => ( 2*(y-y3) *f1(x,y,z)*f2(x,y,z)); // PARTIAL DERIVATE to y
const dz = (x,y,z) => ( 2*(z-z1)*f2(x,y,z)*f3(x,y,z) + 2*(z-z2)*f1(x,y,z)*f3(x,y,z) + 2*(z-z3)*f1(x,y,z)*f2(x,y,z) ); // PARTIAL DERIVATE to z


const xs = 3.4; // x START POINT
const ys = 0; // y START POINT
const zs = 0; // z START POINT

const d = 0.08; // rough edge length of triangles
const e = 0.001; // epsilon 

const fc = 30000; // face count 
const pc = 15000; // positions count

const opt = { b: [ Infinity, -Infinity, 2.6, -2.6, Infinity, -Infinity ] }; // bounds xMax, xMin, yMax, yMin, zMax, zMin }

/* works to
const xs = 2.6; // x START POINT
const ys = 0; // y START POINT
const zs = 0; // z START POINT

const e = 0.001; // epsilon 
const d = 0.1; // rough edge length of triangles

const opt = { b: [ Infinity, -Infinity, 3, -3, Infinity, -Infinity ] }; // bounds xMax, xMin, yMax, yMin, zMax, zMin }
*/