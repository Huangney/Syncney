// 串口是否已经打开
let isPortOpen = false;

/**
 * @brief 切换按钮关闭 / 打开的状态的按钮
 */
async function togglePort()
{
  console.log("切换串口按钮被按下");

  // 首先，获取被按下的按钮
  const targBtn = document.getElementById("toggle_port_button");

  // 接着识别目标端口
  const portSelect = document.getElementById("port").value;

  // 根据端口的开闭选择函数
  if (!isPortOpen)
  {
    await openPortAsync(targBtn, portSelect);
  }
  else
  {
    await closePortAsync(targBtn, portSelect);
  }
}

async function openPortAsync(Button, portSelect)
{
  console.log("尝试打开串口");

  // 首先，前端按下按钮的一瞬间禁用按钮，让用户知道自己按了
  Button.disabled = true;
  // 更改按钮文字
  Button.textContent = "正在打开...";

  // 获取用户输入的波特率
  const baudRate = parseInt(document.getElementById("baud_select").value);

  // 调用preload.js中暴露的 serialAPI，打开串口
  const result = await window.serialAPI.openPort({path : portSelect, baudRate: baudRate});

  // 根据结果更改按钮状态
  if (!result.success) // 失败则弹窗警告
  {
    showAlert("串口打开失败：" + result.message);
    Button.disabled = false;                 // 恢复按钮可用
    Button.textContent = "打开串口";           // 恢复按钮文字
  }
  else  // 成功则将按钮改为“关闭串口”，并禁用选择串口的列表
  {
    // 给标志位置位
    isPortOpen = true;
    
    const port_list = document.getElementById("port");
    Button.textContent = "关闭串口";
    Button.disabled = false;

    // 禁用选择串口的下拉框
    port_list.disabled = true;
  }
}


async function closePortAsync(Button, portSelect)
{
  console.log("尝试关闭串口");
  
  // 首先禁用按钮
  Button.disabled = true;

  // 尝试关闭串口
  const result = await window.serialAPI.closePort();

  // 根据结果更改按钮状态
  if (result)
  {
    // 给标志位复位
    isPortOpen = false;

    // 弹窗
    // showAlert("串口关闭成功");
    showToast("串口已关闭", 2000);
    // 恢复文本
    Button.textContent = "打开串口";
    // 解禁按钮
    Button.disabled = false;
    // 解禁下拉框
    const port_list = document.getElementById("port");
    port_list.disabled = false;
  }
  else
  {
    // showAlert("串口未打开或关闭失败");
    showToast("串口未打开或关闭失败", 2000);
    Button.disabled = false;
  }
}




async function refreshPortList()
{
  // 获取对应串口
  const ports = await window.serialAPI.listPorts();
  // 获取下拉框元素
  const select = document.getElementById("port");

  select.innerHTML = ""; // 清空原有选项

  // 遍历串口列表，添加选项
  ports.forEach(port => 
    {
      console.log(port);
      const option = document.createElement("option");
      option.value = port.path;

      // 显示串口号和其他信息
      option.text = `${port.path} (${port.friendlyName || "未知设备"})`;
      select.appendChild(option);
    }
  );
}



/**
 * @brief 切换页面
 * @param {*} page 
 */
async function switchPage(page)
{
  // 获取右侧主内容区
  const main = document.getElementById("main-content");

  // 根据页面名称，读取不同的HTML文件
  let pageFile = "";

  if (page === "serial")
  {
    pageFile = "serial.html";
  }
  else if (page === "setting")
  {
    pageFile = "setting.html";
  }
  else if (page === "state_generate")
  {
    pageFile = "state_generate.html";
  }
  else if (page === "about")
  {
    pageFile = "about.html";
  }
  else return;

  // 加载对应页面内容
  const fs = await fetch(pageFile);
  main.innerHTML = await fs.text();

  // 先加载通用的脚本
  const commonScriptSrc = 'common_modules/common_func.js';

  if (!document.querySelector(`script[src="${commonScriptSrc}"]`)) 
  {
    const s = document.createElement('script');
    s.src = commonScriptSrc;
    document.body.appendChild(s);
    await new Promise((resolve, reject) =>
    {
      s.onload = resolve;
      s.onerror = () => reject(new Error('加载 common_func.js 失败'));
    });
  }

  // 串口页面
  if (page === "serial") 
  {
    refreshPortList();
  }

  // 如果是状态机页面，动态加载并初始化脚本（只加载一次）
  else if (page === "state_generate")   
  {
    // 依次加载依赖脚本
    const scripts = [
      'state_modules/state-model.js',
      'state_modules/state-renderer.js',
      'state_modules/state-events.js',
    ];

    // 只加载一次
    for (const src of scripts)
    {
      if (!document.querySelector(`script[src="${src}"]`))
      {
        const s = document.createElement('script');
        
        // 文件名对应实际的文件中的名字
        s.src = src; 

        document.body.appendChild(s);
        
        await new Promise((resolve, reject) =>
        {
          s.onload = resolve;
          s.onerror = () => reject(new Error('加载 ${src} 失败'));
        });
      }
    }

    // 调用初始化（每次切换页面都调用，确保 DOM 元素和事件绑定就绪）
    if (typeof window.initStateGen === 'function') window.initStateGen();
  }
}


// 页面加载时默认注入串口助手页面
window.onload = () => switchPage('serial');


window.serialAPI.onData((msg) => {
  const recv = document.getElementById("recv");
  recv.value += msg;
});

function sendData() {
  const msg = document.getElementById("send").value;
  window.serialAPI.writeData(msg);
}


