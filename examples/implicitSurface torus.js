// Example: implicit surface torus:

const R = 2;
const a = 0.5;

const f0 = ( x, y, z ) => ( x*x + y*y + z*z + R*R - a*a )

const isf = ( x, y, z ) => ( f0( x, y, z )*f0( x, y, z ) - 4*R*R*( x*x + y*y ) );// IMPLICIT SURFACE Function
const dx = ( x, y, z ) => ( 4*x*f0( x, y, z ) - 8*R*R*x ); // PARTIAL DERIVATE to x
const dy = ( x, y, z ) => ( 4*y*f0( x, y, z ) - 8*R*R*y ); // PARTIAL DERIVATE to y
const dz = ( x, y, z ) => ( 4*z*f0( x, y, z )); // PARTIAL DERIVATE to z

const xs = 0; // x START POINT
const ys = 1.1; // y START POINT
const zs = 0; // z START POINT

const e = 0.001; // epsilon 
const d = 0.06; // rough edge length of triangles

const  opt = { b: [ 1.25 , -Infinity, Infinity, -Infinity, Infinity, -Infinity ] };

