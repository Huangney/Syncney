
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