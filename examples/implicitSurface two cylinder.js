// Example: implicit surface, two cylinder

const f1 = (x,y,z) => ( x*x + y*y - 1 );
const f2 = (x,y,z) => ( y*y + z*z - 1 );

const isf = (x,y,z) => ( f1(x,y,z)*f2(x,y,z) - 0.08 ); // IMPLICIT SURFACE Function
const dx = (x,y,z) => ( 2*x*f2(x,y,z) ); // PARTIAL DERIVATE to x
const dy = (x,y,z) => ( 2*y*( f1(x,y,z) + f2(x,y,z) ) ); // PARTIAL DERIVATE to y
const dz = (x,y,z) => ( 2*z*f1(x,y,z) ); // PARTIAL DERIVATE to z

const xs = 0.2; // x START POINT
const ys = 1.1; // y START POINT
const zs = 0.1; // z START POINT

const d = 0.15; // rough edge length of triangles
const e = 0.001; // epsilon 

const  opt = { fc: 16000, pc: 8000, b: [ 3, -3, Infinity, -Infinity, 0.9, -1.3 ] }; // bounds xMax, xMin, yMax, yMin, zMax, zMin
 