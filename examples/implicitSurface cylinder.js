// Example: implicit surface, cylinder

const isf = (x,y,z) => ( x*x + y*y - 1 ); // IMPLICIT SURFACE Function
const dx = (x,y,z) => ( 2*x ); // PARTIAL DERIVATE to x
const dy = (x,y,z) => ( 2*y ); // PARTIAL DERIVATE to y
const dz = (x,y,z) => ( 0 ); // PARTIAL DERIVATE to z
/*
const xs = -0.6; // x START POINT
const ys = 0.5; // y START POINT
const zs = 0; // z START POINT

const e = 0.001; // epsilon 
const d = 0.2; // rough edge length of triangles

const  opt = { fc: 20000, pc: 10000, b: [ Infinity, -Infinity, Infinity, -Infinity, 5, -8 ] };
*/

// starts with spiral
const xs = 1; // x START POINT
const ys = 0.1; // y START POINT
const zs = 3.5; // z START POINT

const e = 0.001; // epsilon 
const d = 0.1; // rough edge length of triangles

const opt = { fc: 40000, pc: 20000, b: [ Infinity, -Infinity, Infinity, -Infinity, 4, -12 ] };

