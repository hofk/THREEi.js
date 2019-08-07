// Example: implicit surface genus2:

const isf = ( x, y, z ) => ( 2*y*( y*y - 3*x*x )*( 1 - z*z ) + ( x*x + y*y )*( x*x + y*y ) - ( 9*z*z - 1 )*( 1 - z*z ) );// IMPLICIT SURFACE Function
const dx = ( x, y, z ) => ( -12*x*y*( 1 - z*z ) + 4*x*( x*x + y*y ) );// PARTIAL DERIVATE to x
const dy = ( x, y, z ) => ( 6*( y*y - x*x )*( 1 - z*z ) + 4*y*( x*x + y*y ) );// PARTIAL DERIVATE to y
const dz = ( x, y, z ) => ( -4*y*( y*y - 3*x*x )*z + 36*z*z*z - 20*z );// PARTIAL DERIVATE to z

const xs = 0; // x START POINT
const ys = 3; // y START POINT
const zs = 0; // z START POINT

const e = 0.001; // epsilon 
const d = 0.08; // rough edge length of triangles

const opt = {};
opt.fc = 360000;
opt.pc = 180000;
opt.b = [ 1, -Infinity, Infinity, -Infinity, Infinity, -Infinity ]; // bounds xMax, xMin, yMax, yMin, zMax, zMin
