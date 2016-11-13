/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.PointerLockControls = function ( camera, pointerLockSupported ) {

	var scope = this;

	camera.rotation.set( 0, 0, 0 );

	var pitchObject = new THREE.Object3D();
	pitchObject.add( camera );

	var yawObject = new THREE.Object3D();
	yawObject.position.y = 10;
	yawObject.add( pitchObject );

	var mouseX = 0;
	var mouseY = 0;

	var lastTouchPos = { x: 0, y: 0 };

	var PI_2 = Math.PI / 2;

	var onMouseMove = function ( event ) {

		if ( scope.enabled === false ) return;

		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

		yawObject.rotation.y -= movementX * 0.002;
		pitchObject.rotation.x -= movementY * 0.002;
		pitchObject.rotation.x = Math.max( - PI_2, Math.min( PI_2, pitchObject.rotation.x ) );

		mouseX = event.clientX;
		mouseY = event.clientY;

	};

	var onTouchMove = function (event) {

	    if (scope.enabled === false) return;

	    event.preventDefault();
	    var touches = event.changedTouches;

	    var movementX = touches[0].clientX - lastTouchPos.x;
	    var movementY = touches[0].clientY - lastTouchPos.y;

	    yawObject.rotation.y -= movementX * 0.002;
	    pitchObject.rotation.x -= movementY * 0.002;
	    pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));

	    lastTouchPos.x = touches[0].clientX;
	    lastTouchPos.y = touches[0].clientY;

	};

	var onTouchStart = function (event) {

	    if (scope.enabled === false) return;

	    event.preventDefault();
	    var touches = event.changedTouches;
	    lastTouchPos = { x: touches[0].clientX, y: touches[0].clientY };
	};

	document.addEventListener('touchstart', onTouchStart, false);
	document.addEventListener('touchmove', onTouchMove, false);
	document.addEventListener('mousemove', onMouseMove, false);

	this.enabled = false;

	this.update = function () {

	    if (scope.enabled === false) return;

	    if (!pointerLockSupported) {

	        var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
	        var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
	        var movementX = 0;
	        var movementY = 0;

	        var thresholdPc = 0.1;
	        var movement = 15;
           
	        if (mouseX < w * thresholdPc)
	            movementX = -movement;
	        else if (mouseX > w - (w * thresholdPc))
	            movementX = movement;

	        if (mouseY < h * thresholdPc)
	            movementY = -movement;
	        else if (mouseY > h - (h * thresholdPc))
	            movementY = movement;

	        yawObject.rotation.y -= movementX * 0.002;
	        pitchObject.rotation.x -= movementY * 0.002;

	        pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
	    }

	};

	this.getObject = function () {

		return yawObject;

	};

	this.getDirection = function() {

		// assumes the camera itself is not rotated

		var direction = new THREE.Vector3( 0, 0, -1 );
		var rotation = new THREE.Euler( 0, 0, 0, "YXZ" );

		return function( v ) {

			rotation.set( pitchObject.rotation.x, yawObject.rotation.y, 0 );

			v.copy( direction ).applyEuler( rotation );

			return v;

		}

	}();

};
