async function MonitorPageInit() 
{
    port_select = document.getElementById("port");
    window.serial_UI.refreshPortList(port_select);
}

















// 暴露给window
window.MonitorPageInit = MonitorPageInit;