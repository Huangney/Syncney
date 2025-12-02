
/**
 * @brief 切换页面
 * @param {*} page 
 */
async function switchPage(page)
{
  // 先清理任何页面短键/全局监听，确保新页面干净
  cleanupPageShortcuts();
  
  // 获取右侧主内容区
  const main = document.getElementById("main-content");

  // 根据页面名称，读取不同的HTML文件
  let pageFile = "";

  if (page === "serial")  pageFile = "pages/serial.html";
  else if (page === "setting")  pageFile = "pages/setting.html";
  else if (page === "state_generate")   pageFile = "pages/state_generate.html";
  else if (page === "about")  pageFile = "pages/about.html";
  else if (page === "monitor")  pageFile = "pages/monitor.html";
  else return;

  // 加载对应页面内容
  const fs = await fetch(pageFile);
  main.innerHTML = await fs.text();

  // 先加载通用的脚本
    const commonScriptSrc = [
    'common_modules/common_func.js',
    'common_modules/serial_ui.js',
  ];

  // 逐个加载，且仅加载一次
  for (const src of commonScriptSrc) {
    if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement('script');
      s.src = src;
      document.body.appendChild(s);
      await new Promise((resolve, reject) => {
        s.onload = resolve;
        s.onerror = () => reject(new Error(`加载 ${src} 失败`));
      });
    }
  }

  // 串口页面
  if (page === "serial") 
  {
    const select = document.getElementById("port");
    window.serial_UI.refreshPortList(select);
  }

  // 如果是状态机页面，动态加载并初始化脚本（只加载一次）
  else if (page === "state_generate")   
  {
    InitStateGeneratePage();
  }
  else if (page === "monitor")
  {
    InitMonitorPage();
  }
}



async function InitStateGeneratePage()
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



async function InitMonitorPage()
{
  // 依次加载依赖脚本
    const scripts = [
      'page_modules/monitor_event.js',
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
    if (typeof window.MonitorPageInit === 'function') window.MonitorPageInit();
}






/**
 * 简洁通用的清理函数：移除通过 registerPageListener 注册的监听，
 * 以及若干常见的 window 上残留 handler 引用（尝试移除后删除引用）。
 */
// target 默认为 document
function registerPageShortcut(type, handler, options, target) {
  if (!window._pageShortcuts) window._pageShortcuts = [];
  const t = target || document;
  t.addEventListener(type, handler, options);
  window._pageShortcuts.push({ type, handler, options, target: t });
  return handler;
}

function unregisterPageShortcut(handler) {
  if (!Array.isArray(window._pageShortcuts)) return;
  const idx = window._pageShortcuts.findIndex(s => s.handler === handler);
  if (idx === -1) return;
  const s = window._pageShortcuts.splice(idx, 1)[0];
  try { s.target.removeEventListener(s.type, s.handler, s.options); } catch (e) {}
}

function cleanupPageShortcuts() {
  if (!Array.isArray(window._pageShortcuts)) return;
  window._pageShortcuts.forEach(s => {
    try { s.target.removeEventListener(s.type, s.handler, s.options); } catch (e) {}
  });
  window._pageShortcuts.length = 0;
}





// 页面加载时默认注入串口助手页面
window.onload = () => switchPage('serial');


window.serialAPI.onData((msg) => {
  const recv = document.getElementById("recv");
  // 修复：增加判空，防止在非串口助手页面（如Monitor页面）报错
  if (recv) {
    recv.value += msg;
  }
});

function sendData() {
  const msg = document.getElementById("send").value;
  window.serialAPI.writeData(msg);
}


