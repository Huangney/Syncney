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

let statemachineName = "Core";

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

function setStatemachineName(name) {
    console.log("Name", name);
    statemachineName = name;
}
function getStatemachineName() {
    return statemachineName;
}


/****-----<     分界线      >-----****/


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
        showAlert("请先点击选中一个状态！");
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


/**
 * @description 导出当前的状态机数据为 JSON 文件
 */
function export_StateCoreJson(filePath)
{
        // 构造导出数据
    const data = 
    {
        statemachineName: statemachineName,
        states: states.map(s => ({
            id: s.id,
            name: s.name,
            funcName: s.funcName,
            x: s.x,
            y: s.y
        })),

        connections: connections.map(c => ({
            from: c.from,
            to: c.to
        }))
    };

    // Electron 渲染进程调用主进程保存文件
    if (window.windowAPI && window.windowAPI.saveJson) 
    {
        window.windowAPI.saveJson(filePath, JSON.stringify(data, null, 2));
        showAlert("导出成功！");
    } else {
        showAlert("导出接口未初始化！");
    }
}

/**
 * @description 从 JSON 文件导入状态机数据
 * @param {string} filePath 用户选择的 JSON 文件路径
 */
function import_StateCoreJson(filePath)
{
    if (window.windowAPI && window.windowAPI.readJson) 
    {
        window.windowAPI.readJson(filePath).then(content => 
        {
            try 
            {
                const data = JSON.parse(content);
                if (Array.isArray(data.states) && Array.isArray(data.connections))
                {
                    // 导入状态机名称
                    // statemachineName = data.statemachineName || "StateMachine";
                    // document.getElementById('statemachine-name').value = statemachineName;

                    // 导入状态和连接
                    states = data.states.map(s => ({
                        id: s.id,
                        name: s.name,
                        funcName: s.funcName,
                        x: s.x,
                        y: s.y
                    }));
                    connections = data.connections.map(c => ({
                        from: c.from,
                        to: c.to
                    }));
                    renderAll();
                    showAlert("导入成功！");
                } else {
                    showAlert("文件格式错误！");
                }
            } 
            catch (err) 
            {
                showAlert("JSON 解析失败：" + err.message);
            }
        });
    }
    else 
    {
        showAlert("导入接口未初始化！");
    }
}

/**
 * @description 导出当前状态机数据为 JSON 文件，供用户选择保存位置
 */
async function exportJson() 
{
    // 让用户选择文件夹
    const folderPath = await window.windowAPI.selectFolder();
    if (!folderPath)
    {
        showAlert("未选择文件夹，导出取消。");
        return;
    }

    // 构造文件名，自动用 statemachineName 作为文件名
    let name = statemachineName || "StateCore";

    // 只保留英文和数字，防止非法字符
    name = name.replace(/[^A-Za-z0-9_]/g, '').slice(0, 16);

    const filePath = window.windowAPI.pathJoin
        ? window.windowAPI.pathJoin(folderPath, name + ".json")
        : folderPath + "\\" + name + ".json";

    // 调用导出函数
    export_StateCoreJson(filePath);
}


/**
 * @description 选择 JSON 文件并导入状态机数据
 */
async function importJson() {
    // 让用户选择文件
    const filePath = await window.windowAPI.selectFile();

    // 恢复输入框焦点
    setTimeout(() => {
        const input = document.querySelector('input, textarea');
        if (input) input.focus();
    }, 200);

    if (!filePath)
    {
        showAlert("未选择文件，导入取消。");
        return;
    }
    // 调用导入函数
    import_StateCoreJson(filePath);
}




// 暴露给全局
window.getStates = getStates;
window.getConnections = getConnections;
window.addNewState = addNewState;
window.deleteSelectedState = deleteSelectedState;

window.setStatemachineName = setStatemachineName;
window.getStatemachineName = getStatemachineName;