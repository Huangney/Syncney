let menu = document.getElementById('custom-menu');

/**
 * 渲染所有内容（包括状态节点和连线）
 */
function renderAll() {
    renderStates();
    renderConnections();
}

/**
 * @name renderStates
 * @description 渲染状态节点 
 */
function renderStates()
{
    //首先： 清除旧节点（保留SVG层）
    const oldNodes = document.querySelectorAll('.state-node');
    oldNodes.forEach(n => 
    {
        // 仅当元素仍挂在 DOM 上时再移除，避免重复移除导致 NotFoundError        
        if (n.parentNode) n.parentNode.removeChild(n);
    });

    // 对于所有的状态块，都执行以下的Lambda操作
    states.forEach(state =>
    {
        // 创建一个 <div> 元素，作为状态节点的容器
        const el = document.createElement('div');
        // 设置 class，若该节点被选中则附加 selected 类
        el.className = `state-node ${selectedStateId === state.id ? 'selected' : ''}`; 
        // 设置元素 id，方便后续通过 id 查找（例如 document.getElementById）
        el.id = `state-${state.id}`;
        // 使用绝对定位的 left（必须保证该元素的 CSS 为 position:absolute）
        el.style.left = state.x + 'px';
        // 使用绝对定位的 top
        el.style.top = state.y + 'px';

        // 赋予isLongPress属性
        el.isLongPress = false;
        el.isRenaming = false;


        // 将状态名，状态函数名 写入元素文本（内嵌HTML）
        el.innerHTML = 
        `
        <div style="font-size:18px;">${state.name}</div>
        <div style="font-size:12px;color:#888;">${state.funcName}</div>
        `;


        /**     (1)选中块的逻辑     **/
        el.addEventListener('mousedown', (e) =>
        {
            // console.log("按下被触发了");

            // 这里需要区分左右键
            if (e.button === 2)
            {
                // 不识别右键点击
                console.log("右键点击，拒绝");
                e.preventDefault();
                return;
            }

            // 防止触发画布点击（因为一般点击子元素，父元素也会动）
            // e.stopPropagation();
            // 只在点击状态块本身时阻止默认
            if (e.target === el) {
                e.preventDefault();
            }

            /**-----《      首先，如果是链接模式，拦截本次点击，完成链接    》-----**/
            if (window.pendingConnectionSource) {
                // 如果点击的不是源节点，则创建连接
                if (window.pendingConnectionSource !== state.id) {
                    connections.push({ from: window.pendingConnectionSource, to: state.id });
                    renderConnections();
                }
                // 无论成功与否，点击节点后都结束连接模式（点击自己视为取消）
                stopPendingConnection();
                return; // 阻止后续的选中和拖拽逻辑
            }
            // ---------------------------------------------------------------

            // 更新被选中的块的ID
            selectedStateId = state.id;

            // 重命名状态直接返回
            if (el.isRenaming) return;

            // 不要重新 render 整个列表（会移除并重建元素，导致 dblclick 丢失）
            // 仅更新 DOM 上的选中类，保留事件监听器
            document.querySelectorAll('.state-node.selected').forEach(n => n.classList.remove('selected'));
            el.classList.add('selected');
            
            // 标记为已经按下（但是按下后拖拽才是真的拖动）
            mouse_downed = true;

            // 只有在   非长按状态 / 非重命名  下才允许拖动
            if (!el.isLongPress && !el.isRenaming)
            {
                // 开始拖拽准备
                currentDragId = state.id;

                // 记录起点，用于判断是否真的拖拽（移动阈值）与长按
                const rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0 };
            }
            
            potentialDrag = {
                id: state.id,
                startClientX: e.clientX,
                startClientY: e.clientY,
                stateX: state.x,
                stateY: state.y,
                startTime: Date.now(),
                longPressTimer: null,
            };

            // 启动长按定时器（例如 600ms），触发后设置标志并回调（如需要）
            potentialDrag.longPressTimer = setTimeout(() =>
            {
                if (potentialDrag && potentialDrag.id === state.id && !isDragging)
                {
                    el.isLongPress = true;
                    console.log("长按触发：", state.id);

                    // 添加长按样式
                    el.classList.remove('pressing');
                    el.classList.add('renameing');

                    // 可在此处触发长按行为，例如：
                    // ======= 新增：弹出 funcName 编辑框 =======
                    // 清空当前元素内容
                    el.innerHTML = `
                        <div style="font-size:12px;">${state.name}</div>
                        <input class="rename-input" type="text" value="${state.funcName}" style="font-size:18px;color:#888;margin-top:2px;text-align:center;">
                    `;

                    // 定义一个输入框，并聚焦于它，设置光标到末尾
                    const input = el.querySelector('input');
                    input.focus();
                    input.setSelectionRange(input.value.length, input.value.length);

                    // 失焦回调
                    input.addEventListener('blur', () => {
                        state.funcName = input.value.trim() || state.funcName;
                        setTimeout(() => renderStates(), 0);
                    });
                    // 输入回调
                    input.addEventListener('keydown', (ev) => {
                        if (ev.key === 'Enter') {
                            state.funcName = input.value.trim() || state.funcName;
                            setTimeout(() => renderStates(), 0);
                        }
                    });
                }
            }, 600);
            // 按下时立即添加“正在长按”样式
            el.classList.add('pressing');
        });

        /**         (2)双击重命名        **/
        el.addEventListener('dblclick', (e) => 
        {
            console.log("双击被触发了");

            // 防止触发选中逻辑
            e.stopPropagation();

            // 开启长按后，禁用双击行为
            if (el.isLongPress) return;

            console.log(el.isLongPress);

            // 取消任何 pending 的拖拽/长按，避免双击被识别为拖拽或长按
            if (potentialDrag && potentialDrag.longPressTimer)
            {
                clearTimeout(potentialDrag.longPressTimer);
            }
            potentialDrag = null;
            isDragging = false;
            currentDragId = null;

            /**---<     正式开始双击逻辑    >---**/
            // 进入双击模式
            el.isRenaming = true;

            // 创建一个输入框覆盖在文本上
            const input = document.createElement('input');

            // 设置样式
            el.classList.add('renameing');
            input.className = 'rename-input';

            // 预填当前名称
            input.value = state.name;

            // 清空当前元素内容
            el.textContent = '';
            
            // 将输入框添加到元素中
            el.appendChild(input);

            // 自动聚焦
            input.focus();

            const finishRename = () =>
            {
                if (input.value.trim())
                {
                    state.name = input.value.trim();
                }

                // renderStates();
                // 延后渲染，避免在当前事件调用栈中再次进入 renderStates 导致并发移除
                setTimeout(() => renderStates(), 0);
            };

            input.addEventListener('blur', finishRename);
            input.addEventListener('keydown', (ev) => 
            {
                if (ev.key === 'Enter') finishRename();
            });
        });

        /**         (3)右键打开菜单        **/
        el.addEventListener('contextmenu', (e) => 
        {
            // console.log("何意味");

            // 防止默认右键菜单
            e.preventDefault();

            // 记录当前右键菜单对应的状态ID
            menuStateId = state.id;

            // 菜单定位
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';

            menu.style.display = 'block';
        });


        /**         (4)松开鼠标清除样式        **/
        el.addEventListener('mouseup', () =>
        {
            // 清除长按样式
            el.classList.remove('pressing');
        });

        canvas.appendChild(el);
    });
}

/**
 * 渲染连线
 */
function renderConnections()
{
    // 清空连线
    svgLayer.innerHTML = '';

    // 定义箭头标记
    svgLayer.innerHTML = 
    `   <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
        refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#999" />
        </marker>
        </defs>
    `;
    
    connections.forEach(conn =>
    {
        const fromState = states.find(s => s.id === conn.from);
        const toState = states.find(s => s.id === conn.to);
        if (!fromState || !toState) return;

        // --- 获取真实 DOM 元素以计算尺寸 ---
        const fromEl = document.getElementById(`state-${fromState.id}`);
        const toEl = document.getElementById(`state-${toState.id}`);

        // 默认尺寸兜底（万一 DOM 还没渲染）
        const fromW = fromEl ? fromEl.offsetWidth : 100;
        const fromH = fromEl ? fromEl.offsetHeight : 40;
        const toW = toEl ? toEl.offsetWidth : 100;
        const toH = toEl ? toEl.offsetHeight : 40;

        // 动态计算中心点
        const x1 = fromState.x + fromW / 2;
        const y1 = fromState.y + fromH / 2;
        const x2 = toState.x + toW / 2;
        const y2 = toState.y + toH / 2;

        // console.log("连接点：", x1, y1, x2, y2);

        // 计算边界交点（箭头从 from 边界指向 to 边界）
        const p1 = getRectEdgePoint(x1, y1, (fromW / 2) + 4, (fromH / 2) + 4, x2, y2);
        const p2 = getRectEdgePoint(x2, y2, (toW / 2) + 4, (toH / 2) + 4, x1, y1);

        // console.log("边界点：", p1, p2);

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', p1.x);
        line.setAttribute('y1', p1.y);
        line.setAttribute('x2', p2.x);
        line.setAttribute('y2', p2.y);
        line.setAttribute('stroke', '#999');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        
        svgLayer.appendChild(line);
    });
}

/**
 * 计算矩形边界交点
 */
function getRectEdgePoint(centerX, centerY, halfW, halfH, targetX, targetY) {
    const dx = targetX - centerX;
    const dy = targetY - centerY;
    const eps = 1e-6;

    if (Math.abs(dx) < eps && Math.abs(dy) < eps) {
        return { x: centerX + halfW, y: centerY };
    }

    const candidates = [];

    // 垂直边
    if (Math.abs(dx) > eps) {
        const leftX = centerX - halfW;
        const rightX = centerX + halfW;
        [leftX, rightX].forEach(edgeX => {
            const t = (edgeX - centerX) / dx;
            if (t > 0) {
                const iy = centerY + dy * t;
                if (iy >= centerY - halfH - eps && iy <= centerY + halfH + eps) {
                    candidates.push({ x: edgeX, y: iy, t });
                }
            }
        });
    }

    // 水平边
    if (Math.abs(dy) > eps) {
        const topY = centerY - halfH;
        const bottomY = centerY + halfH;
        [topY, bottomY].forEach(edgeY => {
            const t = (edgeY - centerY) / dy;
            if (t > 0) {
                const ix = centerX + dx * t;
                if (ix >= centerX - halfW - eps && ix <= centerX + halfW + eps) {
                    candidates.push({ x: ix, y: edgeY, t });
                }
            }
        });
    }

    if (candidates.length === 0) {
        const clampedX = Math.max(centerX - halfW, Math.min(targetX, centerX + halfW));
        const clampedY = Math.max(centerY - halfH, Math.min(targetY, centerY + halfH));
        if (clampedX === targetX && clampedY === targetY) {
            if (Math.abs(dx) >= Math.abs(dy)) {
                return { x: centerX + Math.sign(dx) * halfW, y: centerY };
            } else {
                return { x: centerX, y: centerY + Math.sign(dy) * halfH };
            }
        }
        return { x: clampedX, y: clampedY };
    }

    candidates.sort((a, b) => a.t - b.t);
    return { x: candidates[0].x, y: candidates[0].y };
}



// 暴露给全局
window.renderAll = renderAll;
window.renderStates = renderStates;
window.renderConnections = renderConnections;
window.getRectEdgePoint = getRectEdgePoint;