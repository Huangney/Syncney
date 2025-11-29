// --- 数据模型 ---
let states = [
    { id: 1, name: "IDLE", funcName:"Default", x: 50, y: 50 },
    { id: 2, name: "WORK", funcName:"Default", x: 250, y: 50 }
];
let connections = [
    { from: 1, to: 2 }
];

let selectedStateId = null;
let menuStateId = null;

// DOM 引用
let canvas = null;
let svgLayer = null;

// 拖拽状态
let isDragging = false;
let currentDragId = null;

let potentialDrag = null;
let dragOffset = { x: 0, y: 0 };

// 连接状态
let pendingConnectionSource = null;
let _pendingConnMoveHandler = null;
let _pendingConnKeyHandler = null;

/**
 * 获取状态数据
 */
function getStates() {
    return states;
}

function getConnections() {
    return connections;
}

function getSelectedStateId() {
    return selectedStateId;
}

function setSelectedStateId(id) {
    selectedStateId = id;
}

/**
 * @brief 添加新状态节点（对应页面中按钮）
 */
function addNewState()
{
    const id = Date.now();
    // 随机位置，避免重叠
    const x = 50 + (states.length * 20) % 300;
    const y = 50 + (states.length * 20) % 200;
    states.push({ id, name: `STATE_${states.length}`, funcName: `Default`, x, y });
    renderStates();
}

/**
 * @brief 删除选中的状态节点（对应页面中按钮）
 */
function deleteSelectedState()
{
    if (!selectedStateId) {
        alert("请先点击选中一个状态！");
        return;
    }
    if (confirm("确定删除该状态吗？")) 
    {
        states = states.filter(s => s.id !== selectedStateId);

        connections = connections.filter(c => c.from !== selectedStateId && c.to !== selectedStateId);
        
        selectedStateId = null;
        
        renderAll();
    }
}




// 暴露给全局
window.getStates = getStates;
window.getConnections = getConnections;
window.addNewState = addNewState;
window.deleteSelectedState = deleteSelectedState;