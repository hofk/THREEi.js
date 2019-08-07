// Example: implicit surface:  sphere cylinder

const f1 = ( x, y, z ) => ( x*x + z*z - 1 ); // cylinder
const f2 = ( x, y, z ) => ( (x-0.6)*(x-0.6) + y*y + z*z - 2.6 ); //sphere

const isf = ( x, y, z ) => ( f1( x, y, z ) * f2( x, y, z ) - 0.2 );// IMPLICIT SURFACE Function
const dx = ( x, y, z ) => ( 2*x*( f1( x, y, z ) + f2( x, y, z ) ) );// PARTIAL DERIVATE to x
const dy = ( x, y, z ) => ( 2*y*f1( x, y, z ) );// PARTIAL DERIVATE to y
const dz = ( x, y, z ) => ( 2*z*( f1( x, y, z ) + f2( x, y, z ) ) );// PARTIAL DERIVATE to z

const xs = 2.1; // x START POINT
const ys = 0; // y START POINT
const zs = 0; // z START POINT

const d = 0.1; // rough edge length of triangles
const e = 0.001; // epsilon 

const opt = {};
opt.fc = 14000; // max. face count 
opt.pc =  7000; // max. positions count
opt.b = [ Infinity, -Infinity, 3.2, -2.8, Infinity, -Infinity ]; //  bounds for cylinder
