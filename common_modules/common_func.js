
/**
 * @description 显示自定义弹窗
 * @param {*} msg 
 * @param {*} callback 
 */
function showAlert(msg, callback) 
{
    const alertBox = document.getElementById('custom-alert');
    const alertMsg = document.getElementById('custom-alert-msg');
    const alertBtn = document.getElementById('custom-alert-btn');

    alertMsg.textContent = msg;
    alertBox.style.display = 'block';

    alertBtn.onclick = () => 
    {
        alertBox.style.display = 'none';
        if (callback) callback();
    };
    // 可选：自动聚焦按钮
    alertBtn.focus();
}


let toastTimer = null; // 新增：保存定时器ID
function showToast(msg, duration = 1000)
{
  const toast = document.getElementById('toast-notify');
  if (!toast) return;
  toast.textContent = msg;
  
  // 1. 先显示元素（此时 opacity 为 0）
  toast.style.display = 'block';
  
  // 2. 关键：强制浏览器重绘，确保 display: block 生效后再执行 opacity 动画
  toast.offsetHeight; 
  
  // 3. 设置目标透明度，触发 CSS transition 渐入
  toast.style.opacity = '1'; // 建议设为 1，让背景色的 rgba(..., 0.75) 控制透明度

  // 清除之前的定时器
  if (toastTimer) {
    clearTimeout(toastTimer);
    toastTimer = null;
  }

  // 自动消失（transition: 0.3s）
  toastTimer = setTimeout(() => {
    // 4. 触发 CSS transition 渐隐
    toast.style.opacity = '0';
    
    // 5. 等待动画结束后隐藏元素
    setTimeout(() => { 
        // 只有当 opacity 确实为 0 时才隐藏（防止快速连续触发时的冲突）
        if(toast.style.opacity === '0') {
            toast.style.display = 'none'; 
        }
    }, 300); // 这里的 300ms 必须与 CSS 中的 transition 时间一致
  }, duration);
}