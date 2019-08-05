// Example: implicit surface, two cylinder

const f1 = (x,y,z) => ( x*x + y*y - 1 );
const f2 = (x,y,z) => ( y*y + z*z - 1 );

const isf = (x,y,z) => ( f1(x,y,z)*f2(x,y,z) - 0.25 ); // IMPLICIT SURFACE Function
const dx = (x,y,z) => ( 2*x*f2(x,y,z) ); // PARTIAL DERIVATE to x
const dy = (x,y,z) => ( 2*y*( f1(x,y,z) + f2(x,y,z) ) ); // PARTIAL DERIVATE to y
const dz = (x,y,z) => ( 2*z*f2(x,y,z) ); // PARTIAL DERIVATE to z

const xs = 0.2; // x START POINT
const ys = 1.1; // y START POINT
const zs = 0.1; // z START POINT

const d = 0.05; // rough edge length of triangles
const e = 0.001; // epsilon 

const fc = 20000; // face count 
const pc = 10000; // positions count

//works, but bounds not okay 
const b = [ 1.4, -1.4, Infinity, -Infinity, 1.4, -1.4 ]; // bounds xMax, xMin, yMax, yMin, zMax, zMin

// script crashe:
//const b = [ 1.5, -1.5, Infinity, -Infinity, 1.5, -1.5 ];