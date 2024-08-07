class Ruler {
  constructor(id, options = {}) {
    this.dom = document.getElementById(id);
    if (!this.dom) throw new Error('请传入canvas的id')
    if (this.dom.getContext)
      this.ctx = this.dom.getContext('2d');
    this._initRuler(options);
    this._drawRuler();
    if (this.listener) {
      this._addListener();
    }
  }
  _initRuler(options) {
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
    this.grid = options.grid ?? true;
    this._gridSize = 50;
    this.gridChange = options.gridChange ?? true;
    // ruler
    this.rulerWidth = options.rulerWidth || 20;
    this.rulerColor = options.rulerColor || "rgba(255,255,255,0.8)";
    this.scaleColor = options.scaleColor || "black";
    this.scaleHeight = options.scaleHeight || 6;
    this.topNumberPadding = options.topNumberPadding || 11;
    this.leftNumberPadding = options.leftNumberPadding || 2;
    this._scaleStepList = [1, 2, 5, 10, 25, 50, 100, 150, 300, 750, 1500]; // 必须从小到大
    this._scaleStep = 50; // 必须是scaleStepList中的一个 标尺上的数值
    this._scaleStepOrigin = this._scaleStep

    this._zoomRatioList = [];
    for (let i = 0; i < this._scaleStepList.length; i++) {
      this._zoomRatioList.push(this._scaleStepList[i] / this._scaleStepOrigin);
    }
    if (this._scaleStepList.indexOf(this._scaleStep) < 0) {
      throw new Error('scaleStep must be one of _scaleStepList')
    }
    // event
    this._isDrag = false;
    this.dragButton = options.dragButton ?? 0;
    this._dragStartMouseCoord = [];
    this.listener = options.listener ?? true;

    this._events = {
      mouseDown: '',
      mouseMove: '',
      mouseUp: '',
      wheel: '',
      three: '',
    }
    this._isBindThree = false;
    this._controls = null;
    // translate
    this.x = 0;
    this.y = 0;
    // scale
    this._zoomOrigin = 1;
    this.zoom = 1;
    this.zoomStep = options.zoomStep || 0.2;

  }
  reDraw(x, y, zoom) {
    this.zoom = zoom ?? this.zoom;
    this.x = x ?? this.x;
    this.y = y ?? this.y;
    this.ctx.clearRect(0, 0, this.dom.width, this.dom.height);
    this._drawRuler();
  }
  _drawRuler() {
    this.ctx.fillStyle = this.rulerColor;
    this.ctx.fillRect(0, 0, this.dom.width, this.rulerWidth);
    this.ctx.fillRect(0, 0, this.rulerWidth, this.dom.height);
    const { startX, startY, startXNum, startYNum } = this._getStartAndEnd()
    this.ctx.textAlign = 'center';
    const margin = this.rulerWidth - this.scaleHeight;
    let drawX = startX;
    let drawXNum = startXNum;
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
    let drawY = startY;
    let drawYNum = startYNum;
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
  _getStartAndEnd() {
    const gridSize = this._gridSize
    const screenX = this.x + this.dom.width / 2;
    const screenY = this.y + this.dom.height / 2;
    const n = Math.floor(screenX / gridSize);
    let startX = screenX - n * gridSize;
    let startXNum = - n * this._scaleStep;
    // 最左侧如果和Y轴标尺重叠，则向右+1
    if (startX < this.rulerWidth) {
      startX += gridSize;
      startXNum += this._scaleStep;
    }
    const n2 = Math.floor(screenY / gridSize);
    let startY = screenY - n2 * gridSize;
    let startYNum = - n2 * this._scaleStep;
    // 同上
    if (startY < this.rulerWidth) {
      startY += gridSize;
      startYNum += this._scaleStep;
    }
    return { startX, startY, startXNum, startYNum }
  }
  bindThreeCamera(camera, controls, origin) {
    this._isBindThree = true;
    this._controls = controls;
    this._events.three = this._threeEvent.bind(this, camera, origin);
    controls.addEventListener('change', this._events.three);
  }
  _threeEvent(camera, origin) {
    const coords = origin.project(camera);
    const halfWidth = this.dom.width / 2
    const halfHeight = this.dom.height / 2
    const originX = -(coords.x * halfWidth + halfWidth)
    const originY = -(coords.y * halfHeight + halfHeight)
    this.zoom = camera.zoom
    if (this.zoom <= 0) this.zoom = this.zoomStep
    this._gridSize = this.zoom * this._scaleStepOrigin;
    if (this.gridChange) {
      const step = this._getScaleStep();
      this._scaleStep = step;
      this._gridSize = this._scaleStep * this.zoom;
    }
    this.reDraw(-originX - halfWidth, originY + halfHeight, this.zoom)
  }

  _addListener() {
    this._events.mouseDown = this._mouseDownEvent.bind(this);
    this._events.mouseMove = this._mouseMoveEvent.bind(this);
    this._events.mouseUp = this._mouseUpEvent.bind(this);
    this._events.wheel = this._wheelEvent.bind(this);
    this.dom.addEventListener('mousedown', this._events.mouseDown);
    this.dom.addEventListener('mousemove', this._events.mouseMove);
    this.dom.addEventListener('mouseup', this._events.mouseUp);
    this.dom.addEventListener('wheel', this._events.wheel)
  }
  _mouseDownEvent(e) {
    e.preventDefault();
    if (!(e.button === this.dragButton)) return;
    this._isDrag = true;
    this._dragStartMouseCoord = [e.offsetX, e.offsetY];
  }
  _mouseMoveEvent(e) {
    e.preventDefault();
    if (!this._isDrag) return;
    const dx = e.offsetX - this._dragStartMouseCoord[0];
    const dy = e.offsetY - this._dragStartMouseCoord[1];
    if (this._isDrag) {
      const nX = this.x + dx;
      const nY = this.y + dy;
      this._dragStartMouseCoord = [e.offsetX, e.offsetY];
      this.reDraw(nX, nY, this.zoom);
    }
  }
  _mouseUpEvent(e) {
    this._isDrag = false;
  }
  _wheelEvent(e) {
    if (e.deltaY > 0) {
      // 缩小
      this.zoom -= this.zoomStep

      // this.zoom = this.zoom * (this._zoomOrigin - this.zoomStep);
      // this._gridSize = this._gridSize * (this._zoomOrigin - this.zoomStep);

    } else {
      // 放大
      this.zoom += this.zoomStep;
      // this.zoom = this.zoom / (this._zoomOrigin - this.zoomStep);
      // this._gridSize = this._gridSize / (this._zoomOrigin - this.zoomStep);
    }
    this.zoom = parseFloat(this.zoom.toFixed(2))
    if (this.zoom <= 0) this.zoom = this.zoomStep
    this._gridSize = this.zoom * this._scaleStepOrigin;

    // 平移
    const centerX = this.dom.width / 2;
    const centerY = this.dom.height / 2;
    const dx = e.offsetX - centerX;
    const dy = e.offsetY - centerY;
    const nx = this.x + dx * this.zoomStep;
    const ny = this.y + dy * this.zoomStep;
    if (this.gridChange) {
      const step = this._getScaleStep();
      this._scaleStep = step;
      this._gridSize = this._scaleStep * this.zoom;
    }
    this.reDraw(nx, ny, this.zoom);
  }
  _getScaleStep() {
    const origin = this._scaleStepList.indexOf(this._scaleStepOrigin);
    for (let i = 1; i < this._zoomRatioList.length; i++) {
      if (this.zoom >= this._zoomRatioList[i - 1] && this.zoom < this._zoomRatioList[i]) {
        const left = this.zoom - this._zoomRatioList[i - 1];
        const right = this._zoomRatioList[i] - this.zoom;
        let index = origin;
        if (left < right) {
          index = origin - (i - 1 - origin)
        } else {
          index = origin - (i - origin);
        }
        if (index > this._zoomRatioList.length - 1) index = this._zoomRatioList.length - 1
        if (index < 0) index = 0;
        return this._scaleStepList[index];
      }
    }
    return this._scaleStep
  }
  destroy() {
    if (this.listener) {
      this.dom.removeEventListener('mousedown', this._events.mouseDown);
      this.dom.removeEventListener('mousemove', this._events.mouseMove);
      this.dom.removeEventListener('mouseup', this._events.mouseUp);
      this.dom.removeEventListener('wheel', this._events.wheel)
    }
    if(this._isBindThree){
      this._controls.removeEventListener('change',this._events.three)
      this._controls = null;
    }
  }
}

export default Ruler