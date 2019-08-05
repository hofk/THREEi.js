// Example: implicit surface, cylinder

const isf = (x,y,z) => ( x*x + y*y - 1 ); // IMPLICIT SURFACE Function
const dx = (x,y,z) => ( 2*x ); // PARTIAL DERIVATE to x
const dy = (x,y,z) => ( 2*y ); // PARTIAL DERIVATE to y
const dz = (x,y,z) => ( 0 ); // PARTIAL DERIVATE to z


// starts with spiral
const xs = 1; // x START POINT
const ys = 0.1; // y START POINT
const zs = 3.5; // z START POINT

const d = 0.1; // rough edge length of triangles
const e = 0.001; // epsilon 
const b = [ Infinity, -Infinity, Infinity, -Infinity, 4, -4 ]; // bounds xMax, xMin, yMax, yMin, zMax, zMin

const fc = 30000; // face count 
const pc = 15000; // positions count

/*
const xs = 0.6; // x START POINT
const ys = 0.6; // y START POINT
const zs = 0; // z START POINT

const d = 0.08; // rough edge length of triangles
const e = 0.001; // epsilon 
const b = [  Infinity, -Infinity, Infinity, -Infinity,  3, -3 ]; // bounds xMax, xMin, yMax, yMin, zMax, zMin
*/