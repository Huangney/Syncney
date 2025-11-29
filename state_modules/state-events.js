// 全局事件绑定标志
let _stateGenEventsBound = false;

/**
 * @brief 手动调用的初始化函数，在 DOM 被注入后调用
 */
function initStateGen()
{
    canvas = document.getElementById('canvas');
    svgLayer = document.getElementById('connections-layer');
    menu = document.getElementById('custom-menu');


    // 绑定画布取消选中
    canvas.addEventListener('mousedown', (e) =>
    {
        // --- 新增：连接模式下，点击背景取消连接 ---
        if (window.pendingConnectionSource)
        {
            stopPendingConnection();
            return;
        }
        // ---------------------------------------

        if (e.target === canvas || e.target === svgLayer)
        {
            selectedStateId = null;
            renderStates();
        }
    });

    // 重新绑定文件输入变化事件
    const fileInput = document.getElementById('jsonFileInput');
    if (fileInput && !fileInput._bound) {
        fileInput.addEventListener('change', function()
        {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
            const data = JSON.parse(e.target.result);
            if (data.states) {
                states = data.states;
                connections = data.connections || [];
                renderAll();
            } else {
                showAlert("文件格式不正确");
            }
            } catch (err) {
            showAlert("JSON 解析失败");
            }
        };
        reader.readAsText(file);
        this.value = '';
        });
        fileInput._bound = true;
    }
    
    // 鼠标移动与松开事件（拖拽）——只绑定一次
    if (!window._stateGenEventsBound)
    {
        document.addEventListener('mousemove', (e) =>
        {
            // 如果没有在拖拽，或者没有当前拖拽的ID，则直接返回
            // if (!isDragging || currentDragId === null) return;

            // 获取画布的边界矩形
            const rect = canvas.getBoundingClientRect();

            // 尚未确认为拖拽：检查移动阈值（例如 5px）
            if (!isDragging && potentialDrag && currentDragId !== null)
            {
                // console.log("检查拖动阈值中", potentialDrag);
                const dx = e.clientX - potentialDrag.startClientX;
                const dy = e.clientY - potentialDrag.startClientY;

                if (Math.hypot(dx, dy) < 10)
                {
                    // 小移动，不视为拖拽；但若移动则取消长按定时器
                    return;
                }

                // 超过阈值：取消长按并进入真正的拖拽
                if (potentialDrag.longPressTimer)
                {
                    clearTimeout(potentialDrag.longPressTimer);
                }

                isDragging = true;
                // 根据画布坐标计算偏移，避免跳位
                dragOffset.x = potentialDrag.startClientX - rect.left - potentialDrag.stateX;
                dragOffset.y = potentialDrag.startClientY - rect.top - potentialDrag.stateY;
                potentialDrag.isLongPress = false;
            }
            
            // 真正拖拽逻辑
            if (isDragging && currentDragId !== null)
            {
                console.log("拖动被触发了");
                const x = e.clientX - rect.left - dragOffset.x;
                const y = e.clientY - rect.top - dragOffset.y;

                const state = states.find(s => s.id === currentDragId);
                if (state)
                {
                    state.x = Math.max(0, Math.min(x, rect.width - 100));
                    state.y = Math.max(0, Math.min(y, rect.height - 40));
                    const nodeEl = document.getElementById(`state-${state.id}`);
                    if (nodeEl)
                    {
                        nodeEl.style.left = state.x + 'px';
                        nodeEl.style.top = state.y + 'px';
                    }
                    renderConnections();
                }
            }
        });

        document.addEventListener('mouseup', () =>
        {
            isDragging = false;
            currentDragId = null;
            // 清理拖拽相关状态与长按定时器，避免按下但未移动时仍触发长按
            if (potentialDrag && potentialDrag.longPressTimer)
            {
                // 停止计时器
                clearTimeout(potentialDrag.longPressTimer);
            }
            potentialDrag = null;
        });

        // 隐藏菜单（点击其它地方）
        document.addEventListener('mousedown', function(e) 
        {
            // 如果菜单已显示，且点击的不是菜单本身及其子项，则隐藏
            if (menu && menu.offsetParent !== null && !menu.contains(e.target))
            {
                console.log(menu.style.display, "文档点击检测菜单隐藏");
                menu.style.display = 'none';
                menuStateId = null;
            }
        });

        // 确认页面已经绑定过了一次了
        window._stateGenEventsBound = true;


    }

    // 绑定菜单项点击（每次切回页面都要执行）
    menu.addEventListener('click', function(e) 
    {
        // 如果点击的不是菜单项，忽略
        if (!e.target.classList.contains('menu-item')) return;

        // 获取动作类型
        const action = e.target.getAttribute('data-action');

        // 如果是添加新状态
        if (action === 'add')
        {
            addNewState();
        }
        // 如果是重命名状态
        else if (action === 'rename' && menuStateId)
        {
            // 触发重命名（模拟双击）
            // console.log("尝试通过菜单重命名状态");
            const el = document.getElementById(`state-${menuStateId}`);
            if (el) el.dispatchEvent(new MouseEvent('dblclick'));
        }
        else if (action === 'connect' && menuStateId)
        {
            startPendingConnection(menuStateId);
        }

        menu.style.display = 'none';
        menuStateId = null;
    });

    // 页面加载时初始化输入框
    const input = document.getElementById('statemachine-name');

    // 输入框内容变化时同步到变量
    if (input)
    {
        input.value = window.getStatemachineName ? window.getStatemachineName() : "StateMachine";
        input.addEventListener('input', function() 
        {
        let val = this.value.replace(/[^A-Za-z0-9_]/g, ''); // 只允许英文、数字、下划线
        if (val.length > 16) val = val.slice(0, 16);
        this.value = val;
        if (window.setStatemachineName) window.setStatemachineName(val);
        });
    }

    renderAll();
}



/**
 * @description 尝试添加一个从 sourceId 状态开始的 pending 连接
 * @param {*} sourceId 
 * @returns 
 */
function startPendingConnection(sourceId) {
    // 先清理已有的 pending
    stopPendingConnection();

    window.pendingConnectionSource = sourceId;
    if (!svgLayer || !canvas) return;

    const fromState = states.find(s => s.id === sourceId);
    if (!fromState) return;

    // --- 获取真实 DOM 元素尺寸 ---
    const fromEl = document.getElementById(`state-${fromState.id}`);
    const fromW = fromEl ? fromEl.offsetWidth : 100;
    const fromH = fromEl ? fromEl.offsetHeight : 40;
    const halfW = fromW / 2;
    const halfH = fromH / 2;

    // 临时线条（id 便于后续移除）
    const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.setAttribute('id', 'temp-conn-line');

    // 起点使用状态中心（动态计算）
    const fromCx = fromState.x + halfW;
    const fromCy = fromState.y + halfH;

    // 初始起点放在边界上
    const pStart = getRectEdgePoint(fromCx, fromCy, halfW, halfH, fromCx, fromCy);

    tempLine.setAttribute('x1', pStart.x);
    tempLine.setAttribute('y1', pStart.y);

    // 终点初始与起点相同，后续由 mousemove 更新
    tempLine.setAttribute('x2', fromState.x + 50);
    tempLine.setAttribute('y2', fromState.y + 20);

    tempLine.setAttribute('stroke', '#2d7be5');
    tempLine.setAttribute('stroke-width', '2');
    tempLine.setAttribute('marker-end', 'url(#arrowhead)');

    svgLayer.appendChild(tempLine);

    // 鼠标移动更新临时线的起点和终点（相对于 svg 的坐标）
    window._pendingConnMoveHandler = function (ev)
    {
        const svgRect = svgLayer.getBoundingClientRect();
        const mx = ev.clientX - svgRect.left;
        const my = ev.clientY - svgRect.top;

        // 更新起点（始终在源状态边界上）
        const pEdge = getRectEdgePoint(fromCx, fromCy, halfW, halfH, mx, my);
        tempLine.setAttribute('x1', pEdge.x);
        tempLine.setAttribute('y1', pEdge.y);

        // 更新终点
        tempLine.setAttribute('x2', mx);
        tempLine.setAttribute('y2', my);
    };
    document.addEventListener('mousemove', window._pendingConnMoveHandler);

    // ESC 取消连接
    window._pendingConnKeyHandler = function (ev) {
        if (ev.key === 'Escape') stopPendingConnection();
    };
    document.addEventListener('keydown', window._pendingConnKeyHandler);
}

/**
 * @description 停止当前的 pending 连接尝试
 */
function stopPendingConnection() {
    // 移除鼠标移动与键盘监听
    if (window._pendingConnMoveHandler) {
        document.removeEventListener('mousemove', window._pendingConnMoveHandler);
        window._pendingConnMoveHandler = null;
    }
    if (window._pendingConnKeyHandler) {
        document.removeEventListener('keydown', window._pendingConnKeyHandler);
        window._pendingConnKeyHandler = null;
    }
    // 移除临时线
    const temp = document.getElementById('temp-conn-line');
    if (temp && temp.parentNode) temp.parentNode.removeChild(temp);

    window.pendingConnectionSource = null;
}



























// 暴露给全局
window.initStateGen = initStateGen;