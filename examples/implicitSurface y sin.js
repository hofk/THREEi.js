// Example: implicit surface:  y sin

const pi2 = Math.PI / 2;
const si = ( y ) => ( Math.sin( pi2 * y ) - 0.05 );
const co = ( y ) => ( Math.cos( pi2 * y ) - 0.05 );
const isf = ( x, y, z ) => ( x * x + si( y ) * si( y ) + z * z - 1.5 );// IMPLICIT SURFACE Function
const dx = ( x, y, z ) => ( 2 * x ); // PARTIAL DERIVATE to x
const dy = ( x, y, z ) => ( 0 ); // PARTIAL DERIVATE to y
const dz = ( x, y, z ) => ( 2 * z ); // PARTIAL DERIVATE to z

const xs = 0.1; // x START POINT
const ys = 0.2; // y START POINT
const zs = 0.95; // z START POINT

const d = 0.09; // rough edge length of triangles
const e = 0.0001; // epsilon 

const opt = { fc: 30000, pc: 15000, b: [ Infinity, -0.4, 3.4, -2.8, Infinity, -Infinity ] } ; // max. face/positions count, bounds
 