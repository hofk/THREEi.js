// Example: implicit surface of genus 3

const rx2 = 36;
const ry2 = 12.25;
const rz2 = 16;
const r2 = 1.44;
const x0 = 3.9;

const f0 = ( x, y, z ) => ( rz2 * rz2 * z * z );
const f1 = ( x, y, z ) => ( 1 - x * x / rx2 - y * y / ry2 );
const f2 = ( x, y, z ) => ( ( x - x0 ) * ( x - x0 ) + y * y - r2 );
const f3 = ( x, y, z ) => ( x * x + y * y - r2 ); 
const f4 = ( x, y, z ) => ( ( x + x0  )* ( x + x0 ) + y * y - r2 ); 

const dxf1 = ( x, y, z ) => ( -2 * x / rx2 );
const dxf2 = ( x, y, z ) => ( 2 * ( x - x0 ) );
const dxf3 = ( x, y, z ) => ( 2 * x );
const dxf4 = ( x, y, z ) => ( 2 * ( x + x0 ) );

const dyf1 = ( x, y, z ) => ( -2 * y / ry2 );
const dyf2 = ( x, y, z ) => ( 2 * y );
const dyf3 = ( x, y, z ) => ( 2 * y );
const dyf4 = ( x, y, z ) => ( 2 * y );

const isf = ( x, y, z ) => ( f0( x, y, z ) - f1( x, y, z ) * f2( x, y, z ) * f3( x, y, z ) * f4( x, y, z ) ); // IMPLICIT SURFACE Function

const dx = ( x, y, z ) => ( -( dxf1( x, y, z ) * f2( x, y, z ) * f3( x, y, z ) * f4( x, y, z ) + f1( x, y, z ) * dxf2( x, y, z ) * f3( x, y, z ) * f4( x, y, z ) + f1( x, y, z ) * f2( x, y, z ) * dxf3( x, y, z ) * f4( x, y, z ) + f1( x, y, z ) * f2( x, y, z ) * f3( x, y, z ) * dxf4( x, y, z ) ) ); // PARTIAL DERIVATE to x
const dy = ( x, y, z ) => ( -( dyf1( x, y, z ) * f2( x, y, z ) * f3( x, y, z ) * f4( x, y, z ) + f1( x, y, z ) * dyf2( x, y, z ) * f3( x, y, z ) * f4( x, y, z ) + f1( x, y, z ) * f2( x, y, z ) * dyf3( x, y, z ) * f4( x, y, z ) + f1( x, y, z ) * f2( x, y, z ) * f3( x, y, z ) * dyf4( x, y, z ) ) ); // PARTIAL DERIVATE to y
const dz = ( x, y, z ) => ( rz2 * rz2 * 2 * z ); // PARTIAL DERIVATE to z

// some working combinations for iteration

const xs = 0; // x START POINT
const ys = 3; // y START POINT
const zs = 0; // z START POINT

//const e = 0.00000001; // epsilon 
//const d = 0.05; // rough edge length of triangles

//const e = 0.01; // or const e = 0.0000001; // epsilon 
//const d = 0.07; // rough edge length of triangles

//const e = 0.01; // or const e = 0.00001; // epsilon 
//const d = 0.08; // rough edge length of triangles

//const e = 0.01; // epsilon 
//const d = 0.1; // rough edge length of triangles

//const e = 0.001; // epsilon 
//const d = 0.11; // rough edge length of triangles

const e = 0.001; // epsilon 
const d = 0.13; // rough edge length of triangles

// works, but too inaccurate
//const e = 0.0001; // epsilon
//const d = 0.28; // rough edge length of triangles