(function( root, factory ) {
	// Don't emit events from inside of notes windows
	if ( window.location.search.match( /receiver/gi ) ) { return; }


	if (typeof define === 'function' && define.amd) {
		root.RevealMultiARMaster = factory();
		root.RevealMultiARMaster.initialize();
	} else if( typeof exports === 'object' ) {
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.RevealMultiARMaster = factory();
		root.RevealMultiARMaster.initialize();
	}
}( this, function() {
	var multiplex;
	var socket;
	var socketId;

	function post() {
		var messageData = {
			state: Reveal.getState(),
			secret: multiplex.secret,
			socketId: multiplex.id,
			playerId: multiplex.playerId
		};

		socket.emit( 'multiplex-statechanged', messageData );
	};

	function postMap (worldMap) {
		var messageData = {
			map: worldMap,
			secret: multiplex.secret,
			socketId: multiplex.id,
			playerId: multiplex.playerId
		};

		socket.emit( 'multiplex-newmap', messageData );
		console.log("new map, baby!")
	}

	function postAnchor (anchor) {
		var messageData = {
			anchor: anchor,
			secret: multiplex.secret,
			socketId: multiplex.id,
			playerId: multiplex.playerId
		};

		socket.emit( 'multiplex-anchor-update', messageData );
	}

	// API
	return {

		initialize: function() {
			multiplex = Reveal.getConfig().multiplex;
			socketId = multiplex.id;
			socket = io.connect( multiplex.url );

			// socket.on(multiplex.id, (cmd, data) => {
			// 	// ignore data from sockets that aren't ours
			// 	if (data.socketId !== multiplex.id) { return; }
			// 	if( window.location.host === 'localhost:1947' ) return;
		
			// 	 if (cmd == 'multiplex-anchor-update') {
			// 		if (this.anchorUpdate) {
			// 			this.anchorUpdate(data.anchor)
			// 		}
			// 	}
			// });

			// Monitor events that trigger a change in state
			Reveal.addEventListener( 'slidechanged', post );
			Reveal.addEventListener( 'fragmentshown', post );
			Reveal.addEventListener( 'fragmenthidden', post );
			Reveal.addEventListener( 'overviewhidden', post );
			Reveal.addEventListener( 'overviewshown', post );
			Reveal.addEventListener( 'paused', post );
			Reveal.addEventListener( 'resumed', post );
		},

		// TODO: Do these belong in the API?
		postMap: postMap,
		postAnchor: postAnchor
	};

}));
