// DOM-каркас має існувати ДО імпорту world (там створюється L.map).
document.body.innerHTML = '<div id="map" style="width:800px;height:600px"></div><div id="toast" class="hidden"></div>';
await import('../src/world');
export {};
