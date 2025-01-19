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
    this._initRuler(options);
    this._drawRuler();
    if (this.listener) {
      this._addListener();
    }
  }
  return _createClass(Ruler, [{
    key: "_initRuler",
    value: function _initRuler(options) {
      var _options$grid, _options$minGridSize, _options$gridChange, _options$reverseY, _options$zoomToCursor, _options$dragButton, _options$listener;
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
      this.grid = (_options$grid = options.grid) !== null && _options$grid !== void 0 ? _options$grid : true;
      this._gridSize = 50;
      this.minGridSize = (_options$minGridSize = options.minGridSize) !== null && _options$minGridSize !== void 0 ? _options$minGridSize : 20;
      this.gridChange = (_options$gridChange = options.gridChange) !== null && _options$gridChange !== void 0 ? _options$gridChange : true;
      // ruler
      this.rulerWidth = options.rulerWidth || 20;
      this.rulerColor = options.rulerColor || "rgba(255,255,255,0.8)";
      this.scaleColor = options.scaleColor || "black";
      this.scaleHeight = options.scaleHeight || 6;
      this.topNumberPadding = options.topNumberPadding || 11;
      this.leftNumberPadding = options.leftNumberPadding || 2;
      this.scaleStepList = options.scaleStepList || [1, 2, 5, 10, 25, 50, 100, 150, 300]; // 必须从小到大
      this.scaleStep = options.scaleStep || this.scaleStepList[0]; // 必须是scaleStepList中的一个 标尺上的数值
      this._scaleOrigin = this.scaleStep;
      this._scaleGridRatio = this._gridSize / this.scaleStep; // 标尺上的数值和像素的比例
      this.reverseY = (_options$reverseY = options.reverseY) !== null && _options$reverseY !== void 0 ? _options$reverseY : false;
      // zoom
      this.zoom = 1;
      this._scale = 1;
      this.minZoom = 0;
      this.maxZoom = Infinity;
      this._zoomRatioList = [];
      for (var i = 0; i < this.scaleStepList.length; i++) {
        this._zoomRatioList.push(this.scaleStepList[i] / this.scaleStep);
      }
      this.zoomSpeed = options.zoomSpeed || 1;
      this.zoomToCursor = (_options$zoomToCursor = options.zoomToCursor) !== null && _options$zoomToCursor !== void 0 ? _options$zoomToCursor : true;
      // event
      this._isDrag = false;
      this.dragButton = (_options$dragButton = options.dragButton) !== null && _options$dragButton !== void 0 ? _options$dragButton : 0;
      this._dragStartMouseCoord = [];
      this.listener = (_options$listener = options.listener) !== null && _options$listener !== void 0 ? _options$listener : true;
      this._events = {
        mouseDown: '',
        mouseMove: '',
        mouseUp: '',
        wheel: '',
        three: ''
      };
      this._isBindThree = false;
      this._controls = null;
      // translate
      // 均为像素，非标尺比例
      this.x = 0;
      this.y = 0;
      this.checkParameter();
    }
  }, {
    key: "checkParameter",
    value: function checkParameter() {
      for (var i = 0; i < this.scaleStepList.length; i++) {
        if (this.scaleStepList[i] < 0) {
          throw new Error('scaleStepList must be greater than 0');
        }
        if (i > 0 && this.scaleStepList[i] <= this.scaleStepList[i - 1]) {
          throw new Error('scaleStepList must be from small to large');
        }
      }
      if (this.scaleStepList.indexOf(this.scaleStep) < 0) {
        throw new Error('scaleStep must be one of scaleStepList');
      }
    }
  }, {
    key: "reDraw",
    value: function reDraw(x, y, zoom) {
      this.zoom = zoom !== null && zoom !== void 0 ? zoom : this.zoom;
      this.x = x !== null && x !== void 0 ? x : this.x;
      this.y = y !== null && y !== void 0 ? y : this.y;
      this.ctx.clearRect(0, 0, this.dom.width, this.dom.height);
      this._drawRuler();
    }
  }, {
    key: "_drawRuler",
    value: function _drawRuler() {
      this.ctx.fillStyle = this.rulerColor;
      this.ctx.fillRect(0, 0, this.dom.width, this.rulerWidth);
      this.ctx.fillRect(0, 0, this.rulerWidth, this.dom.height);
      var _this$_getStartAndEnd = this._getStartAndEnd(),
        startX = _this$_getStartAndEnd.startX,
        startY = _this$_getStartAndEnd.startY,
        startXNum = _this$_getStartAndEnd.startXNum,
        startYNum = _this$_getStartAndEnd.startYNum;
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
        drawXNum += this.scaleStep;
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
        this.ctx.fillText(drawYNum * (this.reverseY ? -1 : 1), 0, 0);
        this.ctx.restore();
        drawY += this._gridSize;
        drawYNum += this.scaleStep;
      }
    }
  }, {
    key: "_getStartAndEnd",
    value: function _getStartAndEnd() {
      var gridSize = this._gridSize;
      var screenX = this.x + this.dom.width / 2;
      var screenY = this.y + this.dom.height / 2;
      var n = Math.floor(screenX / gridSize);
      var startX = screenX - n * gridSize;
      var startXNum = -n * this.scaleStep;
      // 最左侧如果和Y轴标尺重叠，则向右+1
      if (startX < this.rulerWidth) {
        startX += gridSize;
        startXNum += this.scaleStep;
      }
      var n2 = Math.floor(screenY / gridSize);
      var startY = screenY - n2 * gridSize;
      var startYNum = -n2 * this.scaleStep;
      // 同上
      if (startY < this.rulerWidth) {
        startY += gridSize;
        startYNum += this.scaleStep;
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
      this._isBindThree = true;
      this._controls = controls;
      this._events.three = this._threeEvent.bind(this, camera, origin);
      controls.addEventListener('change', this._events.three);
    }
  }, {
    key: "_threeEvent",
    value: function _threeEvent(camera, origin) {
      var coords = origin.project(camera);
      var halfWidth = this.dom.width / 2;
      var halfHeight = this.dom.height / 2;
      var originX = -(coords.x * halfWidth + halfWidth);
      var originY = -(coords.y * halfHeight + halfHeight);
      var tempZoom = this.zoom;
      this.zoom = camera.zoom;
      if (this.zoom < 0) this.zoom = 0.0001;
      this._gridSize = this.zoom * this._scaleGridRatio;
      if (this.gridChange) {
        var step = this._getScaleStep();
        this.scaleStep = step;
        this._gridSize = this.scaleStep * this.zoom * this._scaleGridRatio;
      }
      if (this._gridSize < this.minGridSize) {
        // if minGridSize is greater than the minimum of scaleStepList, gridSize will be changed when gridSize > minGridSize
        this._gridSize = this.minGridSize;
        this.zoom = tempZoom; // reset zoom, greater than minGridSize
      }
      this.reDraw(-originX - halfWidth, originY + halfHeight, this.zoom);
    }
  }, {
    key: "_addListener",
    value: function _addListener() {
      this._events.mouseDown = this._mouseDownEvent.bind(this);
      this._events.mouseMove = this._mouseMoveEvent.bind(this);
      this._events.mouseUp = this._mouseUpEvent.bind(this);
      this._events.wheel = this._wheelEvent.bind(this);
      this.dom.addEventListener('mousedown', this._events.mouseDown);
      this.dom.addEventListener('mousemove', this._events.mouseMove);
      this.dom.addEventListener('mouseup', this._events.mouseUp);
      this.dom.addEventListener('wheel', this._events.wheel);
    }
  }, {
    key: "_mouseDownEvent",
    value: function _mouseDownEvent(e) {
      e.preventDefault();
      if (!(e.button === this.dragButton)) return;
      this._isDrag = true;
      this._dragStartMouseCoord = [e.offsetX, e.offsetY];
    }
  }, {
    key: "_mouseMoveEvent",
    value: function _mouseMoveEvent(e) {
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
    key: "_mouseUpEvent",
    value: function _mouseUpEvent(e) {
      this._isDrag = false;
    }
  }, {
    key: "_wheelEvent",
    value: function _wheelEvent(e) {
      var scale = this._getZoomScale(e.deltaY);
      if (e.deltaY > 0) {
        // 缩小
        this._scale /= scale;
      } else {
        // 放大
        this._scale *= scale;
      }
      var tempZoom = this.zoom;
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom / this._scale));
      if (this.zoom <= 0) this.zoom = 0.0001;
      this._gridSize = this.zoom * this._scaleGridRatio;
      if (this.gridChange) {
        var step = this._getScaleStep();
        this.scaleStep = step;
        this._gridSize = this.scaleStep * this.zoom * this._scaleGridRatio;
      }
      if (this._gridSize < this.minGridSize) {
        // if minGridSize is greater than the minimum of scaleStepList, gridSize will be changed when gridSize > minGridSize
        this._gridSize = this.minGridSize;
        this.zoom = tempZoom; // reset zoom, greater than minGridSize
      }
      // 平移
      var beforeZoom = this._unproject(e.offsetX, e.offsetY, tempZoom);
      var afterZoom = this._unproject(e.offsetX, e.offsetY);
      var nx = this.x - beforeZoom.x + afterZoom.x;
      var ny = this.y - beforeZoom.y + afterZoom.y;
      this.reDraw(nx, ny, this.zoom);
      this._scale = 1;
    }
    // 接近哪个刻度，就返回哪个刻度
  }, {
    key: "_getScaleStep",
    value: function _getScaleStep() {
      var origin = this.scaleStepList.indexOf(this._scaleOrigin);
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
          return this.scaleStepList[index];
        }
      }
      return this.scaleStep;
    }
    // 跨过哪个刻度，就返回哪个刻度
  }, {
    key: "_getScaleStep2",
    value: function _getScaleStep2() {}
  }, {
    key: "_getZoomScale",
    value: function _getZoomScale(delta) {
      var normalizedDelta = Math.abs(delta / 100);
      return Math.pow(0.95, this.zoomSpeed * normalizedDelta);
    }
    // 鼠标坐标转换为世界坐标(像素)
  }, {
    key: "_unproject",
    value: function _unproject(x, y) {
      var zoom = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.zoom;
      var halfWidth = this.dom.width / 2;
      var halfHeight = this.dom.height / 2;
      return {
        x: (x - halfWidth) / zoom - this.x,
        y: (y - halfHeight) / zoom - this.y
      };
    }
    // 世界坐标(像素)转换为鼠标坐标
  }, {
    key: "toScale",
    value: function toScale(x, y) {
      return {
        x: x / this._scaleGridRatio,
        y: y / this._scaleGridRatio * (this.reverseY ? -1 : 1)
      };
    }
  }, {
    key: "destroy",
    value: function destroy() {
      if (this.listener) {
        this.dom.removeEventListener('mousedown', this._events.mouseDown);
        this.dom.removeEventListener('mousemove', this._events.mouseMove);
        this.dom.removeEventListener('mouseup', this._events.mouseUp);
        this.dom.removeEventListener('wheel', this._events.wheel);
      }
      if (this._isBindThree) {
        this._controls.removeEventListener('change', this._events.three);
        this._controls = null;
      }
    }
  }]);
}();

export { Ruler as default };
