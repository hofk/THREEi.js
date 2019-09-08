// THREEi.js ( rev 108.0 )

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
//       Each single section between ..... name ...... can be deleted.
//

// ............................ TriangulationSphereWithHoles ...................................

function createSphereWithHoles( detail, holes ) {

	/* optional: holes, example:
	
	holes = [
		// circular hole, 3 elements: [ theta, phi, count ]
		[ 2.44,  0.41, 12 ],
		[ 0.72,  2.55, 19 ],	
		// points hole,: array of points theta, phi, ...  (last point is connected to first)
		[ 0,0,  0.5,-0.8,  0.25,-0.27,  0.4,0.3,  0.3,0.72 ]
	];
	
	*/
	
	g = this;  //  THREE.BufferGeometry() - geometry object from three.js
	
	g.detail = detail;
	g.holes = holes !== undefined ? holes : [];
	
	g.buildSphereWithHoles = buildSphereWithHoles;
	g.buildSphereWithHoles( );
	
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
			zmin = z < zmin ? y : zmin;
			
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
		storePoint( d, -g.detail / 6 * d );
		storePoint( d, g.detail / 6 * d );
		
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
			zmin = z1 < zmin ? y1 : zmin;
			
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
					zmin = z < zmin ? y : zmin;
					
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
			zmin = z < zmin ? y : zmin;
			
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
exports.buildSphereWithHoles = buildSphereWithHoles;

// ............................ ImplicitSurface - Triangulation  ...................................

function createImplicitSurface( isf, dx, dy, dz, xs, ys, zs, d, e, opt ) {
	
	/*  parameters:
		isf implicit surface function
		dx  partial derivate to x
		dy  partial derivate to y
		dz  partial derivate to z
		xs  x start point
		ys  y start point
		zs  z start point
		d   rough edge length of triangles
		e   epsilon for iteration Newton
		
		opt optional object, all properties also optional
			{ 	
				fc:  faces //( max. number of triangles )
				pc:  positions // ( max. number of points )
				b:   bounds //  array [ xMax, xMin, yMax, yMin, zMax, zMin ]
			}
	*/
	
	g = this;  //  THREE.BufferGeometry() - geometry object from three.js
	
	g.isf = isf;
	g.dx  = dx;
	g.dy  =	dy;
	g.dz  =	dz;
	g.xs  =	xs;
	g.ys  = ys;
	g.zs  =	zs;
	g.d   = d;
	g.e   =	e;
	
	if ( opt !== undefined ) {
		
		g.fc = ( opt.fc !== undefined ) ? opt.fc : 320000;
		g.pc = ( opt.pc !== undefined ) ? opt.pc : 160000;
		g.b = ( opt.b !== undefined ) ? opt.b : [];
		
	} else {
	
		g.fc = 320000;
		g.pc = 160000;
		g.b = [];
		
	}
	
	g.buildImplicitSurface = buildImplicitSurface;
	g.buildImplicitSurface( );
	
}

function buildImplicitSurface( ) {
	
	if ( g.b.length === 0 ) {
		
		triangulation( g.isf, g.dx, g.dy, g.dz, g.xs, g.ys, g.zs, g.d, g.e, g.fc, g.pc );
		
	} else {
		
		triangulationBounds( g.isf, g.dx, g.dy, g.dz, g.xs, g.ys, g.zs, g.d, g.e, g.fc, g.pc, g.b );
		
	}
	
	// The two slightly different functions can be copied separately into your own projects.
	
	function triangulation( isf, dx, dy, dz, xs, ys, zs, d, e, fc, pc ) {
		
		const squareLength = ( x,y,z ) => ( x*x + y*y + z*z );
		const length = ( x,y,z ) => ( Math.sqrt( x*x + y*y + z*z ) );
		const prevFront = ( i ) => ( i !== 0 ? i - 1 : front.length - 1 );
		const nextFront = ( i ) => ( i !== front.length - 1 ? i + 1 : 0 );
		const determinant = ( xa,ya,za, xb,yb,zb, xc,yc,zc ) => ( xa*yb*zc + ya*zb*xc + za*xb*yc - za*yb*xc - xa*zb*yc - ya*xb*zc );
		
		let m; // index of the current front point
		let n; // number of new points
		let nT; // number of new triangles
		let nIns; // number of new points (after union or split)
		let dAng; // partial angle
		let phi; // angle (new points)
		let len, d1, d2, d12; // lengths
		let iSplit, jSplit; // split front indices  
		let iUnite, jUnite, fUnite; // unite front indices, front number (to unite) 
		
		// points and vectors:
		let xp, yp, zp; // actual point p
		let x1, y1, z1, x2, y2, z2; // previous and next point to p in front
		let xn, yn, zn; // partial derivations on point p, normal, gradient
		let xt1, yt1, zt1, xt2, yt2, zt2; // tangents
		let xs1, ys1, xs2, ys2; // p in tangential system (only x, y required)
		let xc, yc, zc; // actual point as center point for new points
		
		//  preparation
		
		g.indices = new Uint32Array( fc * 3 );
		g.positions = new Float32Array( pc * 3 );
		g.normals = new Float32Array( pc * 3 );
		
		g.setIndex( new THREE.BufferAttribute( g.indices, 1 ) );
		g.addAttribute( 'position', new THREE.BufferAttribute( g.positions, 3 ) );
		g.addAttribute( 'normal', new THREE.BufferAttribute( g.normals, 3 ) );
		
		let posIdx = 0;
		let indIdx = 0;
		let frontPosIdx, unionIdxA, unionIdxB, splitIdx;
		
		let front = []; // active front // front[ i ]: object { idx: 0, ang: 0 }
		let partFront = []; // separated part of the active front (to split)
		let insertFront = []; // new front points to insert into active front
		let fronts = []; // all fronts
		let partBounds = []; // bounding box of partFront [ xmin, xmax, ymin, ymax, zmin, zmax ]
		let boundings = []; // fronts bounding boxes
		let noCheck = []; // no distance check (point indices)
		let smallAngles = []; // new angles < 1.5
		
		let unite = false;
		let split = false;
		
		let dd = d * d;
		
		fronts.push( [] );
		boundings.push( [] );
		
		let frontStock = 0; // number of fronts still to be processed
		let activeFrontNo = 0;
		front = fronts[ activeFrontNo ];
		
		///////////////////// DEBUG triangles /////////////////////////
		// let stp = 0; 
		///////////////////////////////////////////////////////////////
		
		makeFirstTriangle( ); // first triangle creates a front
		
		// ------ triangulation cycle -------------
		
		while ( frontStock > 0 ) {	
			
			if (  !unite && !split ) { // triangulation on the front
					
				smallAngles = [];
				
				for ( let i = 0; i < front.length; i ++ ) {
					
					if( front[ i ].ang === 0 ) calculateFrontAngle( i ); // is to be recalculated (angle was set to zero)
					
				}
				
				m = getMinimalAngleIndex( ); // front angle
				makeNewTriangles( m );
				
				if ( front.length > 9 && smallAngles.length === 0 ) {
					
					checkDistancesToUnite( m );
					checkDistancesToSplit( m );
					
				}
				
				if ( front.length === 3 ) {
					
					makeLastTriangle( ); // last triangle closes the front
					chooseNextFront( ); // if aviable
					
				}
				
			} else { // unite the active front to another front or split the active front
				
				if ( unite ) {
					
					uniteFront(  m, iUnite, fUnite, jUnite );
					trianglesAtUnionPoints( );
					unite = false;
					
				} else if ( split ) {
					
					splitFront( iSplit, jSplit );
					trianglesAtSplitPoints( );
					split = false;
					
				}
				
			}
			
			/////////////// DEBUG triangles /////////////////////
			//if ( stp > 100 ) break;
			///////////////////////////////////////////////////////
			
		}
		
		// .....  detail functions .....
		
		function makeFirstTriangle( ) {
			
			xp = xs;
			yp = ys;
			zp = zs;
			
			iterationNewton( );
			
			// first point
			g.positions[ posIdx     ] = xp;
			g.positions[ posIdx + 1 ] = yp;
			g.positions[ posIdx + 2 ] = zp;
			
			// first normal
			g.normals[ posIdx     ] = xn;
			g.normals[ posIdx + 1 ] = yn;
			g.normals[ posIdx + 2 ] = zn;
			
			front.push( { idx: posIdx / 3, ang: 0 } ); // first front point
			
			posIdx += 3;
			
			// start point neighbour
			x1 = xs + d / 32;
			y1 = ys + d / 32;
			z1 = zs + d / 32;
			
			calculateTangentsPoint( ); // start point and neighbour
			
			xc = xp;
			yc = yp;
			zc = zp;
			
			phi = 0;
		
			for ( let i = 0; i < 2; i ++ ) {
				
				calculateSurfacePointAndNormal( );
				
				front.push( { idx: posIdx / 3, ang: 0 } ); 
				
				posIdx += 3;
				
				phi += Math.PI / 3;
				
			}
			
			g.indices[ indIdx     ] = 0;
			g.indices[ indIdx + 1 ] = 1;
			g.indices[ indIdx + 2 ] = 2;
			
			indIdx += 3;
			
			frontStock += 1;
			
		}
		
		function checkDistancesToUnite( m ) { // for new active front points
		
			let idxJ, xChk, yChk, zChk, ddUnite;
			let ddUniteMin = Infinity;
			unite = false;
			
			for ( let i = 0; i < insertFront.length; i ++ ) {
				
				getPoint( m + i );
				
				for ( let f = 0; f < fronts.length; f ++ ) { 
					
					if ( f !== activeFrontNo ) {
						
						xChk = ( xp > boundings[ f ][ 0 ] - d ) && ( xp < boundings[ f ][ 3 ] + d );
						yChk = ( yp > boundings[ f ][ 1 ] - d ) && ( yp < boundings[ f ][ 4 ] + d );
						zChk = ( zp > boundings[ f ][ 2 ] - d ) && ( zp < boundings[ f ][ 5 ] + d );
						
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
		
		function checkDistancesToSplit( m ) { // for new active front points
			
			let mj, mjIdx, ddSplit;
			let ddSplitMin = Infinity;
			split = false;
			
			for ( let i = 0; i < front.length ; i ++ ) {
				
				for ( let j = 0; j < n; j ++ ) { // check n new points (insertFront)
					
					mj = m + j;
					
					// except new points themselves and neighbor points
					if ( Math.abs( i - mj ) > 3 && Math.abs( i - mj ) < front.length - 3 ) {
						
						mjIdx = front[ mj ].idx * 3;
						
						// Hint: here (1) is exceptionally new point in the front!
						x1 = g.positions[ mjIdx ]; 
						y1 = g.positions[ mjIdx + 1 ];
						z1 = g.positions[ mjIdx + 2 ];
						
						getPoint( i );
						
						ddSplit = squareLength ( x1 - xp, y1 - yp, z1 - zp );
						
						if ( ddSplit < dd && ddSplit < ddSplitMin ) {
							
							ddSplitMin = ddSplit;
							iSplit = i;
							jSplit = mj;
							split = true; 
							
						}
						
					}
					
				}
				
			}
			
		}
		
		function splitFront( iSplit, jSplit ) {
			
			let k;
			
			front[ iSplit ].ang = 0;
			front[ jSplit ].ang = 0;
			
			if ( iSplit > jSplit )  { // swap
				
				k = jSplit;
				jSplit = iSplit;
				iSplit = k;
				
			} 
			
			splitIdx = iSplit;	// lower index
			
			partFront = [];
			
			// to duplicate
			let frontI = front[ iSplit ];
			let frontJ = front[ jSplit ];
			
			partFront = front.splice( iSplit + 1, jSplit - iSplit - 1 );
			partFront.unshift( frontI );
			partFront.push( frontJ );
			
			fronts.push( partFront );
			
			partFrontBounds( );
			
			frontStock += 1; // new front created
			
		}
		
		function trianglesAtSplitPoints( ) {
			
			nIns = 0; // count inserted points
			
			let idx0 = splitIdx; // splitIdx is the lower index 
			let idx1 = splitIdx + 1;
			
			calculateFrontAngle( idx0 );
			calculateFrontAngle( idx1 );
			
			if ( front[ idx1 ].ang < front[ idx0 ].ang ){
				
				makeNewTriangles( idx1 );
				nIns += n - 1;
				calculateFrontAngle( idx0 );
				makeNewTriangles( idx0 );
				
			} else {
				
				makeNewTriangles( idx0 );
				nIns += n - 1;
				calculateFrontAngle( idx1 + nIns );
				makeNewTriangles( idx1 + nIns );
				
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
			
			insertFront = []; // new front points
			
			nT = Math.floor( 3 * front[ m ].ang / Math.PI ) + 1; // number of new triangles
			
			dAng = front[ m ].ang / nT;
			
			getPrevPoint( m );
			getPoint( m );
			getNextPoint( m );
			getNormal( m );
			
			calculateTangentsPoint( );
			
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
				
				/////////////// DEBUG triangles ///////////////////////
				// stp ++
				///////////////////////////////////////////////////////
				
				front[ prevFront( m ) ].ang = 0;
				front[ nextFront( m ) ].ang = 0;
				
				front.splice( m, 1 ); // delete point with index m from the front
				
			} else { // more then one triangle
				
				// point p is center of circle in tangent plane
				
				xc = xp;
				yc = yp;
				zc = zp;
				
				phi = dAng; // start angle in tangential system
				
				for ( let i = 0 ; i < n; i ++ ) {
					
					calculateSurfacePointAndNormal( );
					
					insertFront.push( { idx: posIdx / 3, ang: 0 } );
					
					posIdx += 3;
					
					phi += dAng;
					
				}
				
				g.indices[ indIdx     ] = front[ m ].idx;
				g.indices[ indIdx + 1 ] = front[ prevFront( m ) ].idx 
				g.indices[ indIdx + 2 ] = insertFront[ 0 ].idx;
				
				indIdx += 3;
				
				/////////////// DEBUG triangles ///////////////////////
				// stp ++
				///////////////////////////////////////////////////////
				
				front[ prevFront( m ) ].ang = 0;
				
				for ( let i = 0; i < n - 1; i ++ ) {
					
					g.indices[ indIdx     ] = front[ m ].idx;
					g.indices[ indIdx + 1 ] = insertFront[ i ].idx;
					g.indices[ indIdx + 2 ] = insertFront[ i + 1 ].idx;
					
					indIdx += 3;
					
					/////////////// DEBUG triangles ///////////////////////
					// stp ++
					///////////////////////////////////////////////////////
					
				}
				
				g.indices[ indIdx     ] = front[ m ].idx;
				g.indices[ indIdx + 1 ] = insertFront[ n - 1 ].idx;
				g.indices[ indIdx + 2 ] = front[ nextFront( m ) ].idx;
				
				front[ nextFront( m ) ].ang = 0;
				
				indIdx += 3;
				
				/////////////// DEBUG triangles ///////////////////////
				// stp ++
				///////////////////////////////////////////////////////
				
				replaceFront( m, insertFront ); // replaces front[ m ] with new points
				
			}
			
		}
		
		function makeLastTriangle( ) {
			
			g.indices[ indIdx     ] = front[ 2 ].idx;
			g.indices[ indIdx + 1 ] = front[ 1 ].idx 
			g.indices[ indIdx + 2 ] = front[ 0 ].idx;
			
			indIdx += 3;
			
			/////////////// DEBUG triangles ///////////////////////
			// stp ++
			///////////////////////////////////////////////////////
			
			front = [];
			
			fronts[ activeFrontNo ] = [];
			
			frontStock -= 1; // close front
			
		}
		
		function chooseNextFront ( ) {
			
			if ( frontStock > 0 ) {
				
				for ( let i = 0; i < fronts.length; i ++ ) {
				
					if ( fronts[ i ].length > 0 ) {
						
						activeFrontNo = i;
						break;
						
					}
					
				}
				
				front = fronts[ activeFrontNo ];
				
			}
			
		}
		
		function calculateSurfacePointAndNormal( ) {
			
			xp = xc + Math.cos( phi ) * d * xt1 + Math.sin( phi ) * d * xt2;
			yp = yc + Math.cos( phi ) * d * yt1 + Math.sin( phi ) * d * yt2;
			zp = zc + Math.cos( phi ) * d * zt1 + Math.sin( phi ) * d * zt2;
			
			iterationNewton ( ); 
			
			g.positions[ posIdx     ] = xp;
			g.positions[ posIdx + 1 ] = yp;
			g.positions[ posIdx + 2 ] = zp;
			
			g.normals[ posIdx     ] = xn;
			g.normals[ posIdx + 1 ] = yn;
			g.normals[ posIdx + 2 ] = zn;
			
		}
		
		function iterationNewton ( ) {
			
			let xp0, yp0, zp0;
			
			xp0 = xp;
			yp0 = yp;
			zp0 = zp;
			
			newtonStep( );
			
			while ( length( xp0 - xp, yp0 - yp, zp0 - zp  ) > e ) {
				
				xp0 = xp;
				yp0 = yp;
				zp0 = zp;
				
				newtonStep( );
				
			}
			
			len = length( xn, yn, zn ); // to normalize
			
			xn = xn / len;
			yn = yn / len;
			zn = zn / len;
			
		}
		
		function newtonStep( ) {
			
			let cc, t;
			
			xn = dx( xp, yp, zp );
			yn = dy( xp, yp, zp );
			zn = dz( xp, yp, zp );
			
			cc = xn * xn + yn * yn + zn * zn;
			
			if ( cc > e * e ) {
				
				t = -isf( xp, yp, zp ) / cc;
				
			} else {
				
				t = 0;
				console.log( 'WARNING tri (surface_point...): newton')
				
			}
			
			xp = xp + t * xn;
			yp = yp + t * yn;
			zp = zp + t * zn;
			
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
			
			getPrevPoint( i ); // (1)
			getPoint( i );
			getNextPoint( i ); // (2)
			
			coordTangentialSystem( );
			
			ang1 = atan2PI( xs1, ys1 );
			ang2 = atan2PI( xs2, ys2 );
			
			if ( ang2 < ang1 )  ang2 += Math.PI * 2;
			
			front[ i ].ang  = ang2 - ang1;
			
			if ( front[ i ].ang < 1.5 ) smallAngles.push( i );
			
		}	
		
		function partFrontBounds( ) {
			
			let x, y, z, idx, xmin, ymin, zmin, xmax, ymax, zmax;
			
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
		
		function getNormal( i ){
		
			frontPosIdx = front[ i ].idx * 3;
			
			xn = g.normals[ frontPosIdx ]; 
			yn = g.normals[ frontPosIdx + 1 ];
			zn = g.normals[ frontPosIdx + 2 ];
			
		}
		
		function calculateTangentsPoint( ) {
			
			// cross
			
			xt2 = yn * ( z1 - zp ) - zn * ( y1 - yp );
			yt2 = zn * ( x1 - xp ) - xn * ( z1 - zp );
			zt2 = xn * ( y1 - yp ) - yn * ( x1 - xp );
			
			len = length( xt2, yt2, zt2 ); // to normalize
			
			xt2 = xt2 / len;
			yt2 = yt2 / len;
			zt2 = zt2 / len; 
			
			// cross
			xt1 = yt2 * zn - zt2 * yn;
			yt1 = zt2 * xn - xt2 * zn;
			zt1 = xt2 * yn - yt2 * xn;
			
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
	
	// +++ Variant with boundaries, somewhat more effort, absolutely necessary for infinite surfaces such as cylinders and cones. +++
	
	function triangulationBounds( isf, dx, dy, dz, xs, ys, zs, d, e, fc, pc, b ) {
	
		let	bd = b; // make compatible in function
		
		const squareLength = ( x,y,z ) => ( x*x + y*y + z*z );
		const length = ( x,y,z ) => ( Math.sqrt( x*x + y*y + z*z ) );
		const prevFront = ( i ) => ( i !== 0 ? i - 1 : front.length - 1 );
		const nextFront = ( i ) => ( i !== front.length - 1 ? i + 1 : 0 );
		const determinant = ( xa,ya,za, xb,yb,zb, xc,yc,zc ) => ( xa*yb*zc + ya*zb*xc + za*xb*yc - za*yb*xc - xa*zb*yc - ya*xb*zc );
		
		let m; // index of the current front point
		let n; // number of new points
		let nT; // number of new triangles
		let nIns; // number of new points (after union or split)
		let dAng; // partial angle
		let phi; // angle (new points)
		let len, d1, d2, d12; // lengths
		let iSplit, jSplit; // split front indices  
		let iUnite, jUnite, fUnite; // unite front indices, front number (to unite) 
		
		// points and vectors:
		let xp, yp, zp; // actual point p
		let x1, y1, z1, x2, y2, z2; // previous and next point to p in front
		let xn, yn, zn; // partial derivations on point p, normal, gradient
		let xt1, yt1, zt1, xt2, yt2, zt2; // tangents
		let xs1, ys1, xs2, ys2; // p in tangential system (only x, y required)
		let xc, yc, zc; // actual point as center point for new points
		
		let bdPoint = false; // if border point 
		
		//  preparation
		
		g.indices = new Uint32Array( fc * 3 );
		g.positions = new Float32Array( pc * 3 );
		g.normals = new Float32Array( pc * 3 );
		
		g.setIndex( new THREE.BufferAttribute( g.indices, 1 ) );
		g.addAttribute( 'position', new THREE.BufferAttribute( g.positions, 3 ) );
		g.addAttribute( 'normal', new THREE.BufferAttribute( g.normals, 3 ) );
		
		let posIdx = 0;
		let indIdx = 0;
		let frontPosIdx, unionIdxA, unionIdxB, splitIdx;
		
		let front = []; // active front // front[ i ]: object { idx: 0, ang: 0, bou: false } // bou:  boundary point
		let partFront = []; // separated part of the active front (to split)
		let insertFront = []; // new front points to insert into active front
		let fronts = []; // all fronts
		let partBounds = []; // bounding box of partFront [ xmin, xmax, ymin, ymax, zmin, zmax ]
		let boundings = []; // fronts bounding boxes
		let noCheck = []; // no distance check (point indices)
		let smallAngles = []; // new angles < 1.5
		
		let unite = false;
		let split = false;
		
		let dd = d * d;
		
		fronts.push( [] );
		boundings.push( [] );
		
		let frontStock = 0; // number of fronts still to be processed
		let activeFrontNo = 0;
		front = fronts[ activeFrontNo ];
		
		let pCount; // count available points in active front
		
		///////////////////// DEBUG triangles /////////////////////////
		//let stp = 0; 
		///////////////////////////////////////////////////////////////
		
		makeFirstTriangle( ); // first triangle creates a front
		
		// ------ triangulation cycle -------------
		
		while ( frontStock > 0 ) {	
			
			if (  !unite && !split ) { // triangulation on the front
				
				smallAngles = [];
				
				for ( let i = 0; i < front.length; i ++ ) {
					
					// is to be recalculated (angle was set to zero, not for boundary point)
					if( front[ i ].ang === 0 && !front[ i ].bou ) calculateFrontAngle( i ); 
					
				}
				
				m = getMinimalAngleIndex( ); // front angle
				makeNewTriangles( m );
				
				if ( front.length > 9 && smallAngles.length === 0 ) {
					
					checkDistancesToUnite( m );
					checkDistancesToSplit( m );
					
				}
				
				pCount = 0;
				
				for ( let i = 0; i < front.length; i ++ ) {
					
					if ( !front[ i ].bou ) pCount ++; // count available points (means no boundary point)
					
				}
				
				if ( front.length === 3 || pCount === 0 ) { // close front
					
					if ( front.length === 3 ) makeLastTriangle( );
					
					front = [];
					fronts[ activeFrontNo ] = [];
					frontStock -= 1;
					chooseNextFront( ); // if available
					
				}
				
			} else {
				
				// unite the active front to another front or split the active front
				
				if ( unite ) {
					
					uniteFront(  m, iUnite, fUnite, jUnite );
					trianglesAtUnionPoints( );
					
					unite = false;
					
				} else if ( split ) {
					
					splitFront( iSplit, jSplit );
					trianglesAtSplitPoints( );
					split = false;
					
				}
				
			}
			
			/////////////// DEBUG triangles /////////////////////
			//if ( stp > 500 ) break;
			///////////////////////////////////////////////////////
			
		}
		
		// .....  detail functions .....
		
		function makeFirstTriangle( ) {
			
			xp = xs;
			yp = ys;
			zp = zs;
			
			iterationNewton( );
			
			// first point
			g.positions[ posIdx     ] = xp;
			g.positions[ posIdx + 1 ] = yp;
			g.positions[ posIdx + 2 ] = zp;
			
			// first normal
			g.normals[ posIdx     ] = xn;
			g.normals[ posIdx + 1 ] = yn;
			g.normals[ posIdx + 2 ] = zn;
			
			front.push( { idx: posIdx / 3, ang: 0, bou: false } ); // first front point, no boundary point
			
			posIdx += 3;
			
			// start point neighbour
			x1 = xs + d / 32;
			y1 = ys + d / 32;
			z1 = zs + d / 32;
			
			calculateTangentsPoint( ); // start point and neighbour
			
			xc = xp;
			yc = yp;
			zc = zp;
			
			phi = 0;
			
			for ( let i = 0; i < 2; i ++ ) {
				
				calculateSurfacePointAndNormal( );
				
				front.push( { idx: posIdx / 3, ang: 0, bou: false } ); 
				
				posIdx += 3;
				
				phi += Math.PI / 3;
				
			}
			
			g.indices[ indIdx     ] = 0;
			g.indices[ indIdx + 1 ] = 1;
			g.indices[ indIdx + 2 ] = 2;
			
			indIdx += 3;
			
			frontStock += 1;
			
		}
		
		function checkDistancesToUnite( m ) { // for new active front points
		
			let idxJ, xChk, yChk, zChk, ddUnite;
			let ddUniteMin = Infinity;
			unite = false;
			
			for ( let i = 0; i < insertFront.length; i ++ ) {
				
				if ( !front[ m + i ].bou ) {  // not for boundary point
					
					getPoint( m + i );
					
					for ( let f = 0; f < fronts.length; f ++ ) { 
						
						if ( f !== activeFrontNo ) {
							
							xChk = ( xp > boundings[ f ][ 0 ] - d ) && ( xp < boundings[ f ][ 3 ] + d );
							yChk = ( yp > boundings[ f ][ 1 ] - d ) && ( yp < boundings[ f ][ 4 ] + d );
							zChk = ( zp > boundings[ f ][ 2 ] - d ) && ( zp < boundings[ f ][ 5 ] + d );
							
							if (  xChk || yChk || zChk ) {
								
								for ( let j = 0; j < fronts[ f ].length; j ++ ) {
									
									if ( !fronts[ f ][ j ].bou ) { // not for boundary point
										
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
		
		function checkDistancesToSplit( m ) { // for new active front points
		
			let mj, mjIdx, ddSplit;
			let ddSplitMin = Infinity;
			split = false;
				
			for ( let i = 0; i < front.length ; i ++ ) {
				
				if ( !front[ i ].bou ) { // not for boundary point
					
					for ( let j = 0; j < n; j ++ ) { // check n new points (insertFront)
					
						mj = m + j;
						
						// except new points themselves, neighbor and boundary points
						if ( Math.abs( i - mj ) > 3 && Math.abs( i - mj ) < front.length - 3 && !front[ mj ].bou ) {
							
							mjIdx = front[ mj ].idx * 3;
						
							// Hint: here (1) is exceptionally new point in the front!
							x1 = g.positions[ mjIdx ]; 
							y1 = g.positions[ mjIdx + 1 ];
							z1 = g.positions[ mjIdx + 2 ];
							
							getPoint( i );
							
							ddSplit = squareLength ( x1 - xp, y1 - yp, z1 - zp );
							
							if ( ddSplit < dd && ddSplit < ddSplitMin ) {
								
								ddSplitMin = ddSplit;
								iSplit = i;
								jSplit = mj;
								split = true; 
								
							}
							
						}
						
					}
					
				}
				
			}
			
		}
		
		function splitFront( iSplit, jSplit ) {
			
			let k;
			
			front[ iSplit ].ang = 0;
			front[ jSplit ].ang = 0;
			
			if ( iSplit > jSplit )  { // swap
				
				k = jSplit;
				jSplit = iSplit;
				iSplit = k;
				
			} 
			
			splitIdx = iSplit;	// lower index
			
			partFront = [];
			
			// to duplicate
			let frontI = front[ iSplit ];
			let frontJ = front[ jSplit ];
			
			partFront = front.splice( iSplit + 1, jSplit - iSplit - 1 );
			partFront.unshift( frontI );
			partFront.push( frontJ );
			
			fronts.push( partFront );
			
			partFrontBounds( );
			
			frontStock += 1; // new front created
			
		}
		
		function trianglesAtSplitPoints( ) {
			
			nIns = 0; // count inserted points
			
			let idx0 = splitIdx; // splitIdx is the lower index 
			let idx1 = splitIdx + 1;
			
			calculateFrontAngle( idx0 );
			calculateFrontAngle( idx1 );
			
			if ( front[ idx1 ].ang < front[ idx0 ].ang ){
			
				makeNewTriangles( idx1 );
				nIns += n - 1;
				calculateFrontAngle( idx0 );
				makeNewTriangles( idx0 );
				
			} else {
				
				makeNewTriangles( idx0 );
				nIns += n - 1;
				calculateFrontAngle( idx1 + nIns );
				makeNewTriangles( idx1 + nIns );
				
			}
			
		}
	
		function getMinimalAngleIndex( ) {
			
			let angle = Infinity;
			let m;
			
			for ( let i = 0; i < front.length; i ++ ) {
				
				if( front[ i ].ang < angle && !front[ i ].bou ) { // not for boundary point
					
					angle = front[ i ].ang ;
					m = i;
					
				}
				
			}
			
			return m;
			
		}
		
		function makeNewTriangles( m ) {
			
			insertFront = []; // new front points
			
			nT = Math.floor( 3 * front[ m ].ang / Math.PI ) + 1; // number of new triangles
			
			dAng = front[ m ].ang / nT;
			
			getPrevPoint( m );
			getPoint( m );
			getNextPoint( m );
			getNormal( m );
			
			calculateTangentsPoint( );
			
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
				
				/////////////// DEBUG triangles ///////////////////////
				//stp ++
				///////////////////////////////////////////////////////
				
				front[ prevFront( m ) ].ang = 0;
				front[ nextFront( m ) ].ang = 0;
				
				front.splice( m, 1 ); // delete point with index m from the front
					
			} else { // more then one triangle
				
				// point p is center of circle in tangent plane
				
				xc = xp;
				yc = yp;
				zc = zp;
				
				phi = dAng; // start angle in tangential system
				
				for ( let i = 0 ; i < n; i ++ ) {
					
					bdPoint = false; // no boundary point
					
					calculateSurfacePointAndNormal( );
					
					// check bounds, new calculation in boundary plane
					
					if( xp > bd[ 0 ] || xp < bd[ 1 ] || yp > bd[ 2 ] || yp < bd[ 3 ] || zp > bd[ 4 ] || zp < bd[ 5 ] ) {
						
						bdPoint = true; // boundary point
						
						calculateSurfacePointAndNormal( );
						
					}
					
					insertFront.push( { idx: posIdx / 3, ang: 0, bou: bdPoint } );
					
					posIdx += 3;
					
					phi += dAng;
					
				}
				
				g.indices[ indIdx     ] = front[ m ].idx;
				g.indices[ indIdx + 1 ] = front[ prevFront( m ) ].idx 
				g.indices[ indIdx + 2 ] = insertFront[ 0 ].idx;
				
				indIdx += 3;
				
				/////////////// DEBUG triangles ///////////////////////
				//stp ++
				///////////////////////////////////////////////////////
				
				front[ prevFront( m ) ].ang = 0;
				
				for ( let i = 0; i < n - 1; i ++ ) {
					
					g.indices[ indIdx     ] = front[ m ].idx;
					g.indices[ indIdx + 1 ] = insertFront[ i ].idx;
					g.indices[ indIdx + 2 ] = insertFront[ i + 1 ].idx;
					
					indIdx += 3;
					
					/////////////// DEBUG triangles ///////////////////////
					//stp ++
					///////////////////////////////////////////////////////
					
				}
				
				g.indices[ indIdx     ] = front[ m ].idx;
				g.indices[ indIdx + 1 ] = insertFront[ n - 1 ].idx;
				g.indices[ indIdx + 2 ] = front[ nextFront( m ) ].idx;
				
				front[ nextFront( m ) ].ang = 0;
				
				indIdx += 3;
				
				/////////////// DEBUG triangles ///////////////////////
				//stp ++
				///////////////////////////////////////////////////////
				
				replaceFront( m, insertFront ); // replaces front[ m ] with new points
				
			}
			
		}
		
		function makeLastTriangle( ) {
			
			g.indices[ indIdx     ] = front[ 2 ].idx;
			g.indices[ indIdx + 1 ] = front[ 1 ].idx 
			g.indices[ indIdx + 2 ] = front[ 0 ].idx;
			
			indIdx += 3;
				
			/////////////// DEBUG triangles ///////////////////////
			stp ++;
			///////////////////////////////////////////////////////
			
			front = [];
			
			fronts[ frontNo ] = [];
			
			frontStock -= 1; // close front			
			
		}
		
		function chooseNextFront ( ) {
			
			if ( frontStock > 0 ) {
				
				for ( let i = 0; i < fronts.length; i ++ ) {
					
					if ( fronts[ i ].length > 0 ) {
						
						activeFrontNo = i;
						break;
						
					}
					
				}
				
				front = fronts[ activeFrontNo ];
				
			}
			
		}
		
		function calculateSurfacePointAndNormal( ) {
			
			if( !bdPoint ) {
				
				xp = xc + Math.cos( phi ) * d * xt1 + Math.sin( phi ) * d * xt2; 
				yp = yc + Math.cos( phi ) * d * yt1 + Math.sin( phi ) * d * yt2;
				zp = zc + Math.cos( phi ) * d * zt1 + Math.sin( phi ) * d * zt2;
				
			} else { // for boundary points
				
				xp = xp > bd[ 0 ] ? bd[ 0 ] : xp;
				xp = xp < bd[ 1 ] ? bd[ 1 ] : xp;
				yp = yp > bd[ 2 ] ? bd[ 2 ] : yp;
				yp = yp < bd[ 3 ] ? bd[ 3 ] : yp;
				zp = zp > bd[ 4 ] ? bd[ 4 ] : zp;
				zp = zp < bd[ 5 ] ? bd[ 5 ] : zp;
				
			}	
				
			iterationNewton ( ); 
			
			g.positions[ posIdx     ] = xp;
			g.positions[ posIdx + 1 ] = yp;
			g.positions[ posIdx + 2 ] = zp;
			
			g.normals[ posIdx     ] = xn;
			g.normals[ posIdx + 1 ] = yn;
			g.normals[ posIdx + 2 ] = zn;
			
		}
		
		function iterationNewton ( ) {
			
			let xp0, yp0, zp0;
			
			xp0 = xp;
			yp0 = yp;
			zp0 = zp;
			
			newtonStep( );
			
			while ( length( xp0 - xp, yp0 - yp, zp0 - zp  ) > e ) {
				
				xp0 = xp;
				yp0 = yp;
				zp0 = zp;
				
				newtonStep( );
				
			}
			
			len = length( xn, yn, zn ); // to normalize
			
			xn = xn / len;
			yn = yn / len;
			zn = zn / len;
			
		}
		
		function newtonStep( ) {
			
			let cc, t;
			
			if( !bdPoint ) {
				
				xn = dx( xp, yp, zp );
				yn = dy( xp, yp, zp );
				zn = dz( xp, yp, zp );
				
			} else { // for boundary points
				
				xn = ( xp === bd[ 0 ] || xp === bd[ 1 ] ) ? 0 : dx( xp, yp, zp );
				yn = ( yp === bd[ 2 ] || yp === bd[ 3 ] ) ? 0 : dy( xp, yp, zp );
				zn = ( zp === bd[ 4 ] || zp === bd[ 5 ] ) ? 0 : dz( xp, yp, zp );
				
			}
			
			cc = xn * xn + yn * yn + zn * zn;
			
			if ( cc > e * e ) {
				
				t = -isf( xp, yp, zp ) / cc;
				
			} else {
				
				t = 0;
				console.log( 'WARNING tri (surface_point...): newton')
				
			}
			
			xp = xp + t * xn;
			yp = yp + t * yn;
			zp = zp + t * zn;
			
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
			
			getPrevPoint( i ); // (1)
			getPoint( i );
			getNextPoint( i ); // (2)
			
			coordTangentialSystem( );
			
			ang1 = atan2PI( xs1, ys1 );
			ang2 = atan2PI( xs2, ys2 );
			
			if ( ang2 < ang1 )  ang2 += Math.PI * 2;
			
			front[ i ].ang  = ang2 - ang1;
			
			if ( front[ i ].ang < 1.5 ) smallAngles.push( i );
			
		}	
		
		function partFrontBounds( ) {
			
			let x, y, z, idx, xmin, ymin, zmin, xmax, ymax, zmax;
			
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
		
		function getNormal( i ){
		
			frontPosIdx = front[ i ].idx * 3;
			
			xn = g.normals[ frontPosIdx ]; 
			yn = g.normals[ frontPosIdx + 1 ];
			zn = g.normals[ frontPosIdx + 2 ];
			
		}
		
		function calculateTangentsPoint( ) {
			
			// cross
			
			xt2 = yn * ( z1 - zp ) - zn * ( y1 - yp );
			yt2 = zn * ( x1 - xp ) - xn * ( z1 - zp );
			zt2 = xn * ( y1 - yp ) - yn * ( x1 - xp );
		
			len = length( xt2, yt2, zt2 ); // to normalize
			
			xt2 = xt2 / len;
			yt2 = yt2 / len;
			zt2 = zt2 / len;
			
			// cross
			xt1 = yt2 * zn - zt2 * yn;
			yt1 = zt2 * xn - xt2 * zn;
			zt1 = xt2 * yn - yt2 * xn;
			
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
	
}

exports.createImplicitSurface = createImplicitSurface;
exports.buildImplicitSurface = buildImplicitSurface;

// ......................................   -   ..................................................

//#################################################################################################

Object.defineProperty(exports, '__esModule', { value: true });

})));