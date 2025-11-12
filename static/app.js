const API_BASE = "";

// DOM
const devicesList = document.getElementById("devices-list");
const batteriesList = document.getElementById("batteries-list");
const btnNewDevice = document.getElementById("btn-new-device");
const btnNewBattery = document.getElementById("btn-new-battery");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

modalClose.onclick = () => hideModal();
modal.onclick = (e) => { if (e.target === modal) hideModal(); };

async function request(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// --- Загрузка и рендер ---
async function loadAll() {
  devicesList.innerHTML = "<li>Загрузка устройств...</li>";
  batteriesList.innerHTML = "<li>Загрузка батарей...</li>";
  try {
    const [devices, batteries] = await Promise.all([
      request("/devices/"),
      request("/battery/")
    ]);

    // построим мапу deviceId -> [battery, ...]
    const map = {};
    (batteries || []).forEach(b => {
      const did = b.device_id;
      if (did) {
        if (!map[did]) map[did] = [];
        map[did].push(b);
      }
    });

    // рендер устройств (с вложенными батареями)
    devicesList.innerHTML = "";
    devices.forEach(d => renderDevice(d, map[d.id] || []));

    // рендер батарей (с именем устройства, если есть)
    batteriesList.innerHTML = "";
    const deviceNameById = {};
    devices.forEach(d => deviceNameById[d.id] = d.name);
    batteries.forEach(b => renderBattery(b, deviceNameById[b.device_id] || null));
  } catch (e) {
    devicesList.innerHTML = `<li class="error">Ошибка: ${escapeHtml(e.message)}</li>`;
    batteriesList.innerHTML = `<li class="error">Ошибка: ${escapeHtml(e.message)}</li>`;
  }
}

// --- Рендереры ---
function renderDevice(d, batteriesForDevice) {
  const li = document.createElement("li");
  // батареи отображаем по имени
  const batteriesHtml = (batteriesForDevice.length > 0)
    ? `<div style="margin-top:6px;font-size:13px;color:#333">Батареи: ${batteriesForDevice.map(b => `<strong>${escapeHtml(b.name)}</strong>`).join(', ')}</div>`
    : `<div style="margin-top:6px;font-size:13px;color:#777">Нет подключённых батарей</div>`;

  li.innerHTML = `
    <div>
      <strong>${escapeHtml(d.name)}</strong> <small>v:${escapeHtml(String(d.version||""))}</small>
      <div style="font-size:12px;color:#666">Статус: ${d.status ? "Вкл":"Выкл"}</div>
      ${batteriesHtml}
    </div>
    <div class="toolbar">
      <button data-id="${d.id}" class="btn-view">Подробнее</button>
      <button data-id="${d.id}" class="btn-edit">Редактировать</button>
      <button data-id="${d.id}" class="btn-del">Удалить</button>
    </div>
  `;
  devicesList.appendChild(li);

  li.querySelector(".btn-view").onclick = () => showDeviceDetail(d.id);
  li.querySelector(".btn-edit").onclick = () => showDeviceEdit(d);
  li.querySelector(".btn-del").onclick = async () => {
    if (!confirm("Удалить устройство?")) return;
    try {
      await request(`/devices/delete_device?device_id=${d.id}`, { method: "DELETE" });
      await loadAll();
    } catch (e) { alert(e.message); }
  };
}

function renderBattery(b, deviceName=null) {
  const li = document.createElement("li");
  const devText = deviceName ? escapeHtml(deviceName) : (b.device_id ? escapeHtml(String(b.device_id)) : "устройства не подключены");
  li.innerHTML = `
    <div>
      <strong>${escapeHtml(b.name)}</strong>
      <div style="font-size:12px;color:#666">Вольтаж: ${b.voltage} — Вместимость: ${b.capacity}%</div>
      <div style="font-size:12px;color:#666">Устройство: ${devText}</div>
    </div>
    <div class="toolbar">
      <button data-id="${b.id}" class="btn-attach">Добавить устройство</button>
      <button data-id="${b.id}" class="btn-edit">Редактировать</button>
      <button data-id="${b.id}" class="btn-del">Удалить</button>
    </div>
  `;
  batteriesList.appendChild(li);

  li.querySelector(".btn-attach").onclick = () => showAttachBattery(b);
  li.querySelector(".btn-edit").onclick = () => showBatteryEdit(b);
  li.querySelector(".btn-del").onclick = async () => {
    if (!confirm("Удалить батарею?")) return;
    try {
      await request(`/battery/delete_battery?battery_id=${b.id}`, { method: "DELETE" });
      await loadAll();
    } catch (e) { alert(e.message); }
  };
}

// --- Модальные окна и формы ---
function showModal(html) { modalBody.innerHTML = html; modal.classList.remove("hidden"); }
function hideModal() { modal.classList.add("hidden"); modalBody.innerHTML = ""; }
function escapeHtml(s) { if (s === null || s === undefined) return ""; return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

// Create device
btnNewDevice.onclick = () => {
  showModal(`
    <h3>Создать устройство</h3>
    <label>Название <input id="m_name"></label>
    <label>Версия <input id="m_version" type="number" value="1"></label>
    <label>Статус <select id="m_status"><option value="false">Выкл</option><option value="true">Вкл</option></select></label>
    <div style="text-align:right"><button id="m_save">Сохранить</button></div>
  `);
  document.getElementById("m_save").onclick = async () => {
    const body = {
      name: document.getElementById("m_name").value.trim(),
      version: parseInt(document.getElementById("m_version").value, 10),
      status: document.getElementById("m_status").value === "true"
    };
    try {
      await request(`/devices/create`, { method: "POST", body: JSON.stringify(body) });
      hideModal();
      await loadAll();
    } catch (e) { alert(e.message); }
  };
};

// Create battery
btnNewBattery.onclick = () => {
  showModal(`
    <h3>Создать батарею</h3>
    <label>Название <input id="m_name"></label>
    <label>Вольтаж <input id="m_voltage" type="number" step="0.1"></label>
    <label>Вместимость % <input id="m_cap" type="number" step="1" min="0" max="100"></label>
    <label>Время работы <input id="m_life" type="number"></label>
    <div style="text-align:right"><button id="m_save">Сохранить</button></div>
  `);
  document.getElementById("m_save").onclick = async () => {
    const body = {
      name: document.getElementById("m_name").value.trim(),
      voltage: parseInt(document.getElementById("m_voltage").value, 10),
      capacity: parseInt(document.getElementById("m_cap").value, 10),
      lifetime: parseInt(document.getElementById("m_life").value, 10),
      device_id: null
    };
    try {
      await request(`/battery/create`, { method: "POST", body: JSON.stringify(body) });
      hideModal();
      await loadAll();
    } catch (e) { alert(e.message); }
  };
};

// Show device detail (с подробным списком батарей с кнопкой Detach)
async function showDeviceDetail(id) {
  try {
    let d;
    try {
      d = await request(`/devices/${id}`);
    } catch (_) {
      // fallback: загрузим все устройства и выберем нужное
      const all = await request("/devices/");
      d = all.find(x => x.id === id) || all.find(x => String(x.id) === String(id));
    }

    // получить батареи: если device включает batteries — используем, иначе фильтруем общий список
    let batteries = d.batteries ? d.batteries : (await request("/battery/")).filter(b => b.device_id === id);

    let html = `<h3>${escapeHtml(d.name)}</h3>
      <p>Версия: ${escapeHtml(String(d.version))} — Статус: ${d.status ? "Вкл":"Выкл"}</p>
      <h4>Подключенные батареи</h4>
      <ul>`;
    (batteries || []).forEach(b => {
      html += `<li>${escapeHtml(b.name)} — <button data-bid="${b.id}" data-did="${d.id}" class="btn-unattach">Открепить устройство</button></li>`;
    });
    html += `</ul>
      <p><em>Чтобы присоединить батарею — используйте список батарей (Добавить устройство).</em></p>`;
    showModal(html);

    document.querySelectorAll(".btn-unattach").forEach(btn => {
      btn.onclick = async () => {
        const bid = btn.dataset.bid, did = btn.dataset.did;
        try {
          const body = { device_id: null };
          await request(`/battery/update?battery_id=${bid}`, { method: "PUT", body: JSON.stringify(body) });
          hideModal();
          await loadAll();
        } catch (e) { alert(e.message); }
      };
    });
  } catch (e) { alert(e.message); }
}

function showDeviceEdit(d) {
  showModal(`
    <h3>Редактировать устройство</h3>
    <label>Название <input id="m_name" value="${escapeHtml(d.name)}"></label>
    <label>Версия <input id="m_version" type="number" value="${escapeHtml(String(d.version||"1"))}"></label>
    <label>Статус <select id="m_status"><option value="false">Выкл</option><option value="true">Вкл</option></select></label>
    <div style="text-align:right"><button id="m_save">Сохранить</button></div>
  `);
  document.getElementById("m_status").value = d.status ? "true":"false";
  document.getElementById("m_save").onclick = async () => {
    const body = {
      name: document.getElementById("m_name").value.trim(),
      version: parseInt(document.getElementById("m_version").value, 10),
      status: document.getElementById("m_status").value === "true"
    };
    try {
      await request(`/devices/update?device_id=${d.id}`, { method: "PUT", body: JSON.stringify(body) });
      hideModal();
      await loadAll();
    } catch (e) { alert(e.message); }
  };
}

function showBatteryEdit(b) {
  showModal(`
    <h3>Редактировать батарею</h3>
    <label>Название <input id="m_name" value="${escapeHtml(b.name)}"></label>
    <label>Вольтаж <input id="m_voltage" type="number" step="0.1" value="${b.voltage || 0}"></label>
    <label>Вместимость % <input id="m_cap" type="number" value="${b.capacity || 0}"></label>
    <label>Время работы <input id="m_life" type="number" value="${b.lifetime || 0}"></label>
    <div style="text-align:right"><button id="m_save">Сохранить</button></div>
  `);
  document.getElementById("m_save").onclick = async () => {
    const body = {
      name: document.getElementById("m_name").value.trim(),
      voltage: parseInt(document.getElementById("m_voltage").value, 10),
      capacity: parseInt(document.getElementById("m_cap").value, 10),
      lifetime: parseInt(document.getElementById("m_life").value, 10)
    };
    try {
      await request(`/battery/update?battery_id=${b.id}`, { method: "PUT", body: JSON.stringify(body) });
      hideModal();
      await loadAll();
    } catch (e) { alert(e.message); }
  };
}

// Attach battery: показываем список устройств (и затем обновляем battery.device_id через update)
async function showAttachBattery(b) {
  try {
    const devices = await request("/devices/");
    let html = `<h3>Подключенные батареи "${escapeHtml(b.name)}"</h3><ul>`;
    devices.forEach(d => {
      html += `<li>${escapeHtml(d.name)} — <button data-did="${d.id}" class="btn-attach-to">Прикрепить</button></li>`;
    });
    html += `</ul>`;
    showModal(html);
    document.querySelectorAll(".btn-attach-to").forEach(btn => {
      btn.onclick = async () => {
        const did = btn.dataset.did;
        try {
          const body = { device_id: parseInt(did, 10) };
          await request(`/battery/update?battery_id=${b.id}`, { method: "PUT", body: JSON.stringify(body) });
          hideModal();
          await loadAll();
        } catch (e) { alert(e.message); }
      };
    });
  } catch (e) { alert(e.message); }
}

// initial load
loadAll();
