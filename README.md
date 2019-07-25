# THREEi
three.js addon for triangulation of implicit surfaces. The addon generates indexed BufferGeometries.

### Publication in progress

#### Algorithmus nach / Algorithm based on E. Hartmann.

The algorithm was originally implemented in Pascal and visualized with POV-Ray.

The implementation of the algorithm with three.js/JavaScript deviates from the template in some places.

de: https://www2.mathematik.tu-darmstadt.de/~ehartmann/cdg0/cdg0n.pdf

en: https://www2.mathematik.tu-darmstadt.de/~ehartmann/cdgen0104.pdf

siehe / see

de: https://de.wikipedia.org/wiki/Implizite_Fl%C3%A4che

en: https://en.wikipedia.org/wiki/Implicit_surface

.................................................................... Sphere with Holes (Triangulation)  ..............................................................................

Sphere with arbitrarily arranged openings, circular or defined by points on the sphere.
The geometry is realized as indexed BufferGeometry.

Algorithm simplified and modified for sphere. 

```javascript

const g = new THREE.BufferGeometry( );
g.createSphereWithHoles = THREEg.createSphereWithHoles;
//g.createSphereWithHoles( detail );
g.createSphereWithHoles( detail, holes );

 ``` 

parameters: 

detail:  Math.PI / detail  is rough side length of the triangles

holes (optional): array of arrays of holes

####  EXAMPLE:

```javascript

const g = new THREE.BufferGeometry( );
const detail = 50;
const holes = [
	// circular hole, 3 elements: [ theta, phi, count ]
	[ 2.44,  0.41, 12 ],
	[ 0.72,  2.55, 19 ],
	[ 1.32, -2.15, 62 ],
	[ 1.82,  0.11, 16 ],
	[ 1.21,  1.23, 13 ],
	[ 2.44,  1.84, 25 ],
	[ 3.05,  3.22, 21 ],
	[ 2.42, -2.61, 14 ],
	// points hole,: array of points theta, phi, ...  (last point is connected to first)
	[ 0,0,  0.5,-0.8,  0.25,-0.27,  0.4,0.3,  0.3,0.72 ]
];

g.createSphereWithHoles = THREEg.createSphereWithHoles;
//g.createSphereWithHoles( detail );
g.createSphereWithHoles( detail, holes );

const material1 = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: 0x000000, wireframe: true, transparent: true, opacity: 0.99 } );
const mesh1 = new THREE.Mesh( g, material1 );
scene.add( mesh1 );
const material2 = new THREE.MeshBasicMaterial( { side: THREE.FrontSide, color: 0x006600, transparent: true, opacity: 0.9 } );
const mesh2 = new THREE.Mesh( g, material2 );
scene.add( mesh2 );

 ``` 
---

.................................................................... Triangulation of Implicit Surfaces ..............................................................................

Algorithm modified.

The implicit surfaces are defined in separate js files.

#### EXAMPLE

```javascript
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


 ``` 

genus2.png
![genus2.png](https://github.com/hofk/THREEi.js/blob/master/genus2.png)

The starting point ( xs, ys ,zs ) must be close to the surface.

The rough edge length of triangles d must be sufficiently small in relation to the strongest curvature. 

Furthermore, a suitable accuracy number e (epsilon) must be selected.

If the values do not match, the Newton's method does not converge.

```html
<script src="../js/three.min.106.js"></script>
<script src="../js/OrbitControls.js"></script>
<script src="../js/THREEi.js"></script>

<!-- rename the example
	<script src="implicitSurface example.js"></script>
 -->
<script src="implicitSurface genus2.js"></script>

 ```
 
```javascript

const g = new THREE.BufferGeometry( );
g.createImplicitSurface = THREEi.createImplicitSurface;
//g.createImplicitSurface( isf, dx, dy, dz, xs, ys, zs, d, e, fc, pc );  // parameters from implicitSurface example.js // fc, pc optional
g.createImplicitSurface( isf, dx, dy, dz, xs, ys, zs, d, e );	// parameters from implicitSurface example.js	

const material1 = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide, color: 0x000000, wireframe: true, transparent: true, opacity: 0.99 } );
const mesh1 = new THREE.Mesh( g, material1 );
scene.add( mesh1 );
const material2 = new THREE.MeshBasicMaterial( { side: THREE.FrontSide, color: 0x006600, transparent: true, opacity: 0.9 } );
const mesh2 = new THREE.Mesh( g, material2 );
scene.add( mesh2 );


 ``` 
 
*The addon THREEi.js capsules the function triangulation( isf, dx, dy, dz, xs, ys, zs, d, e, fc, pc ).*

*This can be copied and directly integrated into your own projects.*

---
