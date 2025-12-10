// ================================
// Sistema Hotelero sin PHP
// - Login simulado (admin / cliente)
// - Reservas guardadas en localStorage
// - Panel admin y cliente
// ================================

// Usuarios simulados (en lugar de base de datos)
const usuarios = [
  {
    correo: "admin@elcielo.com",
    contrasena: "admin123",
    rol: "admin",
    nombre: "Administrador"
  },
  {
    correo: "cliente@elcielo.com",
    contrasena: "cliente123",
    rol: "cliente",
    nombre: "Cliente Demo"
  }
];

// Obtener usuario logueado desde localStorage
function obtenerUsuarioLogueado() {
  const data = localStorage.getItem("usuarioLogueado");
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Error leyendo usuarioLogueado:", e);
    return null;
  }
}

// Guardar usuario logueado
function guardarUsuarioLogueado(usuario) {
  localStorage.setItem("usuarioLogueado", JSON.stringify(usuario));
}

// Cerrar sesión
function cerrarSesion() {
  localStorage.removeItem("usuarioLogueado");
  alert("Sesión cerrada.");
  window.location.href = "index.html#inicio";
}

// ================================
// LOGIN
// ================================
function iniciarSesion(event) {
  event.preventDefault();

  const correo = document.getElementById("correo").value.trim();
  const contrasena = document.getElementById("Contrasena").value.trim();

  const usuario = usuarios.find(u => u.correo === correo && u.contrasena === contrasena);

  if (!usuario) {
    alert("Correo o contraseña incorrectos.");
    return;
  }

  guardarUsuarioLogueado(usuario);

  if (usuario.rol === "admin") {
    window.location.href = "panel_admin.html";
  } else {
    window.location.href = "panel_cliente.html";
  }
}

// ================================
// RESERVAS
// ================================

// Obtener todas las reservas
function obtenerReservas() {
  const data = localStorage.getItem("reservas");
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Error leyendo reservas:", e);
    return [];
  }
}

// Guardar arreglo completo de reservas
function guardarReservas(reservas) {
  localStorage.setItem("reservas", JSON.stringify(reservas));
}

// Precios según tipo de habitación (como si vinieran de la BD)
function obtenerPrecioPorDia(tipoHab) {
  if (tipoHab === "Simple") return 25;
  if (tipoHab === "Doble") return 55;
  if (tipoHab === "Familiar") return 110;
  return 0;
}

// Registrar reserva nueva
function guardarReserva(event) {
  event.preventDefault();

  const nombre   = document.getElementById("nombreReserva").value.trim();
  const correo   = document.getElementById("correoReserva").value.trim();
  const tipoHab  = document.getElementById("tipo_habitacion").value;
  const fi       = document.getElementById("fecha_ingreso").value;
  const fs       = document.getElementById("fecha_salida").value;
  const metodo   = document.getElementById("metodo_pago").value;
  const codigoOp = document.getElementById("codigo_operacion").value.trim();

  if (!nombre || !correo || !tipoHab || !fi || !fs || !metodo || !codigoOp) {
    alert("Completa todos los campos.");
    return;
  }

  const inicio = new Date(fi);
  const fin    = new Date(fs);
  const msPorDia = 1000 * 60 * 60 * 24;
  const noches = Math.round((fin - inicio) / msPorDia);

  if (isNaN(noches) || noches <= 0) {
    alert("Las fechas no son válidas.");
    return;
  }

  const precioDia = obtenerPrecioPorDia(tipoHab);
  if (precioDia <= 0) {
    alert("Tipo de habitación no válido.");
    return;
  }

  const total = noches * precioDia;

  const reservas = obtenerReservas();
  const nuevaReserva = {
    id: Date.now(),
    nombre,
    correo,
    tipoHab,
    fechaIngreso: fi,
    fechaSalida: fs,
    noches,
    precioDia,
    total,
    metodoPago: metodo,
    codigoOperacion: codigoOp,
    estado: "Pagado"
  };

  reservas.push(nuevaReserva);
  guardarReservas(reservas);

  // Mostrar resumen en la misma página
  const seccionResumen = document.getElementById("resumen-reserva");
  const detalleResumen = document.getElementById("detalle-resumen");
  if (seccionResumen && detalleResumen) {
    detalleResumen.innerHTML = `
      <p><strong>Número de reserva:</strong> ${nuevaReserva.id}</p>
      <p><strong>Huésped:</strong> ${nombre}</p>
      <p><strong>Correo:</strong> ${correo}</p>
      <p><strong>Habitación:</strong> ${tipoHab}</p>
      <p><strong>Ingreso:</strong> ${fi}</p>
      <p><strong>Salida:</strong> ${fs}</p>
      <p><strong>Noches:</strong> ${noches}</p>
      <p><strong>Total pagado:</strong> S/ ${total.toFixed(2)}</p>
      <p><strong>Método de pago:</strong> ${metodo}</p>
      <p><strong>Código de operación:</strong> ${codigoOp}</p>
      <p><strong>Estado del pago:</strong> Pagado</p>
    `;
    seccionResumen.style.display = "block";
    window.scrollTo({ top: seccionResumen.offsetTop - 80, behavior: "smooth" });
  }

  alert("Reserva registrada y pago confirmado (simulado).\nTotal: S/ " + total.toFixed(2));

  // Opcional: limpiar formulario
  // event.target.reset();
}

// ================================
// PANEL ADMIN / CLIENTE
// ================================

function cargarPanelAdmin() {
  const usuario = obtenerUsuarioLogueado();
  if (!usuario || usuario.rol !== "admin") {
    // Si no es admin, lo mandamos al login
    // (no se muestra error para no revelar info)
    return;
  }

  const spanNombre = document.getElementById("nombre-admin");
  if (spanNombre) {
    spanNombre.textContent = usuario.nombre + " (" + usuario.correo + ")";
  }

  const cuerpoTabla = document.getElementById("tabla-reservas-admin");
  if (!cuerpoTabla) return;

  const reservas = obtenerReservas();
  reservas.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.nombre}</td>
      <td>${r.correo}</td>
      <td>${r.tipoHab}</td>
      <td>${r.fechaIngreso}</td>
      <td>${r.fechaSalida}</td>
      <td>${r.noches}</td>
      <td>${r.total.toFixed(2)}</td>
      <td>${r.metodoPago}</td>
      <td>${r.codigoOperacion}</td>
      <td>${r.estado}</td>
    `;
    cuerpoTabla.appendChild(tr);
  });
}

function cargarPanelCliente() {
  const usuario = obtenerUsuarioLogueado();
  if (!usuario || usuario.rol !== "cliente") {
    return;
  }

  const spanNombre = document.getElementById("nombre-cliente");
  if (spanNombre) {
    spanNombre.textContent = usuario.nombre + " (" + usuario.correo + ")";
  }

  const cuerpoTabla = document.getElementById("tabla-reservas-cliente");
  if (!cuerpoTabla) return;

  const reservas = obtenerReservas();
  const reservasCliente = reservas.filter(r => r.correo === usuario.correo);

  reservasCliente.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.tipoHab}</td>
      <td>${r.fechaIngreso}</td>
      <td>${r.fechaSalida}</td>
      <td>${r.noches}</td>
      <td>${r.total.toFixed(2)}</td>
      <td>${r.metodoPago}</td>
      <td>${r.codigoOperacion}</td>
      <td>${r.estado}</td>
    `;
    cuerpoTabla.appendChild(tr);
  });
}

// ================================
// FORMULARIO DE CONTACTO (demo)
// ================================
function enviarContacto() {
  const nombre = document.getElementById("nombre")?.value.trim() || "";
  const correo = document.getElementById("correo")?.value.trim() || "";
  const mensaje = document.getElementById("mensaje")?.value.trim() || "";

  if (!nombre || !correo || !mensaje) {
    alert("Completa todos los campos del formulario de contacto.");
    return;
  }

  alert("Mensaje enviado (simulado).\nGracias por escribirnos, " + nombre + ".");
}

// ================================
// Inicialización por página
// ================================
document.addEventListener("DOMContentLoaded", () => {
  const ruta = window.location.pathname;

  if (ruta.endsWith("panel_admin.html")) {
    cargarPanelAdmin();
  } else if (ruta.endsWith("panel_cliente.html")) {
    cargarPanelCliente();
  }
});
