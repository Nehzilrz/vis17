const fps = 20;
const LineMergeThreshold1 = 15;
const LineMergeThreshold2 = 1;
const LineMergeThreshold3 = 12;

function smooth(a, windowSize = 100) {
    const c = 1.0 / window;
    const b = new Float32Array(a.length);
    for (let i = 0, cnt = 0; i < a.length; ++i) {
        cnt += a[i];
        if (i >= window) {
            cnt -= a[i - window];
        }
        b[i] = cnt * c;
    }
    for (let i = window - 1; i >= 0; --i) {
        b[i] = b[window];
    }
    for (let i = 0; i < a.length; ++i) {
        a[i] = b[i];
    }
}

export class Canvas {
    constructor(canvas, width, height) {
        width = width || canvas.width;
        height = height || canvas.height;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        if (canvas.width !== width) {
            canvas.width = width;
        }
        if (canvas.height !== height) {
            canvas.height = height;
        }
        this.items = new Array();
        this.backgroundImg = null;
        this.bgAlpha = 1;
    }

    clear() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        ctx.clearRect(0, 0, width, height);
    }

    drawBackground() {
        if (this.backgroundImg === null) {
            return;
        }
        const ctx = this.ctx;
        const img = this.backgroundImg;
        ctx.globalAlpha = this.bgAlpha;
        ctx.drawImage(img, 0, 0);
        ctx.globalAlpha = 1;
    }

    removeItem(item) {
        const items = this.items;
        if (!item || item.index >= items.length || items[item.index] !== item) {
            return;
        }
        items.splice(item.index, 1);
        for (let i = 0; i < items.length; ++i) {
            items[i].index = i;
        }
    }

    addItem(item) {
        const items = this.items;
        item.index = items.length;
        item.canvas = this;
        items.push(item);
    }

    getItem(x, y) {
        const items = this.items;
        for (const item of items) {
            if (item.hasPixel(x, y)) {
                return item;
            }
        }
        return null;
    }

    render(highlightedItem) {
        this.clear();
        this.drawBackground();
        const items = this.items;
        const canvas = this.canvas;
        for (const item of items) {
            if (highlightedItem === item || !highlightedItem) {
                item.render(1);
            } else {
                item.render(0.66);
            }
        }
    }
}

export class AnimatedCanvas {
    constructor(canvas, width, height) {
        width = width || canvas.width;
        height = height || canvas.height;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = width;
        this.height = height;
        if (canvas.width !== width) {
            canvas.width = width;
        }
        if (canvas.height !== height) {
            canvas.height = height;
        }
        this.items = new Array();
        this.itemTables = new Array();
        this.backgroundImg = null;
        this.bgAlpha = 1;

        this.currentChannel = -1;
    }

    clear() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        ctx.clearRect(0, 0, width, height);
    }

    drawBackground() {
        if (this.backgroundImg === null) {
            return;
        }
        const ctx = this.ctx;
        const img = this.backgroundImg;
        ctx.globalAlpha = this.bgAlpha;
        ctx.drawImage(img, 0, 0);
        ctx.globalAlpha = 1;
    }

    removeItem(item) {
        const items = this.items;
        if (!item || item.index >= items.length || items[item.index] !== item) {
            return;
        }
        items.splice(item.index, 1);
        for (let i = 0; i < items.length; ++i) {
            items[i].index = i;
        }
    }

    addItem(item) {
        const items = this.items;
        item.index = items.length;
        item.canvas = this;
        items.push(item);
    }

    getItem(x, y) {
        if (this.currentChannel === -1) {
            for (const item of this.items) {
                if (item.hasPixel(x, y)) {
                    return item;
                }
            }
        } else {
            for (const item of this.itemTables[this.currentChannel]) {
                if (item.hasPixel(x, y)) {
                    return item;
                }
            }
        }
        return null;
    }
    
    renderImage(img) {
        this.clear();
        const ctx = this.ctx;
        ctx.globalAlpha = 1;
        ctx.drawImage(img, 0, 0);
        ctx.globalAlpha = 1;
    }

    render(index, highlightedItem) {
        if (index === undefined) {
            index = -1;
        }
        const items = index !== -1 ? this.itemTables[index] : this.items;
        const canvas = this.canvas;
        this.currentChannel = index;
        this.clear();
        this.drawBackground();
        for (let i = 0; i < items.length; ++i) {
            const item = items[i] || this.items[i];
            if (highlightedItem === item || !highlightedItem) {
                item.render(1);
            } else {
                item.render(0.66);
            }
        }
    }
}

export class Animation {
    static duration = 1000;
    static delay = 1000;
    constructor(from, to, duration, delay) {
        this.from = from;
        this.to = to;
        this.duration = duration || Animation.duration;
        this.delay = delay || Animation.delay;
    }

    static hueInitialStatus(item) {
        const ret = new Item(item);
        ret.hue = 0;
        return ret;
    }

    static satInitialStatus(item) {
        const ret = new Item(item);
        ret.saturation = 0;
        return ret;
    }

    static positionInitialStatus(item) {
        const ret = new Item(item);
        const canvas = item.canvas;
        const n = canvas.items.length;
        ret.y = canvas.height / (n + 1) * item.index;
        return ret;
    }

    static widthInitialStatus(item) { // length
        const ret = new Item(item);
        ret.w /= 2;
        ret.x += ret.w / 2;
        return ret;
    }

    static lengthInitialStatus(item) { // length
        const ret = new Item(item);
        ret.w /= 2;
        ret.x += ret.w / 2;
        return ret;
    }

    static shapeInitialStatus(item) { // should be height initial status
        const ret = new Item(item);
        item.compress();
        const lines = [];
        return ret;
    }

    static initialStatus(item, type) {
        if (type === 'position') {
            return Animation.positionInitialStatus(item);
        } else if (type === 'color-h') {
            return Animation.hueInitialStatus(item);
        } else if (type === 'color-s') {
            return Animation.satInitialStatus(item);
        } else if (type === 'size') {
            return Animation.widthInitialStatus(item);
        } else if (type === 'shape') {
            return Animation.shapeInitialStatus(item);
        } else {
            return new Item(item);
        }
    }

    render(timestamp) {
        
    }
}

export class Item {
    constructor(_) {
        let lines;
        let color;
        if (_ instanceof Array) {
            lines = [];
            const items = _;
            const L1 =
                Array.concat(...items.map(item => item.lines))
                    .sort((a, b) => {
                        if (a.x !== b.x) {
                            return a.x - b.x;
                        } else if (a.y1 !== b.y1) {
                            return a.y1 - b.y1;
                        } else {
                            return a.y2 - b.y2;
                        }
                    });

            const L2 = [];
            const pre = [];
            const c = [];
            const len = [];
            let ptn = 0, last = 0, lastnum = 0;
            const xrange = [L1[0].x, L1[L1.length - 1].x];
            for (let i = 0; i < L1.length; ++i) {
                if (i === L1.length - 1 || L1[i].x !== L1[i + 1].x) {
                    const segments = [];
                    for (let j = last; j <= i; ++j) {
                        segments.push(+L1[j].y1);
                        segments.push(-L1[j].y2);
                    }
                    segments.sort(
                        (a, b) =>
                            ((a > 0 ? a : -a) - (b > 0 ? b : -b))
                    );
                    let segcnt = 0, left = 0, length = 0;
                    const p = [];
                    for (let i = 0; i < segments.length; ++i) {
                        if (segments[i] >= 0) {
                            if (segcnt === 0) {
                                left = segments[i];
                            }
                            ++segcnt;
                        } else {
                            --segcnt;
                            if (segcnt === 0) {
                                p.push(left);
                                p.push(-segments[i]);
                                length += -segments[i] - left;
                            }
                        }
                    }

                    let mingap = LineMergeThreshold1;
                    while (p.length >= lastnum * 2) {
                        let k = -1;
                        for (let j = 1; j + 1 < p.length; j += 2) {
                            if (p[j + 1] - p[j] < mingap) {
                                mingap = p[j + 1] - p[j];
                                k = j;
                            }
                        }
                        if (mingap > length) {
                            break;
                        }
                        if (k === -1 && p.length <= (lastnum + 1) * 2) {
                            break;
                        } else if (k !== -1) {
                            p.splice(k, 2);
                            mingap = mingap * LineMergeThreshold2 + LineMergeThreshold3;
                        } else {
                            break;
                        }
                    }

                    const x = L1[i].x;
                    len[x] = length;
                    L2[x] = p;
                    c[x] = new Int32Array(p.length);
                    pre[x] = new Int32Array(p.length);
                    if (!L2[x - 1]) {
                        for (let i = 0; i < p.length; ++i) {
                            c[x][i] = 0;
                        }
                    } else {
                        const q = L2[x - 1];
                        for (let i = 1, j = 2; i + 1 < p.length; i += 2) {
                            while (j < q.length && q[j] < p[i]) {
                                j += 2;
                            }
                            if (j >= q.length || q[j - 1] > p[i + 1]) {
                                c[x][i] = 1;
                            } else {
                                c[x][i] = c[x - 1][j - 1] + 1;
                                pre[x][i] = j - 1;
                            }
                        }
                    }

                    lastnum = p.length / 2;
                    last = i + 1;
                }
            }
            
            for (let x = xrange[1]; x >= xrange[0]; --x) if (!!c[x]) {
                const height = L2[x][L2[x].length - 1] - L2[x][0];
                const H = Math.min(len[x], height * 0.2);
                for (let i = 1; i + 1 < c[x].length; i += 2) {
                    if (pre[x][i] !== 0) {
                        c[x - 1][pre[x][i]] = c[x][i];
                    }
                    if (c[x][i] < 25 && (L2[x][i + 1] - L2[x][i]) < H) {
                        L2[x][i] = L2[x][i + 1] = -1;
                    }
                }
                L2[x] = L2[x].filter(d => d !== -1);
            }
            
            for (let x = xrange[0]; x <= xrange[1]; ++x) if (!!c[x]) {
                for (let i = 0; i < L2[x].length; i += 2) {
                    lines.push({
                        x,
                        y1: L2[x][i],
                        y2: L2[x][i + 1],
                    });
                }
            }
            
            color = [0, 0, 0];
            let cnt = 0;
            for (const item of items) {
                for (let i = 0; i < 3; ++i) {
                    color[i] += item.lines.length * item.color[i];
                }
                cnt += item.lines.length;
            }
            for (let i = 0; i < 3; ++i) {
                color[i] /= cnt;
            }

            this.lines = lines;
            this.hue = color[0] * 360;
            this.saturation = color[1];
            this.lightness = color[2];
            this.alpha = 1;
            this.x = Math.min(...lines.map(d => d.x));
            this.y = Math.min(...lines.map(d => d.y1));
            this.w = Math.max(...lines.map(d => d.x)) - this.x;
            this.h = Math.max(...lines.map(d => d.y2)) - this.y;
            this.x0 = this.x;
            this.y0 = this.y;
            this.w0 = this.w;
            this.h0 = this.h;
            this.appeartime = null;
            this.fstatus = null;
            this.tstatus = null;
            this.duration = null;
        } else if (!(_ instanceof Item)) {
            const item = _;
            const color = item.color;
            lines = item.lines;
            this.lines = item.lines;
            this.hue = item.hue || color[0] * 360;
            this.saturation = item.saturation || color[1];
            this.lightness = item.lightness || color[2];
            this.alpha = 1;
            this.x = Math.min(...lines.map(d => d.x));
            this.y = Math.min(...lines.map(d => d.y1));
            this.w = Math.max(...lines.map(d => d.x)) - this.x;
            this.h = Math.max(...lines.map(d => d.y2)) - this.y;
            this.x0 = this.x;
            this.y0 = this.y;
            this.w0 = this.w;
            this.h0 = this.h;
            this.appeartime = null;
            this.fstatus = null;
            this.tstatus = null;
            this.duration = null;
        } else {
            this.canvas = _.canvas;
            this.index = _.index;
            this.lines = _.lines;
            this.hue = _.hue;
            this.saturation = _.saturation;
            this.lightness = _.lightness;
            this.alpha = _.alpha;
            this.x = _.x;
            this.y = _.y;
            this.w = _.w;
            this.h = _.h;
            this.x0 = _.x0;
            this.y0 = _.y0;
            this.w0 = _.w0;
            this.h0 = _.h0;
        }
        this.left = 0;
        this.right = (this.canvas && this.canvas.width) || 2048;
        this.top = 0;
        this.bottom = (this.canvas && this.canvas.height) || 2048;
    }

    cross(x1, y1, x2, y2) {
        if (x1 instanceof Object) {
            const line = x1;
            return this.cross(line.x1, line.y1, line.x2, line.y2);
        } else {
            if (x1 > x2) {
                return this.cross(line.x2, line.y2, line.x1, line.y1);
            } else if (x1 === x2) {
                let lines = this.lines;
                for (const line of lines) {
                    if (line.x === x1 && line.y2 > y1 && line.y1 < y2) {
                        return true;
                    }
                }
                return false;
            } else {
                const c = (y2 - y1) / (x2 - x1);
                let lines = this.lines;
                for (let i = 0; i < lines.length; ++i) {
                    const line = lines[i];
                    if (line.x < x1 || line.x > x2) {
                        continue;
                    }
                    const y = ~~((line.x - x1) * c + y1);
                    if (y > line.y1 && y < line.y2) {
                        return true;
                    }
                }
                return false;
            }
        }
    }
    area() {
        let ret = 0;
        for (const line of this.lines) {
            ret += line.y2 - line.y1;
        }
        return ret;
    }

    split(x1, y1, x2, y2) {
        if (x1 > x2) {
            return this.split(line.x2, line.y2, line.x1, line.y1);
        } else {
            const c = (y2 - y1) / (x2 - x1);
            let lines = this.lines;
            for (let i = 0; i < lines.length; ++i) {
                const line = lines[i];
                if (line.x < x1 || line.x > x2) {
                    continue;
                }
                const y = ~~((line.x - x1) * c + y1);
                if (y > line.y1 && y < line.y2) {
                    lines.push({
                        x: line.x,
                        y1: y + 4,
                        y2: line.y2,
                    });
                    line.y2 = y - 4;
                }
            }
            lines = lines
                .filter((d) => d.y1 <= d.y2)
                .sort((a, b) => {
                    if (a.x !== b.x) {
                        return a.x - b.x;
                    } else {
                        return a.y1 - b.y1;
                    };
                });

            function root(x) {
                if (x.parent) {
                    return x.parent = root(x.parent);
                } else {
                    return x;
                }
            }

            function merge(x, y) {
                x = root(x);
                y = root(y);
                if (x !== y) {
                    y.parent = x;
                }
            }

            function same(x, y) {
                x = root(x);
                y = root(y);
                return x === y;
            }

            for (let i = 0, j = 0; i < lines.length; ++i) {
                lines[i].parent = null;
                while (lines[j].x + 3 < lines[i].x) {
                    ++j;
                }
                for (let k = j; k < i; ++k) {
                    if (Math.max(lines[k].y1, lines[i].y1) <= Math.min(lines[k].y2, lines[i].y2)) {
                        merge(lines[k], lines[i]);
                    }
                }
            }

            const newlines = lines.filter((d) => !same(d, lines[0]));
            lines = lines.filter((d) => same(d, lines[0]));

            this.lines = lines;

            return new Item({
                lines: newlines,
                hue: this.hue,
                saturation: this.saturation,
                lightness: this.lightness,
            });
        }
    }

    toString() {
        return JSON.stringify({
            lines: this.lines,
            color: this.color,
            animations: this.animations,
        });
    }

    compress() {
        const width = this.w0 + 1;
        const ys = new Float32Array(width);
        const ws = new Float32Array(width);
        const x0 = this.x0;
        for (const line of this.lines) {
            ys[line.x - x0] += (line.y1 + line.y2) * 0.5 * (line.y2 - line.y1);
            ws[line.x - x0] += (line.y2 - line.y1);
        }
        for (let i = 0; i < ws.length; ++i) {
            if (ws[i] !== 0) {
                ys[i] /= ws[i];
            }
        }

    }

    transformat() {
        const rw = 1.0 / this.w0 * this.w;
        const rh = 1.0 / this.h0 * this.h;
        const lines = this.lines;
        const x0 = this.x0;
        const y0 = this.y0;
        const x = this.x;
        const y = this.y;
        const newlines = [];
        for (const line of lines) {
            const xx = ~~((line.x - x0) * rw + x);
            const y1 = ~~((line.y1 - y0) * rh + y);
            const y2 = ~~((line.y2 - y0) * rh + y);
            newlines.push({
                x: xx,
                y1: y1,
                y2: y2
            });
        }
        this.lines = newlines;
        this.x0 = this.x;
        this.y0 = this.y;
        this.w0 = this.w;
        this.h0 = this.h;
    }

    render(alpha0) {
        const canvas = this.canvas;
        const width = canvas.width;
        const height = canvas.height;
        const ctx = canvas.ctx;
        const rw = 1.0 / this.w0 * this.w;
        const rh = 1.0 / this.h0 * this.h;
        const hue = ~~this.hue;
        const saturation = ~~(this.saturation * 100);
        const lightness = ~~(this.lightness * 100);
        const alpha = alpha0 || this.alpha;
        ctx.strokeStyle = `hsla(${hue},${saturation}%,${lightness}%,${alpha})`;
        ctx.lineWidth = rw;

        const lines = this.lines;
        const x0 = this.x0;
        const y0 = this.y0;
        const x = this.x;
        const y = this.y;

        const left = this.left;
        const right = this.right;
        const top = this.top;
        const bottom = this.bottom;

/*
        ctx.beginPath();  
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + this.h);
        ctx.lineTo(x + this.w, y + this.h);
        ctx.lineTo(x + this.w, y);
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.closePath();
*/
        // console.log(this.area());

        for (const line of lines) {
            const xx = ~~((line.x - x0) * rw + x);
            if (xx < left || xx > right) {
                continue;
            }
            const y1 = Math.max(~~((line.y1 - y0) * rh + y), top);
            const y2 = Math.min(~~((line.y2 - y0) * rh + y), bottom);
            if (y1 > y2) {
                continue;
            }
            ctx.beginPath();  
            ctx.moveTo(xx, y1 - 1);
            ctx.lineTo(xx, y2 + 1);
            ctx.stroke();
            ctx.closePath();  
        }
    }

    hasPixel(x, y) {
        const lines = this.lines;
        const rw = 1.0 / this.w0 * this.w;
        for (const line of lines) {
            if (Math.abs(line.x - x) <= rw && y >= line.y1 && y <= line.y2) {
                return true;
            }
        }
        return false;
    }

    createAnimation() {
        if (!this.animations) {
            this.animations = [];
        }
        this.animations.push({
            from, to, start, duration
        });
        const fields = [];
        const from = this.fstatus;
        const to = this.tstatus;
        const start = ~~(this.appeartime / 1000 * fps);
        const duration = ~~(this.duration / 1000 * fps);
        const canvas = this.canvas;
        const table = canvas.itemTables;
        const index = this.index;

        for (const field of from) {
            if (to.hasOwnProperty(field)) {
                fields.push(field);
            }
        }

        for (let i = 0; i < fields.length; ++i) {
            const field = fields[i];
            if (!isNaN(from[field]) && !isNaN(to[field])) {
                // so both two value are Number
            } else {
                fields.splice(i, 1);
                --i;
            }
        }

        while (start + duration >= table.length) {
            table.length.push(new Array());
        }
        for (let t = 0; t <= duration; ++t) {
            const item = new Item(this);
            for (const field of fields) {
                item[field] = (from[field] * (duration - t) + to[field] * t) / duration;
            }
            table[start + t][index] = item;
        }
    }

    appear(_) {
        this.appeartime = _;
        if (this.appeartime !== null && this.fstatus !== null && this.tstatus !== null && this.duration !== null) {
            this.createAnimation();
        }
        return this;
    }

    from(_) {
        this.fstatus = _;
        if (this.appeartime !== null && this.fstatus !== null && this.tstatus !== null && this.duration !== null) {
            this.createAnimation();
        }
        return this;
    }

    to(_) {
        this.tstatus = _;
        if (this.appeartime !== null && this.fstatus !== null && this.tstatus !== null && this.duration !== null) {
            this.createAnimation();
        }
        return this;
    }

    duration(_) {
        this.duration = _;
        if (this.appeartime !== null && this.fstatus !== null && this.tstatus !== null && this.duration !== null) {
            this.createAnimation();
        }
        return this;
    }

    createAppearAnimation() {
    }

    createDisappearAnimation() {
    }
}
