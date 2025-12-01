
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


function showToast(msg, duration = 1000) 
{
  const toast = document.getElementById('toast-notify');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = 'block';
  toast.style.opacity = '0.8';

  // 自动消失（transition: 0.3s）
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 300);
  }, duration);
}