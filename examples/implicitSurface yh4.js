// Example: implicit surface:  y high six

const isf = ( x, y, z ) => ( x * x + y * y * y * y + z * z - 1 );// IMPLICIT SURFACE Function
const dx = ( x, y, z ) => ( 2 * x );// PARTIAL DERIVATE to x
const dy = ( x, y, z ) => ( 6 * y * y * y * y * y );// PARTIAL DERIVATE to y
const dz = ( x, y, z ) => ( 2 * z );// PARTIAL DERIVATE to z

// some combinations for iteration
const xs = 0.1;// x START POINT
const ys = 0.05;// y START POINT
const zs = 0.95;// z START POINT

//const e = 0.001; // epsilon 
//const d = 0.02; // rough edge length of triangles

const e = 0.01; // epsilon 
const d = 0.05; // rough edge length of triangles

//const e = 0.01; // epsilon 
//const d = 0.1; // rough edge length of triangles

const opt = {};