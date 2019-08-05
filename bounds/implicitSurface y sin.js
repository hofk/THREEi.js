// Example: implicit surface:  y sin

const pi2 = Math.PI / 2;
const si = ( y ) => ( Math.sin( pi2 * y ) - 0.05 );
const co = ( y ) => ( Math.cos( pi2 * y ) - 0.05 );
const isf = ( x, y, z ) => ( x * x + si( y ) * si( y ) + z * z - 1 );// IMPLICIT SURFACE Function
const dx = ( x, y, z ) => ( 2 * x ); // PARTIAL DERIVATE to x
const dy = ( x, y, z ) => ( 0 ); // PARTIAL DERIVATE to y
const dz = ( x, y, z ) => ( 2 * z ); // PARTIAL DERIVATE to z


const xs = 0.1; // x START POINT
const ys = 0.0; // y START POINT
const zs = 0.95; // z START POINT

const d = 0.05; // rough edge length of triangles
const e = 0.001; // epsilon 

const fc = 30000; // face count 
const pc = 15000; // positions count

const b = [ Infinity, -Infinity, 1.3, -0.76, Infinity, -Infinity ]; // bounds
