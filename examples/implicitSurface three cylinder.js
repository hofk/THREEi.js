// Example: implicit surface, three cylinder

const f1 = (x,y,z) => ( x*x + y*y - 1 );
const f2 = (x,y,z) => ( y*y + z*z - 1 );
const f3 = (x,y,z) => ( z*z + x*x - 1 );

const isf = (x,y,z) => ( f1(x,y,z)*f2(x,y,z)*f3(x,y,z) - 0.04 ); // IMPLICIT SURFACE Function
const dx = (x,y,z) => ( 2*x*( f1(x,y,z)*f2(x,y,z) + f2(x,y,z)*f3(x,y,z) ) ); // PARTIAL DERIVATE to x
const dy = (x,y,z) => ( 2*y*( f1(x,y,z)*f3(x,y,z) + f2(x,y,z)*f3(x,y,z) ) ); // PARTIAL DERIVATE to y
const dz = (x,y,z) => ( 2*z*( f1(x,y,z)*f2(x,y,z) + f1(x,y,z)*f3(x,y,z) ) ); // PARTIAL DERIVATE to z

const xs = 1.5; // x START POINT
const ys = 1.1; // y START POINT
const zs = 0; // z START POINT

const d = 0.1; // rough edge length of triangles
const e = 0.01; // epsilon 

const opt = { b: [ 5, -2, 2, -2, 2, -2 ] }; // bounds xMax, xMin, yMax, yMin, zMax, zMin
