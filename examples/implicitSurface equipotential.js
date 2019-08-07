// Example: implicit surface equipotential

const x1 =  0.866;
const y1 =  0.0;
const z1 =  0.5;

const r1 =  0.5;
const f1 = (x,y,z) => ( (x-x1)*(x-x1) + (y-y1)*(y-y1) + (z-z1)*(z-z1) - r1 ); 

const x2 =  0.0;
const y2 =  0.0;
const z2 = -1.0;

const r2 =  0.5;
const f2 = (x,y,z) => ( (x-x2)*(x-x2) + (y-y2)*(y-y2) + (z-z2)*(z-z2) - r2 );

const x3 = -0.866;
const y3 =  0.0;
const z3 =  0.5;

const r3 =  0.5;
const f3 = (x,y,z) => ( (x-x3)*(x-x3) + (y-y3)*(y-y3) + (z-z3)*(z-z3) - r3 );

const s = 0.5;
const isf = (x,y,z) => ( f1(x,y,z)*f2(x,y,z)*f3(x,y,z ) - s ); // IMPLICIT SURFACE Function
const dx = (x,y,z) => ( 2*(x-x1)*f2(x,y,z)*f3(x,y,z) + 2*(x-x2)*f1(x,y,z)*f3(x,y,z) + 2*(x-x3)*f1(x,y,z)*f2(x,y,z) ); // PARTIAL DERIVATE to x
const dy = (x,y,z) => ( 2*(y-y1)*f2(x,y,z)*f3(x,y,z) + 2*(y-y2)*f1(x,y,z)*f3(x,y,z) + 2*(y-y3)*f1(x,y,z)*f2(x,y,z) ); // PARTIAL DERIVATE to y
const dz = (x,y,z) => ( 2*(z-z1)*f2(x,y,z)*f3(x,y,z) + 2*(z-z2)*f1(x,y,z)*f3(x,y,z) + 2*(z-z3)*f1(x,y,z)*f2(x,y,z) ); // PARTIAL DERIVATE to z

const xs = 0; // x START POINT
const ys = 1 ; // y START POINT
const zs = 0; // z START POINT

const d = 0.05; // rough edge length of triangles
const e = 0.01; // epsilon 

