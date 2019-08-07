// Example: implicit surface torus sphere:

const R = 1;
const a = 0.25;
const y0 =  1;
const f0 = ( x, y, z ) => ( x*x + y*y + z*z + R*R - a*a );

const f1 = ( x, y, z ) => ( f0( x, y, z )*f0( x, y, z ) - 4*R*R*( x*x + y*y ) ); // torus
const f2 = ( x, y, z ) => ( x*x + (y-y0)*(y-y0) + z*z - 1 ); //sphere

const s = 0.3;
const isf = ( x, y, z ) => ( f1( x, y, z )*f2( x, y, z ) - s );// IMPLICIT SURFACE Function
const dx = ( x, y, z ) => ( 4*x*(f0( x, y, z )-2*R*R)*f2( x, y, z ) + 2*x*f1( x, y, z ) ); // PARTIAL DERIVATE to x
const dy = ( x, y, z ) => ( 4*y*(f0( x, y, z )-2*R*R)*f2( x, y, z ) + 2*(y-y0)*f1( x, y, z ) ); // PARTIAL DERIVATE to y
const dz = ( x, y, z ) => ( 4*z*f0( x, y, z )*f2( x, y, z ) + 2*z*f1( x, y, z ) ); // PARTIAL DERIVATE to z

const xs = 0; // x START POINT
const ys = 1.1; // y START POINT
const zs = 0; // z START POINT

const d = 0.07; // rough edge length of triangles
const e = 0.001; // epsilon 
