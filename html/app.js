/* ============================================================
   app.js - Dashboard semántico (CRUD, filtro, export, stats)
   ============================================================ */

/* ---------- UTILIDADES ---------- */
function obtenerReservas() {
  return JSON.parse(localStorage.getItem('reservas')) || [];
}
function guardarReservas(arr) {
  localStorage.setItem('reservas', JSON.stringify(arr));
}
function obtenerUsuario() {
  return JSON.parse(localStorage.getItem('usuario')) || null;
}
function escapeHtml(text) {
  if (!text && text !== 0) return '';
  return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

/* ---------- INICIALIZACIÓN Y CONTROL DE ROL ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Crear admin por defecto si no existe (para pruebas)
  let usuario = obtenerUsuario();
  if (!usuario) {
    const admin = { nombre:'admin', correo:'admin@elcielo.com', clave:'admin123', rol:'admin' };
    localStorage.setItem('usuario', JSON.stringify(admin));
    usuario = admin;
  }

  const usuarioSpan = document.getElementById('usuarioActual');
  if (usuarioSpan) usuarioSpan.textContent = `${usuario.nombre} (${usuario.rol})`;

  // Protege dashboard (solo admin)
  if (location.href.includes('dashboard.html')) {
    if (!usuario || usuario.rol !== 'admin') {
      alert('Acceso denegado. Solo administradores pueden acceder al panel.');
      window.location.href = 'login.html';
      return;
    }
  }

  // acciones globales
  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', () => {
    window.location.href = 'login.html';
  });

  inicializarDashboard();
});

/* ---------- DASHBOARD: FUNCIONES ---------- */
function inicializarDashboard() {
  // Elementos
  const tbody = document.querySelector('#tablaReservas tbody');
  const inputBuscar = document.getElementById('inputBuscar');
  const btnBuscar = document.getElementById('btnBuscar');
  const btnLimpiar = document.getElementById('btnLimpiar');
  const btnFiltrar = document.getElementById('btnFiltrar');
  const fechaDesde = document.getElementById('fechaDesde');
  const fechaHasta = document.getElementById('fechaHasta');

  const btnExportCSV = document.getElementById('btnExportCSV');
  const btnExportExcel = document.getElementById('btnExportExcel');
  const btnExportPDF = document.getElementById('btnExportPDF');
  const btnAgregarReserva = document.getElementById('btnAgregarReserva');

  const modal = document.getElementById('modal');
  const dialogSupported = typeof HTMLDialogElement === 'function';
  const btnGuardarModal = document.getElementById('btnGuardarModal');
  const btnCerrarModal = document.getElementById('btnCerrarModal');

  let reservasMostrar = obtenerReservas();

  // render inicial
  renderTabla(reservasMostrar);
  actualizarEstadisticas(reservasMostrar);

  // buscar
  if (btnBuscar) btnBuscar.addEventListener('click', () => {
    const q = (inputBuscar.value || '').trim().toLowerCase();
    reservasMostrar = buscarReservas(q);
    renderTabla(reservasMostrar);
    actualizarEstadisticas(reservasMostrar);
  });

  if (btnLimpiar) btnLimpiar.addEventListener('click', () => {
    inputBuscar.value = '';
    fechaDesde.value = '';
    fechaHasta.value = '';
    reservasMostrar = obtenerReservas();
    renderTabla(reservasMostrar);
    actualizarEstadisticas(reservasMostrar);
  });

  if (btnFiltrar) btnFiltrar.addEventListener('click', () => {
    const desde = fechaDesde.value;
    const hasta = fechaHasta.value;
    reservasMostrar = filtrarPorFechas(desde, hasta);
    renderTabla(reservasMostrar);
    actualizarEstadisticas(reservasMostrar);
  });

  if (btnExportCSV) btnExportCSV.addEventListener('click', () => {
    exportarCSV(reservasMostrar.length ? reservasMostrar : obtenerReservas());
  });

  if (btnExportExcel) btnExportExcel.addEventListener('click', () => {
    exportarExcel(reservasMostrar.length ? reservasMostrar : obtenerReservas());
  });

  if (btnExportPDF) btnExportPDF.addEventListener('click', () => {
    imprimirTabla(reservasMostrar.length ? reservasMostrar : obtenerReservas());
  });

  if (btnAgregarReserva) btnAgregarReserva.addEventListener('click', () => {
    abrirModalAgregar();
  });

  if (btnCerrarModal) btnCerrarModal.addEventListener('click', () => cerrarModal());

  if (btnGuardarModal) btnGuardarModal.addEventListener('click', () => {
    // validar y guardar desde inputs del modal
    const idx = document.getElementById('idxReserva').value;
    const obj = {
      nombre: document.getElementById('modalNombre').value.trim(),
      telefono: document.getElementById('modalTelefono').value.trim(),
      correo: document.getElementById('modalCorreo').value.trim(),
      habitacion: document.getElementById('modalHabitacion').value,
      fechaInicio: document.getElementById('modalLlegada').value,
      fechaFin: document.getElementById('modalSalida').value
    };

    if (!obj.nombre || !obj.correo || !obj.fechaInicio || !obj.fechaFin) {
      alert('Complete los campos obligatorios.');
      return;
    }

    // guardar/editar
    const arr = obtenerReservas();
    if (idx === '') {
      arr.push(obj);
    } else {
      arr[parseInt(idx,10)] = obj;
    }
    guardarReservas(arr);

    cerrarModal();
    reservasMostrar = obtenerReservas();
    renderTabla(reservasMostrar);
    actualizarEstadisticas(reservasMostrar);
  });

  // render Tabla
  function renderTabla(arr) {
    tbody.innerHTML = '';
    arr.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i+1}</td>
        <td>${escapeHtml(r.nombre)}</td>
        <td>${escapeHtml(r.telefono || '')}</td>
        <td>${escapeHtml(r.correo)}</td>
        <td>${escapeHtml(r.habitacion)}</td>
        <td>${escapeHtml(r.fechaInicio)}</td>
        <td>${escapeHtml(r.fechaFin)}</td>
        <td>
          <button class="btn small" onclick="abrirModalEditar(${i})">Editar</button>
          <button class="btn ghost small" onclick="eliminarReservaIndex(${i})">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  // BUSCAR
  function buscarReservas(q) {
    if (!q) return obtenerReservas();
    const all = obtenerReservas();
    return all.filter(r => {
      return (r.nombre||'').toLowerCase().includes(q) ||
             (r.correo||'').toLowerCase().includes(q) ||
             (r.telefono||'').toLowerCase().includes(q) ||
             (r.habitacion||'').toLowerCase().includes(q);
    });
  }

  // FILTRAR POR FECHAS
  function filtrarPorFechas(desde, hasta) {
    const all = obtenerReservas();
    if (!desde && !hasta) return all;
    return all.filter(r => {
      const inicio = r.fechaInicio || '';
      const fin = r.fechaFin || '';
      if (desde && hasta) return inicio >= desde && fin <= hasta;
      if (desde) return inicio >= desde;
      if (hasta) return fin <= hasta;
      return true;
    });
  }

  // MODAL: abrir editar/abrir agregar
  window.abrirModalEditar = function(index) {
    const r = obtenerReservas()[index];
    if (!r) return;
    document.getElementById('idxReserva').value = index;
    document.getElementById('modalNombre').value = r.nombre || '';
    document.getElementById('modalTelefono').value = r.telefono || '';
    document.getElementById('modalCorreo').value = r.correo || '';
    document.getElementById('modalHabitacion').value = r.habitacion || 'Simple';
    document.getElementById('modalLlegada').value = r.fechaInicio || '';
    document.getElementById('modalSalida').value = r.fechaFin || '';
    document.getElementById('modalTitulo').textContent = 'Editar reserva';
    showDialog();
  };

  window.abrirModalAgregar = function() {
    document.getElementById('idxReserva').value = '';
    document.getElementById('modalNombre').value = '';
    document.getElementById('modalTelefono').value = '';
    document.getElementById('modalCorreo').value = '';
    document.getElementById('modalHabitacion').value = 'Simple';
    document.getElementById('modalLlegada').value = '';
    document.getElementById('modalSalida').value = '';
    document.getElementById('modalTitulo').textContent = 'Agregar reserva';
    showDialog();
  };

  function showDialog() {
    if (typeof HTMLDialogElement === 'function') {
      modal.showModal();
    } else {
      modal.classList.remove('hidden');
    }
  }
  function cerrarModal() {
    if (typeof HTMLDialogElement === 'function') {
      modal.close();
    } else {
      modal.classList.add('hidden');
    }
  }

  // eliminar
  window.eliminarReservaIndex = function(indice) {
    if (!confirm('¿Eliminar esta reserva?')) return;
    const arr = obtenerReservas();
    arr.splice(indice,1);
    guardarReservas(arr);
    reservasMostrar = obtenerReservas();
    renderTabla(reservasMostrar);
    actualizarEstadisticas(reservasMostrar);
  };

  // export CSV
  function exportarCSV(dataArr) {
    if (!dataArr || !dataArr.length) { alert('No hay datos para exportar'); return; }
    const header = ['Nombre','Telefono','Correo','Habitacion','FechaInicio','FechaFin'];
    const rows = dataArr.map(r => [r.nombre, r.telefono||'', r.correo, r.habitacion, r.fechaInicio, r.fechaFin]);
    let csv = header.join(',') + '\n' + rows.map(r => r.map(cell => `"${(cell+'').replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reservas.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // export excel (CSV)
  function exportarExcel(dataArr) {
    exportarCSV(dataArr);
  }

  // imprimir / exportar PDF (vista)
  function imprimirTabla(dataArr) {
    const rows = dataArr || obtenerReservas();
    let html = `<html><head><title>Reservas</title><style>table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:8px;text-align:left;}th{background:#f4f6fb;}</style></head><body>`;
    html += `<h2>Reservas - Hospedaje El Cielo</h2>`;
    html += `<table><thead><tr><th>#</th><th>Nombre</th><th>Teléfono</th><th>Correo</th><th>Habitación</th><th>Llegada</th><th>Salida</th></tr></thead><tbody>`;
    rows.forEach((r,i) => {
      html += `<tr><td>${i+1}</td><td>${escapeHtml(r.nombre)}</td><td>${escapeHtml(r.telefono||'')}</td><td>${escapeHtml(r.correo)}</td><td>${escapeHtml(r.habitacion)}</td><td>${escapeHtml(r.fechaInicio)}</td><td>${escapeHtml(r.fechaFin)}</td></tr>`;
    });
    html += `</tbody></table></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
  }

  // estadísticas y gráfico sencillo (canvas)
  function actualizarEstadisticas(arr) {
    const total = arr.length;
    document.getElementById('statTotal').textContent = total;

    const counts = {};
    arr.forEach(r => counts[r.habitacion] = (counts[r.habitacion]||0)+1);
    const top = Object.keys(counts).sort((a,b)=> counts[b]-counts[a])[0] || '-';
    document.getElementById('statTop').textContent = top;

    dibujarBarra(counts);
  }

  function dibujarBarra(counts) {
    const canvas = document.getElementById('chartBar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvas.width,canvas.height);

    const keys = ['Simple','Doble','Matrimonial','Suite'];
    const values = keys.map(k => counts[k]||0);
    const maxVal = Math.max(...values,1);
    const padding = 36;
    const chartW = canvas.width - padding*2;
    const chartH = canvas.height - padding*2;
    const barW = (chartW / keys.length) * 0.6;
    const gap = (chartW - barW*keys.length) / Math.max(1, keys.length-1);

    ctx.font = '12px Arial';
    keys.forEach((k,i) => {
      const val = values[i];
      const barH = (val / maxVal) * chartH;
      const x = padding + i*(barW+gap);
      const y = padding + (chartH - barH);
      ctx.fillStyle = '#0077ff';
      ctx.fillRect(x, y, barW, barH);
      ctx.fillStyle = '#222';
      ctx.fillText(k, x, padding + chartH + 16);
      ctx.fillText(String(val), x, y - 6);
    });
  }
}
