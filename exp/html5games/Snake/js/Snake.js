SNAKEGAME.Snake = function (x, y) {

    var _x = x || 0;
    var _y = y || 0;

    this.draw = function (canvasCtx) {
        x++;
        y++;
        canvasCtx.fillStyle = "rgb(63,167,0)";
        canvasCtx.fillRect(x, y, 50, 50);
    }
};

