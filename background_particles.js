(function () {
    const CONFIG = {
        particleColorStart: '#7f2f8e', // 紫色
        particleColorEnd: '#d6df35',   // 黄绿色
        particleCountDivisor: 12000,   // 屏幕面积除以此数等于粒子数量（数值越大粒子越少）
        connectDistance: 140,          // 连线最大距离
        moveSpeed: 0.6,                // 粒子运动速度
        baseSize: 2                    // 粒子基础大小
    };

    let canvas, ctx;
    let particlesArray = [];
    let width = 0, height = 0;
    let gradient; // 保存渐变对象
    let animationStarted = false;

    class Particle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.directionX = (Math.random() * 2) - 1;
            this.directionY = (Math.random() * 2) - 1;
            this.size = (Math.random() * 2) + CONFIG.baseSize;
            this.speedX = this.directionX * CONFIG.moveSpeed;
            this.speedY = this.directionY * CONFIG.moveSpeed;
        }

        update() {
            if (this.x > width) { this.x = width; this.speedX = -Math.abs(this.speedX); }
            if (this.x < 0)     { this.x = 0;     this.speedX = Math.abs(this.speedX);  }
            if (this.y > height){ this.y = height;this.speedY = -Math.abs(this.speedY); }
            if (this.y < 0)     { this.y = 0;     this.speedY = Math.abs(this.speedY);  }

            this.x += this.speedX;
            this.y += this.speedY;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function initCanvas() {
        canvas = document.getElementById('bg-canvas');
        if (!canvas) return false;
        ctx = canvas.getContext('2d');
        if (!ctx) return false;
        return true;
    }

    function init() {
        if (!initCanvas()) return;

        // 获取父容器的 CSS 尺寸
        const container = canvas.parentElement || document.body;
        width = container.offsetWidth;
        height = container.offsetHeight;

        // 处理高 DPI
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';

        // 以 dpr 缩放坐标系，使绘图按 CSS 像素工作
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // 创建渐变（使用 CSS 像素坐标）
        gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, CONFIG.particleColorStart);
        gradient.addColorStop(1, CONFIG.particleColorEnd);

        // 重新生成粒子
        particlesArray = [];
        let numberOfParticles = Math.max(20, Math.floor((width * height) / CONFIG.particleCountDivisor));
        for (let i = 0; i < numberOfParticles; i++) {
            particlesArray.push(new Particle());
        }

        // 更新绘制样式
        ctx.fillStyle = gradient;
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1.0;
    }

    function animate() {
        if (!canvas || !ctx) return;
        requestAnimationFrame(animate);

        // 清空（使用 CSS 像素坐标）
        ctx.clearRect(0, 0, width, height);

        // 设置样式（保证在每帧有效）
        ctx.fillStyle = gradient;
        ctx.strokeStyle = gradient;

        for (let i = 0; i < particlesArray.length; i++) {
            const p1 = particlesArray[i];
            p1.update();
            p1.draw();

            for (let j = i + 1; j < particlesArray.length; j++) {
                const p2 = particlesArray[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < CONFIG.connectDistance) {
                    const opacity = 1 - (distance / CONFIG.connectDistance);
                    ctx.globalAlpha = Math.max(0, opacity * 0.5);
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                }
            }
        }
    }

    // 简单防抖
    function debounce(fn, wait = 150) {
        let t;
        return function () {
            clearTimeout(t);
            t = setTimeout(() => fn.apply(this, arguments), wait);
        };
    }

    function start() {
        init();
        if (!animationStarted) {
            animationStarted = true;
            animate();
        }
    }

    // 在 DOMReady 时启动（脚本可能已在 body 底部加载，但此处做兼容）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }

    // 监听窗口大小变化并防抖处理
    window.addEventListener('resize', debounce(() => {
        init();
    }, 180));
})();
