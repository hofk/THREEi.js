// Example: implicit surface, three balls

const f0 = (x,y,z) => ( x*x + y*y + z*z - 4 ); 
const f1 = (x,y,z) => ( (x+3)*(x+3) + y*y + z*z - 3 );
const f2 = (x,y,z) => ( x*x + (y-2)*(y-2) + (z-2)*(z-2) - 1.8 );

const isf = (x,y,z) => ( f0(x,y,z)*f1(x,y,z)*f2(x,y,z ) - 0.4 ); // IMPLICIT SURFACE Function
const dx = (x,y,z) => ( 2*x*f1(x,y,z)*f2(x,y,z) + 2*(x+3)*f0(x,y,z)*f2(x,y,z) + 2*x*f0(x,y,z)*f1(x,y,z) ); // PARTIAL DERIVATE to x
const dy = (x,y,z) => ( 2*y*f1(x,y,z)*f2(x,y,z) + 2*y*f0(x,y,z)*f2(x,y,z) + 2*(y-2)*f0(x,y,z)*f1(x,y,z) ); // PARTIAL DERIVATE to y
const dz = (x,y,z) => ( 2*z*f1(x,y,z)*f2(x,y,z) + 2*z*f0(x,y,z)*f2(x,y,z) + 2*(z-2)*f0(x,y,z)*f1(x,y,z) ); // PARTIAL DERIVATE to z

const xs = 0; // x START POINT
const ys = 4 ; // y START POINT
const zs = 0; // z START POINT

const d = 0.1; // rough edge length of triangles
const e = 0.001; // epsilon 

