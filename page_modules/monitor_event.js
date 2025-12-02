let _recvBuffer = '';
let _textDecoder = new TextDecoder();

async function MonitorPageInit() 
{
    const port_select = document.getElementById("port");
    
    // 修复1：增加判空。如果页面没加载好或者切到了别的页面，port_select 为 null，此时不要调用 refreshPortList
    if (port_select && window.serial_UI && typeof window.serial_UI.refreshPortList === 'function') {
        window.serial_UI.refreshPortList(port_select);
    }

    // 修复2：防止重复注册监听器
    // 检查全局标记，如果已经注册过，就不要再注册了
    if (!window._hasRegisteredSerialMonitor) 
    {
        try 
        {
            if (window.serialAPI && typeof window.serialAPI.onData === 'function') 
            {
                // 注册回调
                window.serialAPI.onData(handleRawChunk);
                
                // 标记为已注册
                window._hasRegisteredSerialMonitor = true;
                console.log('MonitorPageInit: 串口数据监听器注册成功 (单次)');
            } 
            else 
            {
                console.warn('MonitorPageInit: window.serialAPI.onData 不可用');
            }
        } 
        catch (e) 
        {
            console.error('MonitorPageInit: 注册串口数据回调失败', e);
        }
    }
}


// 解码函数
function handleRawChunk(chunk)
{
    // 修复3：严格的 DOM 检查
    // 如果当前不在 Monitor 页面，message-log 元素可能不存在
    // 此时直接返回，不要执行后续逻辑，防止报错
    var container = document.getElementById('message-log');
    if (!container) return;

    console.log("收到原始串口数据块:", chunk);
    
    var text = '';
    if (typeof chunk === 'string') 
    {
        text = chunk;
    } 
    else if (chunk instanceof Uint8Array || chunk instanceof ArrayBuffer) 
    {
        if (chunk instanceof ArrayBuffer) 
            {
            chunk = new Uint8Array(chunk);
        }
        text = _textDecoder.decode(chunk);
    } else {
        // 未知类型，尝试转成字符串
        try { text = String(chunk); } catch (e) { text = ''; }
    }

    _recvBuffer += text;

    // 以换行符为分割，逐行处理。保留最后一个可能不完整的行在缓冲区。
    var lines = _recvBuffer.split('\n');
    // 最后一项可能不完整，保留在缓冲区
    _recvBuffer = lines.pop();

    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.length === 0) continue;
        var decoded = decodeSerialLine(line);
        if (decoded) {
            appendMessageBubble(decoded);
        } else {
            // 非匹配的原始信息也可以显示为原文（可选）
            appendMessageBubble({ type: 'RAW', time: '', content: line });
        }
    }
}

// 解码函数
// 目标格式示例: [LOG][1.25] (这一段是具体内容)
function decodeSerialLine(line)
{
    // 简单正则：以 [LOG] 开头，随后 [time]，其后为空格或直接是内容
    var re = /^\[LOG\]\s*\[([0-9]+(?:\.[0-9]+)?)\]\s*(.*)$/;
    var m = re.exec(line);
    if (!m) return null;
    return {
        type: 'LOG',
        time: m[1],
        content: m[2]
    };
}

function appendMessageBubble(msg)
{
    var container = document.getElementById('message-log');
    if (!container) return; // 双重保险

    var bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    var header = document.createElement('div');
    header.className = 'message-header';
    if (msg.type) {
        var typeSpan = document.createElement('span');
        typeSpan.className = 'message-type';
        typeSpan.textContent = msg.type;
        header.appendChild(typeSpan);
    }
    if (msg.time) {
        var timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = ' ' + msg.time;
        header.appendChild(timeSpan);
    }

    var body = document.createElement('div');
    body.className = 'message-body';
    body.textContent = msg.content;

    bubble.appendChild(header);
    bubble.appendChild(body);

    container.appendChild(bubble);

    // 自动滚动到底部
    container.scrollTop = container.scrollHeight;
}

// 暴露给window
window.MonitorPageInit = MonitorPageInit;