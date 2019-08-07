// Example: implicit surface sphere

const isf = (x,y,z) => ( x*x + y*y + z*z - 1 );  // IMPLICIT SURFACE Function
const dx = (x,y,z) => ( 2*x ); // PARTIAL DERIVATE to x
const dy = (x,y,z) => ( 2*y ); // PARTIAL DERIVATE to y
const dz = (x,y,z) => ( 2*z ); // PARTIAL DERIVATE to z

const xs = 0.3; // x START POINT
const ys = 0.2; // y START POINT
const zs = -1.1; // z START POINT

const e = 0.0001; // epsilon 
const d = 0.05; // rough edge length of triangles
		// b: [ xMax, xMin, yMax, yMin, zMax, zMin ]
const opt = { b: [ 0.9, -0.8, Infinity, -Infinity, 0.85, -Infinity] }

