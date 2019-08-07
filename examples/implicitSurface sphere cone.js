// Example: implicit surface:  sphere cone

const f1 = ( x, y, z ) => ( x*x + y*y - z*z ); // cone
const f2 = ( x, y, z ) => ( x*x + (y-1)*(y-1) + z*z - 1 ); //sphere

const isf = ( x, y, z ) => ( f1( x, y, z ) * f2( x, y, z ) - 0.4 );// IMPLICIT SURFACE Function
const dx = ( x, y, z ) => ( 2*x*( f1( x, y, z ) + f2( x, y, z ) ) );// PARTIAL DERIVATE to x
const dy = ( x, y, z ) => ( 2*(y-1)*f1( x, y, z ) + 2*y*f2( x, y, z) );// PARTIAL DERIVATE to y
const dz = ( x, y, z ) => ( 2*z*( f1( x, y, z ) - f2( x, y, z ) ) );// PARTIAL DERIVATE to z

const xs = 1.1; // x START POINT
const ys = 0; // y START POINT
const zs = 0; // z START POINT

const d = 0.25; // rough edge length of triangles
const e = 0.001; // epsilon 

const opt = {};
opt.b = [ 10, -10, 10, -10, 3, 0]; // bounds
opt.fc = 6000; // max. face count 
opt.pc = 3000; // max. positions count
