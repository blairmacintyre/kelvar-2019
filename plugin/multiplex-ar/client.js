(function( root, factory ) {
	// Don't emit events from inside of notes windows
	if ( window.location.search.match( /receiver/gi ) ) { return; }


	if (typeof define === 'function' && define.amd) {
		root.RevealMultiARClient = factory();
		root.RevealMultiARClient.initialize();
	} else if( typeof exports === 'object' ) {
		module.exports = factory();
	} else {
		// Browser globals (root is window)
		root.RevealMultiARClient = factory();
		root.RevealMultiARClient.initialize();
	}
}( this, function() {	var multiplex = Reveal.getConfig().multiplex;
	var multiplex;
	var socketId;
	var socket;
	var playerId = -1;

	// API
	return {

		initialize: function() {
			multiplex = Reveal.getConfig().multiplex;
			socketId = multiplex.id;
			socket = io.connect(multiplex.url);

			socket.emit("get-playerId", (id, worldMap) => {
				playerId = id
				multiplex.playerId = id
				console.log("got player id ", id)
				if (worldMap) {
					if (typeof multiplex.secret == 'undefined' || multiplex.secret == null || multiplex.secret === '') {
						console.log("new map!")
						if (this.setWorldMap) {
							console.log("initialize time, we got a map")
							this.setWorldMap(worldMap)
						} else {
							console.log("haven't set up callback yet ... oops")
						}
					} else {
						console.log("I'm the server, ignoring initial worldmap")
					}
				} else {
					console.log("no world map yet")
				}
			})

			socket.on(multiplex.id, (cmd, data) => {
				// ignore data from sockets that aren't ours
				if (data.socketId !== socketId) { return; }
				if( window.location.host === 'localhost:1947' ) return;
		
				if (cmd === 'multiplex-statechanged') {
					Reveal.setState(data.state);
				} else if (cmd === 'multiplex-newmap') {
					if (typeof multiplex.secret == 'undefined' || multiplex.secret == null || multiplex.secret === '') {
						console.log("new map!")
						if (this.setWorldMap) {
							this.setWorldMap(data.map)
						}
					} else {
						console.log ("we are master, ignoring map")
					}
				} else if (cmd == 'multiplex-anchor-update') {
					if (this.anchorUpdate) {
						this.anchorUpdate(data.playerId, data.anchor)
					}
				} else if (cmd == 'multiplex-add-anchor') {
					if (this.addAnchor) {
						if (data.playerId != multiplex.playerId) {
							console.log("received add anchor ", data.index, data.pos, data.quat)
							this.addAnchor(data.playerId, data.index, data.pos, data.quat)
						}
					}
				}
			});
		},

		updateAnchor: function(anchor) {
			var messageData = {
				anchor: anchor,
				socketId: multiplex.id,
				secret: multiplex.secret,
				playerId: multiplex.playerId
			};
	
			socket.emit( 'multiplex-anchor-update', messageData );
		},

		addNewAnchor: function(pos, quat, index) {
			var messageData = {
				index: index, 
				pos: pos,
				quat: quat,
				socketId: multiplex.id,
				secret: multiplex.secret,
				playerId: multiplex.playerId
			};
			console.log("sending add anchor ", messageData.index, messageData.pos, messageData.quat)

			socket.emit( 'multiplex-add-anchor', messageData );
		},

		// TODO: Do these belong in the API?
		setWorldMap: null,
		anchorUpdate: null,
		addAnchor: null
	};

}));
