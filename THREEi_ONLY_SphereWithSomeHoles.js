// THREEi_ONLY_SphereWithSomeHoles.js ( rev 109.0 )

// NOTE! This version contains only the older, simplified functions

// * buildSphereWithHolesObj, buildSphereWithHoles( ),
// * this requires less effort in code and execution,
//  but
// * does not check whether the current front overlaps,
// * in very many cases with few holes this is not a problem,
// * it can lead to errors in more complicated cases

/**
 * @author hofk / http://threejs.hofk.de/
*/

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.THREEi = global.THREEi || {})));
}(this, (function (exports) {

'use strict';

var g;	// THREE.BufferGeometry

//#################################################################################################

// Algorithm based on (simplified for sphere with holes)
// de: https://www2.mathematik.tu-darmstadt.de/~ehartmann/cdg0/cdg0n.pdf
// en: https://www2.mathematik.tu-darmstadt.de/~ehartmann/cdgen0104.pdf
//

// ............................ Sphere with Holes (Triangulation) .................................

function createSphereWithHoles( arg1, arg2 ) {
		
	g = this;  //  THREE.BufferGeometry() - geometry object from three.js
	
	g.buildSphereWithHolesObj = buildSphereWithHolesObj;	
	g.buildSphereWithHoles = buildSphereWithHoles;

	if( arg1.d > 0 ) { // variant parameters object { d: div4: holes: } all elements optional
		
		g.d = arg1.d !== undefined ? arg1.d : 2 * Math.sin( Math.PI / 24 ); // to g.div4 default
		g.div4 = arg1.div4 !== undefined ? arg1.div4 : 6; // 6 * 4 = 24 great circle divisions	
		g.holes = arg1.holes !== undefined ? arg1.holes : [];
			
		g.detail = g.div4 * 4; // division of the great circle 
		g.radius = g.d / Math.sin( Math.PI / g.detail ) / 2; // sphere radius, for external use as well
			
		/* holes, example:
		holes: [
			// circular hole, 3 elements: [ theta, phi, div4Hole ], div4Hole <= div4	
			[ 1.82,  0.41, 12 ],
			// points hole,: array of points theta, phi, ...  (last point is connected to first)
			[ 0,0,  0.5,-0.8,  0.25,-0.27,  0.4,0.3,  0.3,0.72 ]
		]
		*/
		
		g.buildSphereWithHolesObj( );
		
	} else { // variant detail, holes are optional, radius = 1 is fixed - use three.js .scale
			 // Variant with less effort in the algorithm! Other angle calculation too.
			 
		g.detail = detail; // count of triangles for half a great circle 
		g.holes = holes !== undefined ? holes : []; // optional
		/* holes, example:	
		holes = [
			// circular hole, 3 elements: [ theta, phi, count ]
			[ 2.44,  0.41, 12 ],
			[ 0.72,  2.55, 19 ],	
			// points hole,: array of points theta, phi, ...  (last point is connected to first)
			[ 0,0,  0.5,-0.8,  0.25,-0.27,  0.4,0.3,  0.3,0.72 ]
		];
		*/
		
		g.buildSphereWithHoles( );

	}		

}

function buildSphereWithHolesObj( ) {
	
	const dd = g.d * g.d;
	
	const squareLength = ( x,y,z ) => (  x*x + y*y + z*z );
	const length = ( x, y, z ) => ( Math.sqrt( x * x + y * y + z * z ) );
	const prevFront = ( i ) => ( i !== 0 ? i - 1 : front.length - 1 );
	const nextFront  = ( i ) => ( i !== front.length - 1 ? i + 1 : 0 );
	const determinant = ( xa,ya,za, xb,yb,zb, xc,yc,zc ) => ( xa*yb*zc + ya*zb*xc + za*xb*yc - za*yb*xc - xa*zb*yc - ya*xb*zc );
	
	let m; // index of the current front point
	let n; // number of new points
	let nT; // number of new triangles
	let nIns; // number of new points (after union or split)
	let dAng; // partial angle
	let len, d1, d2, d12; // lengths
	let iSplit, jSplit; // split front indices  
	let iUnite, jUnite, fUnite; // unite front indices, front number (to unite) 
	
	// points and vectors:
	let x, y, z, xp, yp, zp; // coordinates point and actual point p
	let x1, y1, z1, x2, y2, z2; // previous and next point to p in front
	let xn, yn, zn; // normal, gradient (sphere: normalized point)
	let xt1, yt1, zt1, xt2, yt2, zt2; // tangents
	let xs1, ys1, xs2, ys2; // p in tangential system (only x, y required)
	let xc, yc, zc; // actual point as center point for new points
	
	//  preparation
	
	const faceCount = g.detail * g.detail * 8 ;
	const posCount  = g.detail * g.detail * 6 ;
	
	g.indices = new Uint32Array( faceCount * 3 );
	g.positions = new Float32Array( posCount * 3 );
	//g.normals = new Float32Array( posCount * 3 );
	
	g.setIndex( new THREE.BufferAttribute( g.indices, 1 ) );
	g.addAttribute( 'position', new THREE.BufferAttribute( g.positions, 3 ) );
	
	let posIdx = 0;
	let indIdx = 0;
	let frontPosIdx, unionIdxA, unionIdxB, splitIdx;
	 
	let front = []; // active front // front[ i ]: object { idx: 0, ang: 0 }
	let partFront = []; // separated part of the active front (to split)
	let insertFront = []; // new front points to insert into active front
	let fronts = []; // all fronts
	let partBounds = []; // bounding box of partFront [ xmin, xmax, ymin, ymax, zmin, zmax ]
	let boundings = []; // fronts bounding boxes
	let smallAngles = []; // new angles < 1.5
	
	let frontNo, frontStock;
	let unite = false;
	let split = false;
		
	frontNo = 0; // active front number
	frontStock = 0; // number of fronts still to be processed
	
	// define holes fronts
	
	if ( g.holes.length === 0 ) {
		
		makeFirstTriangle( );
		
	} else {
	
		g.circles = []; // array of arrays [ xc, yc, zc, rHole, div4Hole ], values for external use
	
		for ( let i = 0; i < g.holes.length; i ++ ) {
			
			if ( g.holes[ i ].length === 3 ) {
				
				makeCircularHole( i );  // [ theta, phi, div4Hole ]
				
			} else {
				
				makePointsHole( i ); // points: [ theta, phi, ... ]
				
			}
		
		}
		
	}
	
	frontNo = 0;
	front = fronts[ frontNo ];
	
	//////////////// DEBUG triangles //////////////////////////////////////
	// let stp = 0; 
	///////////////////////////////////////////////////////////////////////		
	
	// ------ triangulation cycle -------------
	
	while ( frontStock > 0 ) {
		
		if ( !unite ) { // triangulation on the front
		
			smallAngles = [];
		
			for ( let i = 0; i < front.length; i ++ ) {
				
				if( front[ i ].ang === 0 ) calculateFrontAngle( i ); // is to be recalculated (angle was set to zero)
					
			}
			
			m = getMinimalAngleIndex( ); // front angle
			makeNewTriangles( m );		
					
			if ( front.length > 9 && smallAngles.length === 0 ) {		
				
				checkDistancesToUnite( m );
				
			}
			
			if ( front.length === 3 ) {
				
				makeLastTriangle( ); // last triangle closes the front								
				chooseNextFront( ); // if aviable
				
			}
			
		} else { // unite the active front to another front
			
			uniteFront(  m, iUnite, fUnite, jUnite );
			trianglesAtUnionPoints( );
			unite = false;
			
		}
				 
	}
	
	// .....  detail functions .....	
	
	function makeFirstTriangle ( ) {
		
		fronts[ frontNo ] = [];
		boundings[ frontNo ] = [];
		
		storePoint( 0, 0 ); // ( theta, phi )
		storePoint( Math.PI / 2 / g.div4, -Math.PI / 6 );
		storePoint( Math.PI / 2 / g.div4,  Math.PI / 6 );
		
		g.indices[ 0 ] = 0;
		g.indices[ 1 ] = 1; 
		g.indices[ 2 ] = 2;
		
		indIdx += 3;
		
		fronts[ frontNo ].push( { idx: 0, ang: 0 }, { idx: 1, ang: 0 }, { idx: 2, ang: 0 } );	
		
		frontNo ++;		
		frontStock ++;	
		
	}
	
	function makePointsHole( i ) {
	
		let  theta, phi, count, xmin, ymin, zmin, xmax, ymax, zmax, xv2, yv2, zv2;
		
		xmin = ymin = zmin = Infinity;
		xmax = ymax = zmax = -Infinity;
		
		fronts[ frontNo ] = [];
		boundings[ frontNo ] = [];
		
		theta = g.holes[ i ][ 0 ];
		phi = g.holes[ i ][ 1 ]; 
		
		x1 = g.radius * Math.sin( theta ) * Math.cos( phi );
		y1 = g.radius * Math.cos( theta );
		z1 = -g.radius * Math.sin( theta ) * Math.sin( phi );	
		
		for ( let j = 1; j < g.holes[ i ].length / 2 + 1; j ++ ) {
		
			g.positions[ posIdx     ] = x1;
			g.positions[ posIdx + 1 ] = y1;
			g.positions[ posIdx + 2 ] = z1;
			
			fronts[ frontNo ].push( { idx: posIdx / 3, ang: 0 } );
			
			xmin = x1 < xmin ? x1 : xmin;
			ymin = y1 < ymin ? y1 : ymin;
			zmin = z1 < zmin ? z1 : zmin;
			
			xmax = x1 > xmax ? x1 : xmax;
			ymax = y1 > ymax ? y1 : ymax;
			zmax = z1 > zmax ? z1 : zmax;
			
			posIdx += 3;			
			
			theta = g.holes[ i ][ j < g.holes[ i ].length / 2 ? j * 2 : 0 ]; // 0 => connect to start
			phi = g.holes[ i ][ j < g.holes[ i ].length / 2 ? j * 2 + 1 : 1 ]; // 1 => connect to start
			
			x2 = g.radius *  Math.sin( theta ) * Math.cos( phi );
			y2 = g.radius *  Math.cos( theta );
			z2 = -g.radius * Math.sin( theta ) * Math.sin( phi );
			
			xv2 = x2 - x1;
			yv2 = y2 - y1;
			zv2 = z2 - z1;
			
			len = length( xv2, yv2, zv2 );
			
			if ( len > g.d ) {
				
				count = Math.ceil( len / g.d );
				
				for ( let k = 1; k < count; k ++ ) {
					
					x = x1 + k * xv2 / count;
					y = y1 + k * yv2 / count;
					z = z1 + k * zv2 / count;
					
					len = length( x, y, z );   // to bring the point to the surface (g.radius * ..)
					
					g.positions[ posIdx     ] = g.radius * x / len;
					g.positions[ posIdx + 1 ] = g.radius * y / len;
					g.positions[ posIdx + 2 ] = g.radius * z / len;
					
					fronts[ frontNo ].push( { idx: posIdx / 3, ang: 0 } );
					
					xmin = x < xmin ? x : xmin;
					ymin = y < ymin ? y : ymin;
					zmin = z < zmin ? z : zmin;
					
					xmax = x > xmax ? x : xmax;
					ymax = y > ymax ? y : ymax;
					zmax = z > zmax ? z : zmax;
					
					posIdx += 3;
					
				}
				
			}
			
			x1 = x2;
			y1 = y2;
			z1 = z2;
			
		}
		
		boundings[ frontNo ].push( xmin, xmax, ymin, ymax, zmin, zmax );
		
		frontNo ++;
		frontStock ++;
		
	}
	
	function makeCircularHole( i ) {
	
		let xa, ya, za, xb, yb; // for rotation around z, y
		
		const theta = g.holes[ i ][ 0 ];
		const phi = g.holes[ i ][ 1 ];
		const div4Hole = g.holes[ i ][ 2 ];
		const countH = div4Hole * 4;
		
		let xmin, ymin, zmin, xmax, ymax, zmax;
		
		xmin = ymin = zmin = Infinity;
		xmax = ymax = zmax = -Infinity;
		
		const rHole = g.d / ( Math.sin( Math.PI / countH ) * 2 ); // radius cutting circle
		const h = Math.sqrt( g.radius * g.radius - rHole * rHole ); // distance: sphere center to cutting circle
		
		// ... hole values for external use
		xp = g.radius *  Math.sin( theta ) * Math.cos( phi );
		yp = g.radius *  Math.cos( theta );
		zp = -g.radius * -Math.sin( theta ) * Math.sin( phi );
		
		xc = h / g.radius * xp;
		yc = h / g.radius * yp;
		zc = h / g.radius * zp;
		
		g.circles.push( [ xc, yc, zc,  rHole, div4Hole ] ); // values for external use
		
		fronts[ frontNo ] = [];
		boundings[ frontNo ] = [];
		
		ya = h;
		
		for ( let i = 0, alpha = 0; i < countH; i ++, alpha += 2 * Math.PI / countH ) {			

			//  cutting circle on top		
			xa = rHole * Math.cos( alpha );
			za = rHole * Math.sin( alpha );
			 
			// rotate around z axis 
			xb = xa * Math.cos( theta ) - ya * Math.sin( theta ); 
			yb = xa * Math.sin( theta ) + ya * Math.cos( theta );
			
			// rotate around y axis 
			x = -xb * Math.cos( phi ) + za * Math.sin( phi ); 
			z = xb * Math.sin( phi ) + za * Math.cos( phi );
			
			y = yb; // for storing and checking bounds
			
			g.positions[ posIdx     ] = x;
			g.positions[ posIdx + 1 ] = y;
			g.positions[ posIdx + 2 ] = z;
			
			fronts[ frontNo ].push( { idx: posIdx / 3, ang: 0 } );
			
			xmin = x < xmin ? x : xmin;
			ymin = y < ymin ? y : ymin;
			zmin = z < zmin ? z : zmin;
			
			xmax = x > xmax ? x : xmax;
			ymax = y > ymax ? y : ymax;
			zmax = z > zmax ? z : zmax;
			
			posIdx += 3;
			
		}
		
		boundings[ frontNo ].push( xmin, xmax, ymin, ymax, zmin, zmax );
		
		frontNo ++;
		frontStock ++;
		
	}
				
	function checkDistancesToUnite( m ) { // for new active front points
	
		let idxJ, xChk, yChk, zChk, ddUnite;													 				 
		let ddUniteMin = Infinity;
		unite = false;
		
		for ( let i = 0; i < insertFront.length; i ++ ) {
			
			getPoint( m + i );
			
			for ( let f = 0; f < fronts.length; f ++ ) { 
			
				if ( f !== frontNo ) {
					
					xChk = ( xp > boundings[ f ][ 0 ] - g.d ) && ( xp < boundings[ f ][ 3 ] + g.d );
					yChk = ( yp > boundings[ f ][ 1 ] - g.d ) && ( yp < boundings[ f ][ 4 ] + g.d );
					zChk = ( zp > boundings[ f ][ 2 ] - g.d ) && ( zp < boundings[ f ][ 5 ] + g.d );
					
					if (  xChk || yChk || zChk ) {
						
						for ( let j = 0; j < fronts[ f ].length; j ++ ) {

							idxJ = fronts[ f ][ j ].idx * 3;
							
							// Hint: here (2) is exceptionally point in other front! 						
							x2 = g.positions[ idxJ ]; 
							y2 = g.positions[ idxJ + 1 ];
							z2 = g.positions[ idxJ + 2 ];
							
							ddUnite = squareLength ( x2 - xp, y2 - yp, z2 - zp );
								
							if ( ddUnite < dd && ddUnite < ddUniteMin ) {
	
								ddUniteMin = ddUnite; 
								iUnite = i;
								jUnite = j;
								fUnite = f;
								unite = true;	
																	
							}

						}
						
					}
					
				}
				
			}		
			
		}
		
	}

	function uniteFront( m, i, f, j ) {
		
		let tmp = [];
		
		tmp[ 0 ] = front.slice( 0, m + i + 1 );	
		tmp[ 1 ] = fronts[ f ].slice( j , fronts[ f ].length );
		tmp[ 2 ] = fronts[ f ].slice( 0 , j + 1 );
		tmp[ 3 ] = front.slice( m + i, front.length );
		
		unionIdxA = m + i;
		unionIdxB = m + i + 1 + fronts[ f ].length
		
		front = [];
		
		for ( let t = 0; t < 4; t ++ ) {
			
			for ( let k = 0; k < tmp[ t ].length ; k ++ ) {
				
				front.push( tmp[ t ][ k ] );
				
			}
			
		}
		
		fronts[ f ] = []; // empty united front
		
		frontStock -= 1; // front is eliminated
		
	}
		
	function trianglesAtUnionPoints( ) {
		
		nIns = 0; // count inserted points
		
		calculateFrontAngle( unionIdxA );
		calculateFrontAngle( unionIdxA + 1 );
		
		if ( front[ unionIdxA ].ang < front[ unionIdxA + 1 ].ang ) {
			
			makeNewTriangles( unionIdxA );
			nIns += n - 1;
			calculateFrontAngle( unionIdxA + 1 + nIns );
			makeNewTriangles( unionIdxA + 1 + nIns );
			nIns += n - 1;
			
		} else {
			
			makeNewTriangles( unionIdxA + 1 );
			nIns += n - 1;
			calculateFrontAngle( unionIdxA );
			makeNewTriangles( unionIdxA );
			nIns += n - 1;
		}
		
		calculateFrontAngle( unionIdxB + nIns );
		calculateFrontAngle( unionIdxB + 1 + nIns );
		
		if ( front[ unionIdxB + nIns ].ang < front[ unionIdxB + 1 + nIns ].ang ) {
			
			makeNewTriangles( unionIdxB + nIns );
			nIns += n - 1;
			calculateFrontAngle( unionIdxB + 1 + nIns );
			makeNewTriangles( unionIdxB + 1 + nIns );
			
		} else {
			
			makeNewTriangles( unionIdxB + 1 + nIns );
			calculateFrontAngle( unionIdxB + nIns );
			makeNewTriangles( unionIdxB + nIns );
			
		}
		
	}	

	function getMinimalAngleIndex( ) {
		
		let angle = Infinity;
		let m;
		
		for ( let i = 0; i < front.length; i ++ ) {
			
			if( front[ i ].ang < angle  ) {
				
				angle = front[ i ].ang ;
				m = i;
					
			}
			
		}

		return m;
		
	}
	
	function makeNewTriangles( m ) {
		
		//	m:  minimal angle (index)
		
		insertFront = []; // new front points
		
		nT = Math.floor( 3 * front[ m ].ang / Math.PI ) + 1; // number of new triangles
		
		dAng = front[ m ].ang / nT;
		
		getSystemAtPoint( m );
		getNextPoint( m );
		
		d1 = length( x1 - xp, y1 - yp, z1 - zp );
		d2 = length( x2 - xp, y2 - yp, z2 - zp );	
		d12 = length( x2 - x1, y2 - y1, z2 - z1 );
		
		// correction of dAng, nT in extreme cases
		
		if ( dAng < 0.8 && nT > 1 ) {
			
			nT --;
			dAng = front[ m ].ang / nT;
			
		}
		
		if ( dAng > 0.8 && nT === 1 && d12 > 1.25 * g.d ) {
			
			nT = 2; 
			dAng = front[ m ].ang / nT;
			
		}
		
		if ( d1 * d1 < 0.2 * dd ||  d2 * d2 < 0.2 * dd  ) {
			
			nT = 1;
			
		}
		
		n = nT - 1;  // n number of new points
			
		if ( n === 0 ) { // one triangle
			
			g.indices[ indIdx     ] = front[ m ].idx;
			g.indices[ indIdx + 1 ] = front[ prevFront( m ) ].idx; 
			g.indices[ indIdx + 2 ] = front[ nextFront( m ) ].idx;
			
			indIdx += 3;
			
			///////////////  DEBUG triangles  //////////////////////
		 	// stp ++;
			////////////////////////////////////////////////////////	 
					
			front[ prevFront( m ) ].ang = 0;		
			front[ nextFront( m ) ].ang = 0;			
			
			front.splice( m, 1 ); // delete point with index m from the front	
				
		} else { // more then one triangle
			
			xc = xp;
			yc = yp;
			zc = zp;

			for ( let i = 0,  phi = dAng; i < n; i ++, phi += dAng ) {
				
				xp = xc + Math.cos( phi ) * g.d * xt1 + Math.sin( phi ) * g.d * xt2; 
				yp = yc + Math.cos( phi ) * g.d * yt1 + Math.sin( phi ) * g.d * yt2;
				zp = zc + Math.cos( phi ) * g.d * zt1 + Math.sin( phi ) * g.d * zt2;			
				
				len = length( xp, yp, zp ); // to bring the point to the surface (g.radius * ..)
				
				g.positions[ posIdx     ] = g.radius * xp / len;
				g.positions[ posIdx + 1 ] = g.radius * yp / len;
				g.positions[ posIdx + 2 ] = g.radius * zp / len;
				
				insertFront.push( { idx: posIdx / 3, ang: 0 } );
				
				posIdx += 3;				
						
			}	
			
			g.indices[ indIdx     ] = front[ m ].idx;
			g.indices[ indIdx + 1 ] = front[ prevFront( m ) ].idx 
			g.indices[ indIdx + 2 ] = insertFront[ 0 ].idx;
			
			indIdx += 3;
			
			///////////////  DEBUG triangles  //////////////////////
		 	// stp ++;
			////////////////////////////////////////////////////////
				
			front[ prevFront( m ) ].ang = 0;
			
			for ( let i = 0; i < n - 1; i ++ ) {
				
				g.indices[ indIdx     ] = front[ m ].idx;
				g.indices[ indIdx + 1 ] = insertFront[ i ].idx;
				g.indices[ indIdx + 2 ] = insertFront[ i + 1 ].idx;
				
				indIdx += 3;

				///////////////  DEBUG triangles  //////////////////////
				// stp ++;
				////////////////////////////////////////////////////////
				
			}
			
			g.indices[ indIdx     ] = front[ m ].idx;
			g.indices[ indIdx + 1 ] = insertFront[ n - 1 ].idx;
			g.indices[ indIdx + 2 ] = front[ nextFront( m ) ].idx;
			
			front[ nextFront( m ) ].ang = 0;
			
			indIdx += 3;
						
			///////////////  DEBUG triangles  //////////////////////
		 	// stp ++;
			////////////////////////////////////////////////////////
					
			replaceFront( m, insertFront ); // replaces front[ m ] with new points
			
		}
			
	}

	function makeLastTriangle( ) {
		
		g.indices[ indIdx     ] = front[ 2 ].idx;
		g.indices[ indIdx + 1 ] = front[ 1 ].idx 
		g.indices[ indIdx + 2 ] = front[ 0 ].idx;
		
		indIdx += 3;
			
		///////////////  DEBUG triangles  //////////////////////
	 	// stp ++;
		////////////////////////////////////////////////////////
		
		front = [];
		
		fronts[ frontNo ] = [];
		
		frontStock -= 1; // close front
		
	}
	
	function chooseNextFront( ) {
		
		if ( frontStock > 0 ) {
			
			for ( let i = 0; i < fronts.length; i ++ ) {
			
				if ( fronts[ i ].length > 0 ) {
					
					frontNo = i;
					break;
					
				}
				
			}
			
			front = fronts[ frontNo ];
			
			smallAngles = [];
		
			for ( let i = 0; i < front.length; i ++ ) {
				
				calculateFrontAngle( i ); // recalculate angles of next front
					
			}
			
		}
		
	}

	function atan2PI( x, y ) {
		
		let phi = Math.atan2( y, x );
		
		if ( phi < 0 ) phi = phi + Math.PI * 2;

		return phi;
			
	}
	
	function coordTangentialSystem( ) {
				
		let det = determinant( xt1, yt1, zt1, xt2, yt2, zt2, xn, yn, zn );
		
		xs1 = determinant( x1 - xp, y1 - yp, z1 - zp, xt2, yt2, zt2, xn, yn, zn ) / det;
		ys1 = determinant( xt1, yt1, zt1, x1 - xp, y1 - yp, z1 - zp, xn, yn, zn ) / det;
		//zs1 = determinant( xt1, yt1, zt1, xt2, yt2, zt2, x1 - xp, y1 - yp, z1 - zp ) / det; // not needed
		
		xs2 = determinant( x2 - xp, y2 - yp, z2 - zp, xt2, yt2, zt2, xn, yn, zn ) / det;
		ys2 = determinant( xt1, yt1, zt1, x2 - xp, y2 - yp, z2 - zp, xn, yn, zn ) / det;
		//zs2 = determinant( xt1, yt1, zt1, xt2, yt2, zt2, x2 - xp, y2 - yp, z2 - zp ) / det; // not needed		
		
	}
	
	function calculateFrontAngle( i ) {		
			
		let ang1, ang2;
		
		getSystemAtPoint( i );
		getNextPoint( i );
		
		coordTangentialSystem( );
		
		ang1 = atan2PI( xs1, ys1 );
		ang2 = atan2PI( xs2, ys2 );
		
		if ( ang2 < ang1 )  ang2 += Math.PI * 2;
		
        front[ i ].ang  = ang2 - ang1;
		
		if ( front[ i ].ang < 1.5 ) smallAngles.push( i );
		
	}
	
	function partFrontBounds( ) {
		
		let idx, xmin, ymin, zmin, xmax, ymax, zmax;
		
		partBounds = [];
		
		xmin = ymin = zmin = Infinity;
		xmax = ymax = zmax = -Infinity;
		
		for( let i = 0; i < partFront.length; i ++ ) {
			
			idx = partFront[ i ].idx * 3;
			
			x = g.positions[ idx ]; 
			y = g.positions[ idx + 1 ];
			z = g.positions[ idx + 2 ];
			
			xmin = x < xmin ? x : xmin; 
			ymin = y < ymin ? y : ymin;
			zmin = z < zmin ? z : zmin;
			
			xmax = x > xmax ? x : xmax;
			ymax = y > ymax ? y : ymax;
			zmax = z > zmax ? z : zmax;
			
		}
		
		partBounds.push( xmin, ymin, zmin, xmax, ymax, zmax );
		
		boundings.push( partBounds );
		
	}
	
	function replaceFront( m, fNew ) {
		
		let rear = front.splice( m, front.length - m );
		
		for ( let i = 0; i < fNew.length; i ++ ) {
			
			front.push( fNew[ i ] ); // new front points
			
		}
		
		for ( let i = 1; i < rear.length; i ++ ) { // i = 1: without old front point m 
			
			front.push( rear[ i ] );
			
		}
		
	}

	function getSystemAtPoint( i ) {
		
		getPrevPoint( i );
		getPoint( i );
		
		len = length( xp, yp, zp ); // to normalize
		 
		xn = xp / len;
		yn = yp / len
		zn = zp / len;
		
		// centerAngle = Math.acos( Math.abs( x1 * xp + y1 * yp + z1 * zp ) / ( g.radius * g.radius ) );
		const h = Math.abs( x1 * xp + y1 * yp + z1 * zp ) / g.radius; // distance: sphere center to cutting circle
		
		// center cutting circle (refers to previous point)
		xc = h / g.radius * xp; 
		yc = h / g.radius * yp;
		zc = h / g.radius * zp;
		
		// first tangent
		xt1 = x1 - xc;
		yt1 = y1 - yc;
		zt1 = z1 - zc;
		
		len = length( xt1, yt1, zt1 ); // to normalize
		
		xt1 = xt1 / len;
		yt1 = yt1 / len;
		zt1 = zt1 / len;
		
		// cross, second tangent
		
		xt2 = yn * zt1 - zn * yt1;
		yt2 = zn * xt1 - xn * zt1;
		zt2 = xn * yt1 - yn * xt1; 	
		
	}
		
	function storePoint( theta, phi ) {
		
		g.positions[ posIdx     ] = g.radius * Math.sin( theta ) * Math.cos( phi );
		g.positions[ posIdx + 1 ] = g.radius * Math.cos( theta );
		g.positions[ posIdx + 2 ] = -g.radius * Math.sin( theta ) * Math.sin( phi );
		
		posIdx += 3;
	
	}
	
	function getPrevPoint( i ) {
		
		frontPosIdx = front[ prevFront( i ) ].idx * 3;
		
		x1 = g.positions[ frontPosIdx ]; 
		y1 = g.positions[ frontPosIdx + 1 ];
		z1 = g.positions[ frontPosIdx + 2 ];
		
	}
	
	function getPoint( i ) {
		
		frontPosIdx = front[ i ].idx * 3;
		
		xp = g.positions[ frontPosIdx ]; 
		yp = g.positions[ frontPosIdx + 1 ];
		zp = g.positions[ frontPosIdx + 2 ];
		
	}
	
	function getNextPoint( i ) {
		
		frontPosIdx = front[ nextFront( i ) ].idx * 3;
		
		x2 = g.positions[ frontPosIdx ];
		y2 = g.positions[ frontPosIdx + 1 ];
		z2 = g.positions[ frontPosIdx + 2 ];
		
	}
	
}

function buildSphereWithHoles( ) {
	
	const length = ( x, y, z ) => ( Math.sqrt( x * x + y * y + z * z ) );
	const prevFront = ( i ) => ( i !== 0 ? i - 1 : front.length - 1 );
	const nextFront  = ( i ) => ( i !== front.length - 1 ? i + 1 : 0 );
	
	let d; // rough edge length of the triangles
	let m; // index of the current front point
	let n; // number of new points
	let nT; // number of new triangles
	let nUnion; // number of new points (after union)
	let dAng; // partial angle
	let len, d1, d2, d12, dd1, dd2, dd12; // lengths and their squares
	let h; // distance center to circle
	let acute, concave; // front angle properties
	
	// points and vectors:
	let x, y, z, xp, yp, zp, xc, yc, zc, x1, y1, z1, x2, y2, z2, xt1, yt1, zt1, xt2, yt2, zt2, xv1, yv1, zv1, xv2, yv2, zv2;
	
	//  preparation
	
	const faceCount = g.detail * g.detail * 4;
	const posCount  = g.detail * g.detail * 3;
	
	g.indices = new Uint32Array( faceCount * 3 );
	g.positions = new Float32Array( posCount * 3 );
	//g.normals = new Float32Array( posCount * 3 );
	
	g.setIndex( new THREE.BufferAttribute( g.indices, 1 ) );
	g.addAttribute( 'position', new THREE.BufferAttribute( g.positions, 3 ) );
	
	d = Math.PI / g.detail; // rough side length of the triangles
	
	let posIdx = 0;
	let indIdx = 0;
	let frontPosIdx, unionIdxA, unionIdxB;
	 
	let front = []; // active front // front[ i ]: object { idx: 0, ang: 0 }
	let partFront = []; // separated part of the active front
	let insertFront = []; // new front points to insert into active front
	let fronts = []; // all fronts
	let partBounds = []; // bounding box of partFront [ xmin, xmax, ymin, ymax, zmin, zmax ]
	let boundings = []; // fronts bounding boxes  
	let smallAngles = []; // new angles < 1.5
	
	let start = true;
	let united = false;
	
	// define holes
	
	let holeNumber;
	
	if ( g.holes.length === 0 ) {
		
		makeFirstTriangle( );
		
	} else {
		
		g.circles = []; // [ center, r, count ] of holes for external use 
		
		holeNumber = 0;
		
		for ( let i = 0; i < g.holes.length; i ++ ) {
			
			if ( g.holes[ i ].length === 3 ) {
				
				makeCircularHole( i );  // [ theta, phi, count ]
				
			} else {
				
				makePointsHole( i ); // points: [ theta, phi, ... ]
				
			}
		
		}
	
	}
	
	let activeFrontNo = 0;
	front = fronts[ activeFrontNo ];
	
	// ------  triangulation cycle -------------
	
	while ( front.length > 3 || start ) {
		
		if ( start ) start = false;
		
		if ( front.length > 9 && smallAngles.length === 0 ) {
			
			// checkDistancesInFront( );
			checkDistancesToFronts( m );
			
		}
			
		if ( united  ) {
			
			trianglesAtUnionPoints( );
			
		} else {
			
			calculateFrontAngles( );
			m = getMinimalAngleIndex( ); // front angle
			newTriangles( m );
			
		}
		
	} // end while

	makeLastTriangle( );

	// ..... main detail functions .....
	
	function checkDistancesToFronts( m ) { 
		
		let idx, idxJ, xChk, yChk, zChk;
		
		for ( let i = 0; i < insertFront.length; i ++ ) {
			
			idx = front[ m + i ].idx * 3
			 
			xp = g.positions[ idx ]; 
			yp = g.positions[ idx + 1 ];
			zp = g.positions[ idx + 2 ];
				
			for ( let f = 0; f < fronts.length; f ++ ) {
				
				if ( f !== activeFrontNo ) {
					
					xChk = ( xp > boundings[ f ][ 0 ] - d ) && ( xp < boundings[ f ][ 3 ] + d );
					yChk = ( yp > boundings[ f ][ 1 ] - d ) && ( yp < boundings[ f ][ 4 ] + d );
					zChk = ( zp > boundings[ f ][ 2 ] - d ) && ( zp < boundings[ f ][ 5 ] + d );
					
					if (  xChk || yChk || zChk ) {
						
						for ( let j = 0; j < fronts[ f ].length; j ++ ) {
							
							idxJ = fronts[ f ][ j ].idx * 3;
							x2 = g.positions[ idxJ ]; 
							y2 = g.positions[ idxJ + 1 ];
							z2 = g.positions[ idxJ + 2 ];
							
							if ( length( x2 - xp, y2 - yp, z2 - zp ) < d ) {
								
								uniteFront(  m, i, f, j );
								
							}
							
						}
						
					}
					
				}
				
			}
			
		}
		
	}
	
	function calculateFrontAngles( ) {
		
		smallAngles = [];
		
		for ( let i = 0; i < front.length; i ++ ) {
			
			if( front[ i ].ang === 0 ) {
				
				frontAngle( i );
				
			}
			
		}
		
	}
	
	function getMinimalAngleIndex( ) {
		
		let angle = Infinity;
		let m;
		
		for ( let i = 0; i < front.length; i ++ ) {
			
			if( front[ i ].ang < angle  ) {
				
				angle = front[ i ].ang ;
				m = i;
				
			}
			
		}
		
		return m;
		
	}
	
	function newTriangles( m ) {
		
		//	m:  minimal angle (index)
		
		insertFront = [];
		
		nT = Math.floor( 3 * front[ m ].ang / Math.PI ) + 1; // number of new triangles
		
		dAng = front[ m ].ang / nT;
		
		getSystemAtPoint( m );
		getNextPoint( m );
		
		d1 = length( x1 - xp, y1 - yp, z1 - zp );
		d2 = length( x2 - xp, y2 - yp, z2 - zp );
		d12 = length( x2 - x1, y2 - y1, z2 - z1 );
		
		// correction of dAng, nT in extreme cases
		
		if ( dAng < 0.8 && nT > 1 ) {
			
			nT --;
			dAng = front[ m ].ang / nT;
			
		}
		
		if ( dAng > 0.8 && nT === 1 && d12 > 1.25 * d ) {
			
			nT = 2; 
			dAng = front[ m ].ang / nT;
			
		}
		
		if ( d1 * d1 < 0.2 * d * d ||  d2 * d2 < 0.2 * d * d  ) {
			
			nT = 1;
			
		}
		
		n = nT - 1;  // n number of new points
		
		if ( n === 0 ) { // one triangle
			
			g.indices[ indIdx     ] = front[ m ].idx;
			g.indices[ indIdx + 1 ] = front[ prevFront( m ) ].idx; 
			g.indices[ indIdx + 2 ] = front[ nextFront( m ) ].idx;
			
			indIdx += 3;
			
			front[ prevFront( m ) ].ang = 0;			
			front[ nextFront( m ) ].ang = 0;
			
		} else { // more then one triangle
			
			for ( let i = 0,  phi = dAng; i < n; i ++, phi += dAng ) {
				
				xp = xc + Math.cos( phi ) * d * xt1 + Math.sin( phi ) * d * xt2; 
				yp = yc + Math.cos( phi ) * d * yt1 + Math.sin( phi ) * d * yt2;
				zp = zc + Math.cos( phi ) * d * zt1 + Math.sin( phi ) * d * zt2;
				
				len = length( xp, yp, zp );  // to normalize
				
				g.positions[ posIdx     ] = xp / len;
				g.positions[ posIdx + 1 ] = yp / len;
				g.positions[ posIdx + 2 ] = zp / len;
				
				insertFront.push( { idx: posIdx / 3, ang: 0 } );
				
				posIdx += 3;
				
			}
	
			g.indices[ indIdx     ] = front[ m ].idx;
			g.indices[ indIdx + 1 ] = front[ prevFront( m ) ].idx 
			g.indices[ indIdx + 2 ] = insertFront[ 0 ].idx;
			
			indIdx += 3;
			
			front[ prevFront( m ) ].ang = 0;
			
			for ( let i = 0; i < n - 1; i ++ ) {
				
				g.indices[ indIdx     ] = front[ m ].idx;
				g.indices[ indIdx + 1 ] = insertFront[ i ].idx;
				g.indices[ indIdx + 2 ] = insertFront[ i + 1 ].idx;
				
				indIdx += 3;
				
			}
			
			g.indices[ indIdx     ] = front[ m ].idx;
			g.indices[ indIdx + 1 ] = insertFront[ n - 1 ].idx;
			g.indices[ indIdx + 2 ] = front[ nextFront( m ) ].idx;
			
			front[ nextFront( m ) ].ang = 0;
			
			indIdx += 3;
			
		}
		
		replaceFront( m, insertFront ); // replaces front[ m ] with new points
		
	}
	
	function trianglesAtUnionPoints( ) {
		
		nUnion = 0; // count inserted points
		
		frontAngle( unionIdxA );
		frontAngle( unionIdxA + 1 );
		
		if ( front[ unionIdxA ].ang < front[ unionIdxA + 1 ].ang ) {
			
			newTriangles( unionIdxA );
			nUnion += n - 1;
			frontAngle( unionIdxA + 1 + nUnion );
			newTriangles( unionIdxA + 1 + nUnion );
			nUnion += n - 1;
			
		} else {
			
			newTriangles( unionIdxA + 1 );
			nUnion += n - 1;
			frontAngle( unionIdxA );
			newTriangles( unionIdxA );
			nUnion += n - 1;
		}
		
		frontAngle( unionIdxB + nUnion );
		frontAngle( unionIdxB + 1 + nUnion );
		
		if ( front[ unionIdxB + nUnion ].ang < front[ unionIdxB + 1 + nUnion ].ang ) {
			
			newTriangles( unionIdxB + nUnion );
			nUnion += n - 1;
			frontAngle( unionIdxB + 1 + nUnion );
			newTriangles( unionIdxB + 1 + nUnion );
			
		} else {
			
			newTriangles( unionIdxB + 1 + nUnion );
			frontAngle( unionIdxB + nUnion );
			newTriangles( unionIdxB + nUnion );
			
		}
		
		united = false;
		
	}
	
	// ..... help functions .....
	
	function frontAngle( i ) {
		
		getPrevPoint( i ); // (1)
		getPoint( i );
		getNextPoint( i ); // (2)
		
		// centerAngle = Math.acos( Math.abs( x1 * xp + y1 * yp + z1 * zp ) );
		// r = Math.sin( centerAngle ); // radius circle
		// h = Math.cos( centerAngle ); // distance center to  circle
		
		h = Math.abs( x1 * xp + y1 * yp + z1 * zp );
		
		// center cutting circle (refers to previous point)
		xc = h * xp; 
		yc = h * yp;
		zc = h * zp;
		
		xv1 = xc - x1;
		yv1 = yc - y1;
		zv1 = zc - z1;
		
		len = length( xv1, yv1, zv1 ); // to normalize
		
		xv1 = xv1 / len;
		yv1 = yv1 / len;
		zv1 = zv1 / len;
		
		xv2 = x2 - xc;
		yv2 = y2 - yc;
		zv2 = z2 - zc;
		
		len = length( xv2, yv2, zv2 ); // to normalize
		
		xv2 = xv2 / len;
		yv2 = yv2 / len;
		zv2 = zv2 / len;
		
		front[ i ].ang  = Math.acos( Math.abs( xv1 * xv2 + yv1 * yv2 + zv1 * zv2 ) );
		
		// cross, to detect curvature
		x = yv1 * zv2 - zv1 * yv2;
		y = zv1 * xv2 - xv1 * zv2;
		z = xv1 * yv2 - yv1 * xv2;
		
		len = length( x, y, z ); // to normalize
		
		x = xp + x / len;
		y = yp + y / len;
		z = zp + z / len;
		
		concave = ( length( x, y, z ) < 1 );
		
		d1 = length( x1 - xp, y1 - yp, z1 - zp );
		d2 = length( x2 - xp, y2 - yp, z2 - zp );
		d12 = length( x2 - x1, y2 - y1, z2 - z1 );
		
		dd1 = d1 * d1;
		dd2 = d2 * d2;
		dd12 = d12 * d12;
		
		acute = ( dd12 < ( dd1 + dd2) );
		
		// if ( concave && acute ) front[ i ].ang  += 0;
		if ( concave && !acute ) front[ i ].ang  =  Math.PI - front[ i ].ang ;
		if ( !concave && acute ) front[ i ].ang  = 2 * Math.PI - front[ i ].ang ;
		if ( !concave && !acute ) front[ i ].ang  = Math.PI + front[ i ].ang ;
		
		if ( front[ i ].ang < 1.5 ) smallAngles.push( i );
		
	}
	
	function uniteFront( m, i, f, j ) {
		
		let tmp = [];
		
		tmp[ 0 ] = front.slice( 0, m + i + 1 );	
		tmp[ 1 ] = fronts[ f ].slice( j , fronts[ f ].length );
		tmp[ 2 ] = fronts[ f ].slice( 0 , j + 1 );
		tmp[ 3 ] = front.slice( m + i, front.length );
		
		unionIdxA = m + i;
		unionIdxB = m + i + 1 + fronts[ f ].length
		
		front = [];
		
		for ( let t = 0; t < 4; t ++ ) {
			
			for ( let k = 0; k < tmp[ t ].length ; k ++ ) {
				
				front.push( tmp[ t ][ k ] );
				
			}
			
		}
		
		fronts[ f ] = []; // empty united front
		
		united = true;
		
	}
	
	function partFrontBounds( ) {
		
		let idx, xmin, ymin, zmin, xmax, ymax, zmax;
		
		partBounds = [];
		
		xmin = ymin = zmin = Infinity;
		xmax = ymax = zmax = -Infinity;
		
		for( let i = 0; i < partFront.length; i ++ ) {
			
			idx = partFront[ i ].idx * 3;
			
			x = g.positions[ idx ]; 
			y = g.positions[ idx + 1 ];
			z = g.positions[ idx + 2 ];
			
			xmin = x < xmin ? x : xmin; 
			ymin = y < ymin ? y : ymin;
			zmin = z < zmin ? z : zmin;
			
			xmax = x > xmax ? x : xmax;
			ymax = y > ymax ? y : ymax;
			zmax = z > zmax ? z : zmax;
			
		}
		
		partBounds.push( xmin, ymin, zmin, xmax, ymax, zmax );
		
		boundings.push( partBounds );
		
	}
	
	function replaceFront( m, fNew ) {
		
		let rear = front.splice( m, front.length - m )
		
		for ( let i = 0; i < fNew.length; i ++ ) {
			
			front.push( fNew[ i ] ); //  new front points
			
		}
		
		for ( let i = 1; i < rear.length; i ++ ) { // 1: without old front point m 
			
			front.push( rear[ i ] );
			
		}
		
	}
	
	function storePoint( theta, phi ) {
		
		g.positions[ posIdx     ] = Math.sin( theta ) * Math.cos( phi );
		g.positions[ posIdx + 1 ] = Math.cos( theta );
		g.positions[ posIdx + 2 ] = -Math.sin( theta ) * Math.sin( phi );
		
		posIdx += 3;
	
	}
	
	function makeFirstTriangle ( ) {
		
		storePoint( 0, 0 ); // ( theta, phi )
		storePoint( d, -Math.PI / 6 );
		storePoint( d,  Math.PI / 6 );
		
		g.indices[ 0 ] = 0;
		g.indices[ 1 ] = 1; 
		g.indices[ 2 ] = 2;
		
		indIdx += 3;
		
		front = [];
		
		front.push( { idx: 0, ang: 0 }, { idx: 1, ang: 0 }, { idx: 2, ang: 0 } );
		fronts.push( front )
		
	}
	
	function makeLastTriangle( ) {
		
		g.indices[ indIdx     ] = front[ 2 ].idx;
		g.indices[ indIdx + 1 ] = front[ 1 ].idx 
		g.indices[ indIdx + 2 ] = front[ 0 ].idx;
		
	}
	
	function makePointsHole( i ) {
	
		let theta, phi, count, xmin, ymin, zmin, xmax, ymax, zmax;
		
		xmin = ymin = zmin = Infinity;
		xmax = ymax = zmax = -Infinity;
		
		fronts[ holeNumber ] = [];
		boundings[ holeNumber ] = [];
	
		theta = g.holes[ i ][ 0 ];
		phi = g.holes[ i ][ 1 ]; 
		
		x1 = Math.sin( theta ) * Math.cos( phi );
		y1 = Math.cos( theta );
		z1 = -Math.sin( theta ) * Math.sin( phi );
		
		for ( let j = 1; j < g.holes[ i ].length / 2 + 1; j ++ ) {
		
			g.positions[ posIdx     ] = x1;
			g.positions[ posIdx + 1 ] = y1;
			g.positions[ posIdx + 2 ] = z1;
			
			fronts[ holeNumber ].push( { idx: posIdx / 3, ang: 0 } );
			
			xmin = x1 < xmin ? x1 : xmin;
			ymin = y1 < ymin ? y1 : ymin;
			zmin = z1 < zmin ? z1 : zmin;
			
			xmax = x1 > xmax ? x1 : xmax;
			ymax = y1 > ymax ? y1 : ymax;
			zmax = z1 > zmax ? z1 : zmax;
			
			posIdx += 3;
			
			theta = g.holes[ i ][ j < g.holes[ i ].length / 2 ? j * 2 : 0 ]; // 0 => connect to start
			phi = g.holes[ i ][ j < g.holes[ i ].length / 2 ? j * 2 + 1 : 1 ]; // 1 => connect to start
			
			x2 = Math.sin( theta ) * Math.cos( phi );
			y2 = Math.cos( theta );
			z2 = -Math.sin( theta ) * Math.sin( phi );
			
			xv2 = x2 - x1;
			yv2 = y2 - y1;
			zv2 = z2 - z1;
			
			len = length( xv2, yv2, zv2 );
			
			if ( len > d ) {
				
				count = Math.ceil( len / d );
				
				for ( let k = 1; k < count; k ++ ) {
					
					x = x1 + k * xv2 / count;
					y = y1 + k * yv2 / count;
					z = z1 + k * zv2 / count;
					
					len = length( x, y, z );
					
					g.positions[ posIdx     ] = x / len;
					g.positions[ posIdx + 1 ] = y / len;
					g.positions[ posIdx + 2 ] = z / len;
					
					fronts[ holeNumber ].push( { idx: posIdx / 3, ang: 0 } );
					
					xmin = x < xmin ? x : xmin;
					ymin = y < ymin ? y : ymin;
					zmin = z < zmin ? z : zmin;
					
					xmax = x > xmax ? x : xmax;
					ymax = y > ymax ? y : ymax;
					zmax = z > zmax ? z : zmax;
					
					posIdx += 3;
					
				}
				
			}
			
			x1 = x2;
			y1 = y2;
			z1 = z2;
			
		}
		
		boundings[ holeNumber ].push( xmin, xmax, ymin, ymax, zmin, zmax );
		
		holeNumber ++;
		
	}
	
	function makeCircularHole( i ) {
		
		let theta = g.holes[ i ][ 0 ];
		let phi = g.holes[ i ][ 1 ];
		let count = g.holes[ i ][ 2 ];
		
		let xmin, ymin, zmin, xmax, ymax, zmax;
		
		xmin = ymin = zmin = Infinity;
		xmax = ymax = zmax = -Infinity;
		
		xp = Math.sin( theta ) * Math.cos( phi );
		yp = Math.cos( theta );
		zp = -Math.sin( theta ) * Math.sin( phi );
		
		let r = count / detail / 2; // radius cutting circle
		
		h = Math.sqrt( 1 - r * r );
				
		if ( !(xp === 0 && yp === 0 ) ) {
			
			xt1 = -yp;
			yt1 = xp;
			zt1 = 0;
			
		} else { 
			
			xt1 = 0;
			yt1 = 1;
			zt1 = 0;
				
		} 	
		
		// cross
		
		xt2 = yp * zt1 - zp * yt1;
		yt2 = zp * xt1 - xp * zt1;
		zt2 = xp * yt1 - yp * xt1;
		
		len = length( xt1, yt1, zt1 ); // to normalize
		
		xt1 = xt1 / len;
		yt1 = yt1 / len;
		zt1 = zt1 / len;
		
		len = length( xt2, yt2, zt2 ); // to normalize
		
		xt2 = xt2 / len;
		yt2 = yt2 / len;
		zt2 = zt2 / len;
		
		xc = h * xp;
		yc = h * yp;
		zc = h * zp;
		
		g.circles.push( [ xc, yc, zc, r, count ] ); // for external use
		
		fronts[ holeNumber ] = [];
		boundings[ holeNumber ] = [];
		
		for ( let i = 0, phi = 0; i < count; i ++, phi += 2 * Math.PI / count ) {
			
			x = xc + Math.cos( phi ) * r * xt1 + Math.sin( phi ) * r * xt2;
			y = yc + Math.cos( phi ) * r * yt1 + Math.sin( phi ) * r * yt2;
			z = zc + Math.cos( phi ) * r * zt1 + Math.sin( phi ) * r * zt2;
			
			g.positions[ posIdx     ] = x;
			g.positions[ posIdx + 1 ] = y;
			g.positions[ posIdx + 2 ] = z;
			
			fronts[ holeNumber ].push( { idx: posIdx / 3, ang: 0 } );
			
			xmin = x < xmin ? x : xmin;
			ymin = y < ymin ? y : ymin;
			zmin = z < zmin ? z : zmin;
			
			xmax = x > xmax ? x : xmax;
			ymax = y > ymax ? y : ymax;
			zmax = z > zmax ? z : zmax;
			
			posIdx += 3;
			
		}
		
		boundings[ holeNumber ].push( xmin, xmax, ymin, ymax, zmin, zmax );
		
		holeNumber ++;
		
	}
	
	function getSystemAtPoint( i ) {
		
		getPrevPoint( i );
		getPoint( i );
		
		// centerAngle = Math.acos( Math.abs( x1 * xp + y1 * yp + z1 * zp ) );
		// r = Math.sin( centerAngle ); // radius cutting circle	
		// h = Math.cos( centerAngle ); // distance center to cutting circle
		
		h = Math.abs( x1 * xp + y1 * yp + z1 * zp );
		
		// center cutting circle (refers to previous point)
		xc = h * xp; 
		yc = h * yp;
		zc = h * zp;
		
		// first tangent
		xt1 = x1 - xc;
		yt1 = y1 - yc;
		zt1 = z1 - zc;
		
		len = length( xt1, yt1, zt1 ); // to normalize
		
		xt1 = xt1 / len;
		yt1 = yt1 / len;
		zt1 = zt1 / len;
		
		// cross, second tangent (sphere radius 1: p equals normal)
		
		xt2 = yp * zt1 - zp * yt1;
		yt2 = zp * xt1 - xp * zt1;
		zt2 = xp * yt1 - yp * xt1;
		
	}
	
	function getPrevPoint( i ) {
		
		frontPosIdx = front[ prevFront( i ) ].idx * 3 ;
		x1 = g.positions[ frontPosIdx ]; 
		y1 = g.positions[ frontPosIdx + 1 ];
		z1 = g.positions[ frontPosIdx + 2 ];
		
	}
	
	function getPoint( i ) {
		
		frontPosIdx = front[ i ].idx * 3;
		xp = g.positions[ frontPosIdx ]; 
		yp = g.positions[ frontPosIdx + 1 ];
		zp = g.positions[ frontPosIdx + 2 ];
		
	}
	
	function getNextPoint( i ) {
		
		frontPosIdx = front[ nextFront( i ) ].idx * 3;
		x2 = g.positions[ frontPosIdx ];
		y2 = g.positions[ frontPosIdx + 1 ];
		z2 = g.positions[ frontPosIdx + 2 ];
		
	}
	
}

exports.createSphereWithHoles = createSphereWithHoles;
exports.buildSphereWithHolesObj = buildSphereWithHolesObj;
exports.buildSphereWithHoles = buildSphereWithHoles;

// ......................................   -   ..................................................

//#################################################################################################

Object.defineProperty(exports, '__esModule', { value: true });

})));