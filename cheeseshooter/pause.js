var pauseHandler = function(event) {
			try {
				if(event.type=="blur") {
					//ig.game.pause();
				}
                else if(event.type=="focus") {
					//ig.game.unpause();
				}
			} catch(e){}
		}
		window.addEventListener("blur",pauseHandler,false);
        window.addEventListener("focus",pauseHandler,false);