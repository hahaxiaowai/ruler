function _classCallCheck(a, n) {
  if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
}

function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}

function toPrimitive(t, r) {
  if ("object" != _typeof(t) || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r );
    if ("object" != _typeof(i)) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (String )(t);
}

function toPropertyKey(t) {
  var i = toPrimitive(t, "string");
  return "symbol" == _typeof(i) ? i : i + "";
}

function _defineProperties(e, r) {
  for (var t = 0; t < r.length; t++) {
    var o = r[t];
    o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, toPropertyKey(o.key), o);
  }
}
function _createClass(e, r, t) {
  return r && _defineProperties(e.prototype, r), Object.defineProperty(e, "prototype", {
    writable: !1
  }), e;
}

var Ruler = /*#__PURE__*/function () {
  function Ruler(id) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    _classCallCheck(this, Ruler);
    this.dom = document.getElementById(id);
    if (!this.dom) throw new Error('请传入canvas的id');
    if (this.dom.getContext) this.ctx = this.dom.getContext('2d');
    this.initRuler(options);
    this.drawRuler();
    if (options.isListener) {
      this.addListener();
    }
  }
  return _createClass(Ruler, [{
    key: "initRuler",
    value: function initRuler(options) {
      // canvas
      if (this.dom.width === 300 && this.dom.height === 150) {
        this.dom.width = this.dom.parentElement.clientWidth;
        this.dom.height = this.dom.parentElement.clientHeight;
      }
      if (options.width && options.height) {
        this.dom.width = options.width;
        this.dom.height = options.height;
      }
      // grid
      this.grid = options.grid;
      this._gridSize = 50;
      this.gridChange = options.gridChange || true;
      // ruler
      this.rulerWidth = options.rulerWidth || 20;
      this.rulerColor = options.rulerColor || "rgba(255,255,255,0.8)";
      this.scaleColor = options.scaleColor || "black";
      this.scaleHeight = options.scaleHeight || 6;
      this.topNumberPadding = options.topNumberPadding || 11;
      this.leftNumberPadding = options.leftNumberPadding || 2;
      this._scaleStepList = [1, 2, 5, 10, 25, 50, 100, 150, 300, 750, 1500]; // 必须从小到大
      this._scaleStep = 50; // 必须是scaleStepList中的一个 标尺上的数值
      this._scaleStepOrigin = this._scaleStep;
      this._zoomRatioList = [];
      for (var i = 0; i < this._scaleStepList.length; i++) {
        this._zoomRatioList.push(this._scaleStepList[i] / this._scaleStepOrigin);
      }
      if (this._scaleStepList.indexOf(this._scaleStep) < 0) {
        throw new Error('scaleStep must be one of _scaleStepList');
      }
      // event
      this._isDrag = false;
      this.dragButton = options.dragButton !== undefined ? options.dragButton : 0;
      this._dragStartMouseCoord = [];
      // translate
      this.x = 0;
      this.y = 0;
      // scale
      this._zoomOrigin = 1;
      this.zoom = 1;
      this.zoomStep = options.zoomStep || 0.2;
    }
  }, {
    key: "reDraw",
    value: function reDraw(x, y, zoom) {
      console.log(zoom);
      this.zoom = zoom;
      this.x = x;
      this.y = y;
      this.ctx.clearRect(0, 0, this.dom.width, this.dom.height);
      this.drawRuler();
    }
  }, {
    key: "drawRuler",
    value: function drawRuler() {
      this.ctx.fillStyle = this.rulerColor;
      this.ctx.fillRect(0, 0, this.dom.width, this.rulerWidth);
      this.ctx.fillRect(0, 0, this.rulerWidth, this.dom.height);
      var _this$getStartAndEnd = this.getStartAndEnd(),
        startX = _this$getStartAndEnd.startX,
        startY = _this$getStartAndEnd.startY,
        startXNum = _this$getStartAndEnd.startXNum,
        startYNum = _this$getStartAndEnd.startYNum;
      this.ctx.textAlign = 'center';
      var margin = this.rulerWidth - this.scaleHeight;
      var drawX = startX;
      var drawXNum = startXNum;
      this.ctx.strokeStyle = this.scaleColor;
      this.ctx.fillStyle = this.scaleColor;
      while (drawX <= this.dom.width) {
        this.ctx.beginPath();
        this.ctx.moveTo(drawX, margin);
        if (this.grid) {
          this.ctx.lineTo(drawX, this.dom.height);
        } else {
          this.ctx.lineTo(drawX, margin + this.scaleHeight);
        }
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.fillText(drawXNum, drawX, this.topNumberPadding);
        drawX += this._gridSize;
        drawXNum += this._scaleStep;
      }
      var drawY = startY;
      var drawYNum = startYNum;
      while (drawY <= this.dom.height) {
        this.ctx.beginPath();
        this.ctx.moveTo(margin, drawY);
        if (this.grid) {
          this.ctx.lineTo(this.dom.width, drawY);
        } else {
          this.ctx.lineTo(margin + this.scaleHeight, drawY);
        }
        this.ctx.stroke();
        this.ctx.closePath();
        this.ctx.save();
        this.ctx.translate(margin - this.leftNumberPadding, drawY);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText(drawYNum, 0, 0);
        this.ctx.restore();
        drawY += this._gridSize;
        drawYNum += this._scaleStep;
      }
    }
  }, {
    key: "getStartAndEnd",
    value: function getStartAndEnd() {
      var gridSize = this._gridSize;
      var screenX = this.x + this.dom.width / 2;
      var screenY = this.y + this.dom.height / 2;
      var n = Math.floor(screenX / gridSize);
      var startX = screenX - n * gridSize;
      var startXNum = -n * this._scaleStep;
      // 最左侧如果和Y轴标尺重叠，则向右+1
      if (startX < this.rulerWidth) {
        startX += gridSize;
        startXNum += this._scaleStep;
      }
      var n2 = Math.floor(screenY / gridSize);
      var startY = screenY - n2 * gridSize;
      var startYNum = -n2 * this._scaleStep;
      // 同上
      if (startY < this.rulerWidth) {
        startY += gridSize;
        startYNum += this._scaleStep;
      }
      return {
        startX: startX,
        startY: startY,
        startXNum: startXNum,
        startYNum: startYNum
      };
    }
  }, {
    key: "bindThreeCamera",
    value: function bindThreeCamera(camera, controls, origin) {
      var _this = this;
      var onPositionChange = function onPositionChange(o) {
        var coords = origin.project(camera);
        var halfWidth = _this.dom.width / 2;
        var halfHeight = _this.dom.height / 2;
        var originX = -(coords.x * halfWidth + halfWidth);
        var originY = -(coords.y * halfHeight + halfHeight);
        _this.zoom = camera.zoom;
        if (_this.zoom <= 0) _this.zoom = _this.zoomStep;
        _this._gridSize = _this.zoom * _this._scaleStepOrigin;
        if (_this.gridChange) {
          var step = _this.getScaleStep();
          _this._scaleStep = step;
          _this._gridSize = _this._scaleStep * _this.zoom;
        }
        _this.reDraw(-originX - halfWidth, originY + halfHeight, _this.zoom);
      };
      controls.addEventListener('change', function (e) {
        onPositionChange();
      });
    }
  }, {
    key: "addListener",
    value: function addListener() {
      var _this2 = this;
      this.dom.addEventListener('mousedown', function (e) {
        _this2.mouseDownEvent(e);
      });
      this.dom.addEventListener('mousemove', function (e) {
        _this2.mouseMoveEvent(e);
      });
      this.dom.addEventListener('mouseup', function (e) {
        _this2.mouseUpEvent(e);
      });
      this.dom.addEventListener('wheel', function (e) {
        _this2.wheelEvent(e);
      });
    }
  }, {
    key: "mouseDownEvent",
    value: function mouseDownEvent(e) {
      e.preventDefault();
      if (!(e.button === this.dragButton)) return;
      this._isDrag = true;
      this._dragStartMouseCoord = [e.offsetX, e.offsetY];
    }
  }, {
    key: "mouseMoveEvent",
    value: function mouseMoveEvent(e) {
      e.preventDefault();
      if (!this._isDrag) return;
      var dx = e.offsetX - this._dragStartMouseCoord[0];
      var dy = e.offsetY - this._dragStartMouseCoord[1];
      if (this._isDrag) {
        var nX = this.x + dx;
        var nY = this.y + dy;
        this._dragStartMouseCoord = [e.offsetX, e.offsetY];
        this.reDraw(nX, nY, this.zoom);
      }
    }
  }, {
    key: "mouseUpEvent",
    value: function mouseUpEvent(e) {
      this._isDrag = false;
    }
  }, {
    key: "wheelEvent",
    value: function wheelEvent(e) {
      if (e.deltaY > 0) {
        // 缩小
        this.zoom -= this.zoomStep;

        // this.zoom = this.zoom * (this._zoomOrigin - this.zoomStep);
        // this._gridSize = this._gridSize * (this._zoomOrigin - this.zoomStep);
      } else {
        // 放大
        this.zoom += this.zoomStep;
        // this.zoom = this.zoom / (this._zoomOrigin - this.zoomStep);
        // this._gridSize = this._gridSize / (this._zoomOrigin - this.zoomStep);
      }
      this.zoom = parseFloat(this.zoom.toFixed(2));
      if (this.zoom <= 0) this.zoom = this.zoomStep;
      this._gridSize = this.zoom * this._scaleStepOrigin;

      // 平移
      var centerX = this.dom.width / 2;
      var centerY = this.dom.height / 2;
      var dx = e.offsetX - centerX;
      var dy = e.offsetY - centerY;
      var nx = this.x + dx * this.zoomStep;
      var ny = this.y + dy * this.zoomStep;
      if (this.gridChange) {
        var step = this.getScaleStep();
        this._scaleStep = step;
        this._gridSize = this._scaleStep * this.zoom;
      }
      this.reDraw(nx, ny, this.zoom);
    }
  }, {
    key: "getScaleStep",
    value: function getScaleStep() {
      var origin = this._scaleStepList.indexOf(this._scaleStepOrigin);
      for (var i = 1; i < this._zoomRatioList.length; i++) {
        if (this.zoom >= this._zoomRatioList[i - 1] && this.zoom < this._zoomRatioList[i]) {
          var left = this.zoom - this._zoomRatioList[i - 1];
          var right = this._zoomRatioList[i] - this.zoom;
          var index = origin;
          if (left < right) {
            index = origin - (i - 1 - origin);
          } else {
            index = origin - (i - origin);
          }
          if (index > this._zoomRatioList.length - 1) index = this._zoomRatioList.length - 1;
          if (index < 0) index = 0;
          return this._scaleStepList[index];
        }
      }
      return this._scaleStep;
    }
  }]);
}();

export { Ruler as default };
