// Formatea un número como moneda (el dataset del informe está en pesos chilenos)
function formatMoney(valor) {
  return valor.toLocaleString("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
}

// Dirección base del backend, ya desplegado en Render
const API_URL = "https://app-finanzas-gbia.onrender.com/api";

// Guardamos los datos acá una vez que los leemos, para no tener que
// volver a pedirlos cada vez que cambiamos de vista
let datos = null;

function obtenerToken() {
  return localStorage.getItem("token");
}

// Todos los pedidos a rutas protegidas pasan por acá, para no repetir
// el header de Authorization en cada fetch del archivo
async function pedidoConToken(url, opciones = {}) {
  const headers = {
    ...(opciones.headers || {}),
    "Authorization": `Bearer ${obtenerToken()}`
  };

  const respuesta = await fetch(url, { ...opciones, headers });

  if (respuesta.status === 401) {
    // El token venció o es inválido: no tiene sentido seguir, deslogueamos
    cerrarSesion();
    throw new Error("Sesión expirada");
  }

  return respuesta;
}

// 1) Pedirle los datos al backend (6 rutas en paralelo) y armar
// el mismo objeto "datos" que usaba el resto de la app
async function cargarDatos() {
  const [movimientos, cuentas, objetivos, patrimonio, evolucionPatrimonio, evolucionAhorro] =
    await Promise.all([
      pedidoConToken(`${API_URL}/movimientos`).then(r => r.json()),
      pedidoConToken(`${API_URL}/cuentas`).then(r => r.json()),
      pedidoConToken(`${API_URL}/objetivos`).then(r => r.json()),
      pedidoConToken(`${API_URL}/patrimonio`).then(r => r.json()),
      pedidoConToken(`${API_URL}/patrimonio/evolucion`).then(r => r.json()),
      pedidoConToken(`${API_URL}/patrimonio/evolucion-ahorro`).then(r => r.json())
    ]);

  datos = { movimientos, cuentas, objetivos, patrimonio, evolucionPatrimonio, evolucionAhorro };
  calcularSaldosDeCuentas();
  poblarSelectCuentas();
  renderInicio();
  renderMovimientos(datos.movimientos);
  renderCuentas();
  renderObjetivosCrud();
  renderGastos();
  renderPatrimonio();
  renderChartPatrimonio();
  renderChartAhorro();

  const kpi = calcularIndicadores();
  renderIndicadores(kpi);
  renderAlertas(kpi);
  actualizarSimulador();
}

// El Excel solo trae el "saldo inicial" de cada cuenta. El saldo real
// hoy es ese saldo inicial más la suma de todos sus movimientos.
function calcularSaldosDeCuentas() {
  datos.cuentas.forEach(cuenta => {
    const movimientosDeLaCuenta = datos.movimientos.filter(m => m.cuenta === cuenta.id);
    const totalMovimientos = movimientosDeLaCuenta.reduce((suma, m) => suma + m.importe, 0);
    cuenta.saldoActual = cuenta.saldo + totalMovimientos;
  });
}

// Devuelve el mes más reciente presente en los movimientos (formato "YYYY-MM")
function ultimoMesConDatos() {
  const meses = datos.movimientos.map(m => m.fecha.slice(0, 7));
  return meses.sort().at(-1);
}

// Dado un mes ("2026-12"), devuelve sus ingresos y gastos totales
function resumenDelMes(mes) {
  const movimientosDelMes = datos.movimientos.filter(m => m.fecha.startsWith(mes));
  const ingresos = movimientosDelMes.filter(m => m.importe > 0).reduce((s, m) => s + m.importe, 0);
  const gastos = Math.abs(movimientosDelMes.filter(m => m.importe < 0).reduce((s, m) => s + m.importe, 0));
  return { ingresos, gastos };
}

// 2) Pantalla de Inicio: totales del último mes con datos + objetivos
function renderInicio() {
  const mes = ultimoMesConDatos();
  const { ingresos, gastos } = resumenDelMes(mes);

  document.getElementById("total-ingresos").textContent = formatMoney(ingresos);
  document.getElementById("total-gastos").textContent = formatMoney(gastos);
  document.getElementById("total-saldo").textContent = formatMoney(ingresos - gastos);

  const contenedorObjetivos = document.getElementById("objetivos-list");
  contenedorObjetivos.innerHTML = "";

  datos.objetivos.forEach(obj => {
    const porcentaje = Math.round((obj.acumulado / obj.meta) * 100);

    const item = document.createElement("div");
    item.className = "objetivo-item";
    item.innerHTML = `
      <div class="objetivo-top">
        <span>${obj.nombre}</span>
        <span>${formatMoney(obj.acumulado)} / ${formatMoney(obj.meta)}</span>
      </div>
      <div class="objetivo-bar-bg">
        <div class="objetivo-bar-fill" style="width: ${porcentaje}%"></div>
      </div>
    `;
    contenedorObjetivos.appendChild(item);
  });
}

// 3) Pantalla de Movimientos: tabla con todos los registros
function renderMovimientos(lista) {
  const cuerpo = document.getElementById("movimientos-body");
  cuerpo.innerHTML = "";

  lista.forEach(m => {
    const esIngreso = m.importe > 0;
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${m.fecha}</td>
      <td>${m.comercio}</td>
      <td>${m.categoria}</td>
      <td>${m.cuenta}</td>
      <td class="importe ${esIngreso ? "income" : "expense"}">${formatMoney(m.importe)}</td>
      <td class="acciones">
        <button class="btn-icono" data-accion="editar-movimiento" data-id="${m.id}">Editar</button>
        <button class="btn-icono btn-icono-borrar" data-accion="borrar-movimiento" data-id="${m.id}">Eliminar</button>
      </td>
    `;
    cuerpo.appendChild(fila);
  });
}

// 4) Pantalla de Cuentas: listado de cuentas y saldos
function renderCuentas() {
  const contenedor = document.getElementById("cuentas-list");
  contenedor.innerHTML = "";

  datos.cuentas.forEach(c => {
    const item = document.createElement("div");
    item.className = "cuenta-item";
    item.innerHTML = `
      <div>
        <div class="cuenta-nombre">${c.nombre}</div>
        <div class="cuenta-banco">${c.banco || ""}</div>
      </div>
      <div class="cuenta-item-derecha">
        <div class="card-value ${c.saldoActual >= 0 ? "income" : "expense"}">${formatMoney(c.saldoActual)}</div>
        <div class="acciones">
          <button class="btn-icono" data-accion="editar-cuenta" data-id="${c.id}">Editar</button>
          <button class="btn-icono btn-icono-borrar" data-accion="borrar-cuenta" data-id="${c.id}">Eliminar</button>
        </div>
      </div>
    `;
    contenedor.appendChild(item);
  });
}

// 4-bis) Pantalla de Objetivos: igual que en Inicio, pero con botones de gestión
function renderObjetivosCrud() {
  const contenedor = document.getElementById("objetivos-crud-list");
  contenedor.innerHTML = "";

  datos.objetivos.forEach(obj => {
    const porcentaje = Math.round((obj.acumulado / obj.meta) * 100);

    const item = document.createElement("div");
    item.className = "objetivo-item";
    item.innerHTML = `
      <div class="objetivo-top">
        <span>${obj.nombre}</span>
        <span>${formatMoney(obj.acumulado)} / ${formatMoney(obj.meta)}</span>
      </div>
      <div class="objetivo-bar-bg">
        <div class="objetivo-bar-fill" style="width: ${porcentaje}%"></div>
      </div>
      <div class="acciones">
        <button class="btn-icono" data-accion="editar-objetivo" data-id="${obj.id}">Editar</button>
        <button class="btn-icono btn-icono-borrar" data-accion="borrar-objetivo" data-id="${obj.id}">Eliminar</button>
      </div>
    `;
    contenedor.appendChild(item);
  });
}

// 5) Mapa de gastos: agrupa todos los gastos por categoría
function renderGastos() {
  const gastos = datos.movimientos.filter(m => m.importe < 0);
  const totalGastos = Math.abs(gastos.reduce((suma, m) => suma + m.importe, 0));

  // Agrupamos: para cada categoría, vamos sumando su gasto total
  const porCategoria = {};
  gastos.forEach(m => {
    const cat = m.categoria || "Sin clasificar";
    porCategoria[cat] = (porCategoria[cat] || 0) + Math.abs(m.importe);
  });

  // Pasamos el objeto agrupado a una lista y la ordenamos de mayor a menor
  const filas = Object.entries(porCategoria)
    .map(([categoria, total]) => ({
      categoria,
      total,
      porcentaje: (total / totalGastos) * 100
    }))
    .sort((a, b) => b.total - a.total);

  const contenedor = document.getElementById("gastos-list");
  contenedor.innerHTML = "";

  filas.forEach(fila => {
    const item = document.createElement("div");
    item.className = "gasto-item";
    item.innerHTML = `
      <div class="gasto-top">
        <span>${fila.categoria}</span>
        <span>${formatMoney(fila.total)} · ${fila.porcentaje.toFixed(1)}%</span>
      </div>
      <div class="gasto-bar-bg">
        <div class="gasto-bar-fill" style="width: ${fila.porcentaje}%"></div>
      </div>
    `;
    contenedor.appendChild(item);
  });
}

// 6) Patrimonio: activos, pasivos, inversiones y créditos del mes más reciente
function renderPatrimonio() {
  const p = datos.patrimonio;
  if (!p) return;

  const totalActivos = p.activos.reduce((suma, a) => suma + a.valor, 0);
  const totalInversiones = p.inversiones.reduce((suma, i) => suma + i.valor, 0);
  const totalPasivos = p.pasivos.reduce((suma, pas) => suma + pas.saldo, 0);
  const patrimonioNeto = totalActivos + totalInversiones - totalPasivos;

  document.getElementById("total-activos").textContent = formatMoney(totalActivos + totalInversiones);
  document.getElementById("total-pasivos").textContent = formatMoney(totalPasivos);
  document.getElementById("total-patrimonio").textContent = formatMoney(patrimonioNeto);

  // Activos
  const activosList = document.getElementById("activos-list");
  activosList.innerHTML = "";
  p.activos.forEach(a => {
    const item = document.createElement("div");
    item.className = "cuenta-item";
    item.innerHTML = `
      <div>
        <div class="cuenta-nombre">${a.nombre}</div>
        <div class="cuenta-banco">${a.tipo} · ${a.liquidez}</div>
      </div>
      <div class="card-value">${formatMoney(a.valor)}</div>
    `;
    activosList.appendChild(item);
  });

  // Inversiones
  const inversionesList = document.getElementById("inversiones-list");
  inversionesList.innerHTML = "";
  p.inversiones.forEach(i => {
    const rentabilidadPositiva = i.rentabilidadMes >= 0;
    const item = document.createElement("div");
    item.className = "cuenta-item";
    item.innerHTML = `
      <div>
        <div class="cuenta-nombre">${i.nombre}</div>
        <div class="cuenta-banco">${i.tipo}</div>
      </div>
      <div style="text-align:right">
        <div class="card-value">${formatMoney(i.valor)}</div>
        <div class="cuenta-banco ${rentabilidadPositiva ? "income" : "expense"}">
          ${rentabilidadPositiva ? "▲" : "▼"} ${(i.rentabilidadMes * 100).toFixed(2)}% este mes
        </div>
      </div>
    `;
    inversionesList.appendChild(item);
  });

  // Pasivos
  const pasivosList = document.getElementById("pasivos-list");
  pasivosList.innerHTML = "";
  p.pasivos.forEach(pas => {
    const item = document.createElement("div");
    item.className = "cuenta-item";
    item.innerHTML = `
      <div>
        <div class="cuenta-nombre">${pas.nombre}</div>
        <div class="cuenta-banco">${pas.tipo}</div>
      </div>
      <div class="card-value expense">${formatMoney(pas.saldo)}</div>
    `;
    pasivosList.appendChild(item);
  });

  // Créditos activos
  const creditosList = document.getElementById("creditos-list");
  creditosList.innerHTML = "";
  p.creditos.forEach(c => {
    const item = document.createElement("div");
    item.className = "cuenta-item";
    item.innerHTML = `
      <div>
        <div class="cuenta-nombre">${c.tipo} · ${c.institucion}</div>
        <div class="cuenta-banco">${c.destino} · quedan ${c.cuotasRestantes} cuotas de ${formatMoney(c.cuotaMensual)}</div>
      </div>
      <div class="card-value expense">${formatMoney(c.saldoActual)}</div>
    `;
    creditosList.appendChild(item);
  });
}

// 7) Dashboard: gráfico de patrimonio neto (barras simples, todas positivas)
function renderChartPatrimonio() {
  const serie = datos.evolucionPatrimonio.slice(-12);
  const maxValor = Math.max(...serie.map(d => d.patrimonioNeto));

  const contenedor = document.getElementById("chart-patrimonio");
  contenedor.innerHTML = "";

  serie.forEach(d => {
    const alturaPorcentaje = (d.patrimonioNeto / maxValor) * 100;
    const nombreMes = d.mes.slice(5); // "2026-12" -> "12"

    const barra = document.createElement("div");
    barra.className = "chart-bar-wrap";
    barra.innerHTML = `
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="height: ${alturaPorcentaje}%" title="${formatMoney(d.patrimonioNeto)}"></div>
      </div>
      <span class="chart-bar-label">${nombreMes}</span>
    `;
    contenedor.appendChild(barra);
  });
}

// 8) Dashboard: gráfico de ahorro neto (barras que pueden ser positivas o negativas)
function renderChartAhorro() {
  const serie = datos.evolucionAhorro.slice(-12);
  const maxAbsoluto = Math.max(...serie.map(d => Math.abs(d.ahorroNeto)));

  const contenedor = document.getElementById("chart-ahorro");
  contenedor.innerHTML = "";

  serie.forEach(d => {
    // La altura de la barra es proporcional al valor, pero crece
    // hacia arriba (positivo) o hacia abajo (negativo) desde el centro
    const alturaPorcentaje = (Math.abs(d.ahorroNeto) / maxAbsoluto) * 50;
    const esPositivo = d.ahorroNeto >= 0;
    const nombreMes = d.mes.slice(5);

    const barra = document.createElement("div");
    barra.className = "chart-bar-wrap";
    barra.innerHTML = `
      <div class="chart-diverging-track">
        <div class="chart-diverging-fill ${esPositivo ? "income" : "expense"}"
             style="height: ${alturaPorcentaje}%; ${esPositivo ? "bottom: 50%" : "top: 50%"}"
             title="${formatMoney(d.ahorroNeto)}"></div>
      </div>
      <span class="chart-bar-label">${nombreMes}</span>
    `;
    contenedor.appendChild(barra);
  });
}

// 9) Indicadores clave (KPIs) para el dashboard
function calcularIndicadores() {
  const mesActual = ultimoMesConDatos();
  const { ingresos, gastos } = resumenDelMes(mesActual);

  // Tasa de ahorro: cuánto de lo que entra, queda como ahorro
  const tasaAhorro = ((ingresos - gastos) / ingresos) * 100;

  // Presupuesto sugerido por categoría: el promedio de gasto de cada
  // categoría en los meses ANTERIORES al actual (así el mes actual
  // se compara contra "lo habitual", no contra sí mismo)
  const mesesAnteriores = [...new Set(datos.movimientos.map(m => m.fecha.slice(0, 7)))]
    .filter(m => m < mesActual);

  const gastosPorCategoriaYMes = {};
  datos.movimientos
    .filter(m => m.importe < 0 && mesesAnteriores.includes(m.fecha.slice(0, 7)))
    .forEach(m => {
      const cat = m.categoria || "Sin clasificar";
      gastosPorCategoriaYMes[cat] = gastosPorCategoriaYMes[cat] || {};
      const mes = m.fecha.slice(0, 7);
      gastosPorCategoriaYMes[cat][mes] = (gastosPorCategoriaYMes[cat][mes] || 0) + Math.abs(m.importe);
    });

  let presupuestoSugerido = 0;
  Object.values(gastosPorCategoriaYMes).forEach(porMes => {
    const valores = Object.values(porMes);
    const promedio = valores.reduce((s, v) => s + v, 0) / valores.length;
    presupuestoSugerido += promedio;
  });

  const cumplimientoPresupuesto = (gastos / presupuestoSugerido) * 100;

  // Carga financiera: cuánto de tus ingresos se van en cuotas de créditos
  const totalCuotas = datos.patrimonio.creditos.reduce((s, c) => s + c.cuotaMensual, 0);
  const cargaFinanciera = (totalCuotas / ingresos) * 100;

  // Endeudamiento: pasivos como % de activos + inversiones
  const totalActivos = datos.patrimonio.activos.reduce((s, a) => s + a.valor, 0)
    + datos.patrimonio.inversiones.reduce((s, i) => s + i.valor, 0);
  const totalPasivos = datos.patrimonio.pasivos.reduce((s, p) => s + p.saldo, 0);
  const endeudamiento = (totalPasivos / totalActivos) * 100;

  // Fondo de emergencia: meses de gasto que cubre el ahorro acumulado en ese objetivo
  const fondoEmergencia = datos.objetivos.find(o => o.nombre === "Fondo de emergencia");
  const gastoPromedio3Meses = mesesAnteriores.slice(-3)
    .reduce((s, m) => s + resumenDelMes(m).gastos, 0) / 3;
  const mesesCobertura = fondoEmergencia ? fondoEmergencia.acumulado / gastoPromedio3Meses : 0;

  return { tasaAhorro, cumplimientoPresupuesto, cargaFinanciera, endeudamiento, mesesCobertura, ingresos, gastos };
}

function renderIndicadores(kpi) {
  const items = [
    { label: "Tasa de ahorro", valor: `${kpi.tasaAhorro.toFixed(1)}%`, bien: kpi.tasaAhorro >= 0 },
    { label: "Cumplimiento de presupuesto", valor: `${kpi.cumplimientoPresupuesto.toFixed(0)}%`, bien: kpi.cumplimientoPresupuesto <= 100 },
    { label: "Carga financiera", valor: `${kpi.cargaFinanciera.toFixed(1)}%`, bien: kpi.cargaFinanciera <= 30 },
    { label: "Endeudamiento", valor: `${kpi.endeudamiento.toFixed(1)}%`, bien: kpi.endeudamiento <= 50 },
    { label: "Fondo de emergencia", valor: `${kpi.mesesCobertura.toFixed(1)} meses`, bien: kpi.mesesCobertura >= 3 }
  ];

  const contenedor = document.getElementById("kpi-cards");
  contenedor.innerHTML = "";
  items.forEach(item => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <span class="card-label">${item.label}</span>
      <span class="card-value ${item.bien ? "income" : "expense"}">${item.valor}</span>
    `;
    contenedor.appendChild(card);
  });
}

// 10) Alertas: reglas simples sobre los indicadores ya calculados
function renderAlertas(kpi) {
  const alertas = [];

  if (kpi.ingresos - kpi.gastos < 0) {
    alertas.push(`El mes cerró en déficit: gastaste ${formatMoney(kpi.gastos - kpi.ingresos)} más de lo que ingresó.`);
  }
  if (kpi.cumplimientoPresupuesto > 100) {
    alertas.push(`El gasto real superó en ${(kpi.cumplimientoPresupuesto - 100).toFixed(0)}% el promedio habitual de gasto.`);
  }
  if (kpi.cargaFinanciera > 30) {
    alertas.push(`La carga financiera (${kpi.cargaFinanciera.toFixed(1)}%) supera el 30% recomendado de los ingresos.`);
  }
  if (kpi.mesesCobertura < 3) {
    alertas.push(`El fondo de emergencia solo cubre ${kpi.mesesCobertura.toFixed(1)} meses (se recomiendan al menos 3).`);
  }

  const contenedor = document.getElementById("alertas-list");
  contenedor.innerHTML = "";

  if (alertas.length === 0) {
    contenedor.innerHTML = `<div class="alerta-item ok">Sin alertas este mes: los indicadores están dentro de rango.</div>`;
    return;
  }

  alertas.forEach(texto => {
    const item = document.createElement("div");
    item.className = "alerta-item";
    item.textContent = texto;
    contenedor.appendChild(item);
  });
}

// 11) Simulador: recalcula una proyección en base a los controles,
// sin tocar en ningún momento los movimientos originales
function actualizarSimulador() {
  const mesActual = ultimoMesConDatos();
  const { ingresos, gastos } = resumenDelMes(mesActual);

  const reduccionGastos = Number(document.getElementById("sim-reduccion-gastos").value);
  const aumentoIngresos = Number(document.getElementById("sim-aumento-ingresos").value);
  const ahorroExtra = Number(document.getElementById("sim-ahorro-extra").value);

  document.getElementById("sim-reduccion-gastos-valor").textContent = `${reduccionGastos}%`;
  document.getElementById("sim-aumento-ingresos-valor").textContent = `${aumentoIngresos}%`;
  document.getElementById("sim-ahorro-extra-valor").textContent = formatMoney(ahorroExtra);

  const ingresosProyectados = ingresos * (1 + aumentoIngresos / 100);
  const gastosProyectados = gastos * (1 - reduccionGastos / 100);
  const saldoProyectado = ingresosProyectados - gastosProyectados - ahorroExtra;
  const saldoActual = ingresos - gastos;

  document.getElementById("sim-ingresos").textContent = formatMoney(ingresosProyectados);
  document.getElementById("sim-gastos").textContent = formatMoney(gastosProyectados);
  document.getElementById("sim-saldo").textContent = formatMoney(saldoProyectado);

  const diferencia = saldoProyectado - saldoActual;
  document.getElementById("sim-comparacion").textContent =
    diferencia >= 0
      ? `Esto mejora tu saldo del mes en ${formatMoney(diferencia)} respecto de la situación real.`
      : `Ojo: con estos parámetros el saldo empeora ${formatMoney(Math.abs(diferencia))} respecto de la situación real.`;
}

function configurarSimulador() {
  ["sim-reduccion-gastos", "sim-aumento-ingresos", "sim-ahorro-extra"].forEach(id => {
    document.getElementById(id).addEventListener("input", actualizarSimulador);
  });
}

// 12) Navegación entre vistas (Inicio / Movimientos / Cuentas / Gastos)
function configurarNavegacion() {
  const links = document.querySelectorAll(".nav-link");

  links.forEach(link => {
    link.addEventListener("click", (evento) => {
      evento.preventDefault();

      // Sacar la clase "active" de todos y ponérsela solo al que se clickeó
      links.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      // Ocultar todas las vistas y mostrar solo la que corresponde
      document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
      const vista = link.getAttribute("data-view");
      document.getElementById(`view-${vista}`).classList.remove("hidden");
    });
  });
}

// 6) Buscador de movimientos por nombre de comercio
function configurarBuscador() {
  const input = document.getElementById("buscador");
  input.addEventListener("input", () => {
    const texto = input.value.toLowerCase();
    const filtrados = datos.movimientos.filter(m =>
      m.comercio.toLowerCase().includes(texto)
    );
    renderMovimientos(filtrados);
  });
}

// 13) Formulario para agregar/editar un movimiento
function poblarSelectCuentas() {
  const select = document.getElementById("f-cuenta");
  select.innerHTML = datos.cuentas
    .map(c => `<option value="${c.id}">${c.nombre}</option>`)
    .join("");
}

function abrirFormularioMovimiento(movimiento = null) {
  const form = document.getElementById("form-movimiento");
  const boton = document.getElementById("boton-guardar-movimiento");

  form.classList.remove("hidden");

  if (movimiento) {
    // Modo edición: precargamos los datos del movimiento clickeado
    document.getElementById("f-id-editando").value = movimiento.id;
    document.getElementById("f-fecha").value = movimiento.fecha;
    document.getElementById("f-comercio").value = movimiento.comercio;
    document.getElementById("f-categoria").value = movimiento.categoria;
    document.getElementById("f-subcategoria").value = movimiento.subcategoria || "";
    document.getElementById("f-cuenta").value = movimiento.cuenta;
    document.getElementById("f-medio").value = movimiento.medio || "";
    document.getElementById("f-importe").value = movimiento.importe;
    boton.textContent = "Guardar cambios";
  } else {
    // Modo creación: formulario vacío
    document.getElementById("f-id-editando").value = "";
    boton.textContent = "Guardar";
  }
}

function configurarFormularioMovimiento() {
  const form = document.getElementById("form-movimiento");
  const botonAgregar = document.getElementById("boton-agregar");
  const botonCancelar = document.getElementById("boton-cancelar");
  const errorTexto = document.getElementById("form-error");
  const cuerpoTabla = document.getElementById("movimientos-body");

  botonAgregar.addEventListener("click", () => {
    if (form.classList.contains("hidden")) {
      abrirFormularioMovimiento();
    } else {
      form.classList.add("hidden");
    }
  });

  botonCancelar.addEventListener("click", () => {
    form.reset();
    form.classList.add("hidden");
    errorTexto.classList.add("hidden");
  });

  // Un solo listener en la tabla entera: revisa QUÉ botón se clickeó
  // (así no hace falta agregar un listener a cada fila)
  cuerpoTabla.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const id = boton.dataset.id;

    if (boton.dataset.accion === "editar-movimiento") {
      const movimiento = datos.movimientos.find(m => m.id === id);
      abrirFormularioMovimiento(movimiento);
    }

    if (boton.dataset.accion === "borrar-movimiento") {
      if (!confirm(`¿Eliminar el movimiento ${id}? Esta acción no se puede deshacer.`)) return;

      const respuesta = await pedidoConToken(`${API_URL}/movimientos/${id}`, { method: "DELETE" });
      if (respuesta.ok) {
        await cargarDatos();
      } else {
        alert("No se pudo eliminar el movimiento.");
      }
    }
  });

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    errorTexto.classList.add("hidden");

    const idEditando = document.getElementById("f-id-editando").value;
    const datosMovimiento = {
      fecha: document.getElementById("f-fecha").value,
      comercio: document.getElementById("f-comercio").value,
      categoria: document.getElementById("f-categoria").value,
      subcategoria: document.getElementById("f-subcategoria").value,
      cuenta: document.getElementById("f-cuenta").value,
      medio: document.getElementById("f-medio").value,
      importe: document.getElementById("f-importe").value
    };

    // Si hay un ID cargado en el campo oculto, es una edición (PUT).
    // Si no, es un movimiento nuevo (POST).
    const esEdicion = Boolean(idEditando);
    const url = esEdicion ? `${API_URL}/movimientos/${idEditando}` : `${API_URL}/movimientos`;
    const metodo = esEdicion ? "PUT" : "POST";

    try {
      const respuesta = await pedidoConToken(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosMovimiento)
      });

      if (!respuesta.ok) {
        const error = await respuesta.json();
        errorTexto.textContent = error.error || "No se pudo guardar el movimiento.";
        errorTexto.classList.remove("hidden");
        return;
      }

      form.reset();
      form.classList.add("hidden");
      await cargarDatos();
    } catch (error) {
      errorTexto.textContent = "No se pudo conectar con el servidor.";
      errorTexto.classList.remove("hidden");
    }
  });
}

// 14) Formulario para agregar/editar/borrar una cuenta
function abrirFormularioCuenta(cuenta = null) {
  const form = document.getElementById("form-cuenta");
  const boton = document.getElementById("boton-guardar-cuenta");
  form.classList.remove("hidden");

  if (cuenta) {
    document.getElementById("c-id-editando").value = cuenta.id;
    document.getElementById("c-nombre").value = cuenta.nombre;
    document.getElementById("c-banco").value = cuenta.banco || "";
    document.getElementById("c-titular").value = cuenta.titular || "";
    document.getElementById("c-saldo").value = cuenta.saldo;
    boton.textContent = "Guardar cambios";
  } else {
    document.getElementById("c-id-editando").value = "";
    boton.textContent = "Guardar";
  }
}

function configurarFormularioCuenta() {
  const form = document.getElementById("form-cuenta");
  const botonAgregar = document.getElementById("boton-agregar-cuenta");
  const botonCancelar = document.getElementById("boton-cancelar-cuenta");
  const errorTexto = document.getElementById("form-cuenta-error");
  const lista = document.getElementById("cuentas-list");

  botonAgregar.addEventListener("click", () => {
    form.classList.contains("hidden") ? abrirFormularioCuenta() : form.classList.add("hidden");
  });

  botonCancelar.addEventListener("click", () => {
    form.reset();
    form.classList.add("hidden");
    errorTexto.classList.add("hidden");
  });

  lista.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;
    const id = boton.dataset.id;

    if (boton.dataset.accion === "editar-cuenta") {
      abrirFormularioCuenta(datos.cuentas.find(c => c.id === id));
    }

    if (boton.dataset.accion === "borrar-cuenta") {
      if (!confirm(`¿Eliminar la cuenta ${id}? Los movimientos asociados no se borran solos.`)) return;
      const respuesta = await pedidoConToken(`${API_URL}/cuentas/${id}`, { method: "DELETE" });
      if (respuesta.ok) {
        await cargarDatos();
      } else {
        alert("No se pudo eliminar la cuenta.");
      }
    }
  });

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    errorTexto.classList.add("hidden");

    const idEditando = document.getElementById("c-id-editando").value;
    const datosCuenta = {
      id: idEditando || undefined, // solo se usa al crear
      nombre: document.getElementById("c-nombre").value,
      banco: document.getElementById("c-banco").value,
      titular: document.getElementById("c-titular").value,
      saldo: document.getElementById("c-saldo").value
    };

    const esEdicion = Boolean(idEditando);
    const url = esEdicion ? `${API_URL}/cuentas/${idEditando}` : `${API_URL}/cuentas`;
    const metodo = esEdicion ? "PUT" : "POST";

    try {
      const respuesta = await pedidoConToken(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosCuenta)
      });

      if (!respuesta.ok) {
        const error = await respuesta.json();
        errorTexto.textContent = error.error || "No se pudo guardar la cuenta.";
        errorTexto.classList.remove("hidden");
        return;
      }

      form.reset();
      form.classList.add("hidden");
      await cargarDatos();
    } catch (error) {
      errorTexto.textContent = "No se pudo conectar con el servidor.";
      errorTexto.classList.remove("hidden");
    }
  });
}

// 15) Formulario para agregar/editar/borrar un objetivo
function abrirFormularioObjetivo(objetivo = null) {
  const form = document.getElementById("form-objetivo");
  const boton = document.getElementById("boton-guardar-objetivo");
  form.classList.remove("hidden");

  if (objetivo) {
    document.getElementById("o-id-editando").value = objetivo.id;
    document.getElementById("o-nombre").value = objetivo.nombre;
    document.getElementById("o-meta").value = objetivo.meta;
    document.getElementById("o-acumulado").value = objetivo.acumulado;
    boton.textContent = "Guardar cambios";
  } else {
    document.getElementById("o-id-editando").value = "";
    document.getElementById("o-acumulado").value = 0;
    boton.textContent = "Guardar";
  }
}

function configurarFormularioObjetivo() {
  const form = document.getElementById("form-objetivo");
  const botonAgregar = document.getElementById("boton-agregar-objetivo");
  const botonCancelar = document.getElementById("boton-cancelar-objetivo");
  const errorTexto = document.getElementById("form-objetivo-error");
  const lista = document.getElementById("objetivos-crud-list");

  botonAgregar.addEventListener("click", () => {
    form.classList.contains("hidden") ? abrirFormularioObjetivo() : form.classList.add("hidden");
  });

  botonCancelar.addEventListener("click", () => {
    form.reset();
    form.classList.add("hidden");
    errorTexto.classList.add("hidden");
  });

  lista.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;
    const id = boton.dataset.id;

    if (boton.dataset.accion === "editar-objetivo") {
      abrirFormularioObjetivo(datos.objetivos.find(o => o.id === id));
    }

    if (boton.dataset.accion === "borrar-objetivo") {
      if (!confirm(`¿Eliminar el objetivo ${id}?`)) return;
      const respuesta = await pedidoConToken(`${API_URL}/objetivos/${id}`, { method: "DELETE" });
      if (respuesta.ok) {
        await cargarDatos();
      } else {
        alert("No se pudo eliminar el objetivo.");
      }
    }
  });

  form.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    errorTexto.classList.add("hidden");

    const idEditando = document.getElementById("o-id-editando").value;
    const datosObjetivo = {
      nombre: document.getElementById("o-nombre").value,
      meta: document.getElementById("o-meta").value,
      acumulado: document.getElementById("o-acumulado").value
    };

    const esEdicion = Boolean(idEditando);
    const url = esEdicion ? `${API_URL}/objetivos/${idEditando}` : `${API_URL}/objetivos`;
    const metodo = esEdicion ? "PUT" : "POST";

    try {
      const respuesta = await pedidoConToken(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosObjetivo)
      });

      if (!respuesta.ok) {
        const error = await respuesta.json();
        errorTexto.textContent = error.error || "No se pudo guardar el objetivo.";
        errorTexto.classList.remove("hidden");
        return;
      }

      form.reset();
      form.classList.add("hidden");
      await cargarDatos();
    } catch (error) {
      errorTexto.textContent = "No se pudo conectar con el servidor.";
      errorTexto.classList.remove("hidden");
    }
  });
}

// 16) Login, registro y logout
function mostrarApp() {
  document.getElementById("pantalla-login").classList.add("hidden");
  document.getElementById("app-principal").classList.remove("hidden");
}

function mostrarLogin() {
  document.getElementById("pantalla-login").classList.remove("hidden");
  document.getElementById("app-principal").classList.add("hidden");
}

function cerrarSesion() {
  localStorage.removeItem("token");
  datos = null;
  mostrarLogin();
}

function configurarLogin() {
  const formLogin = document.getElementById("form-login");
  const formRegistro = document.getElementById("form-registro");
  const botonMostrarRegistro = document.getElementById("boton-mostrar-registro");
  const errorTexto = document.getElementById("login-error");
  const botonLogout = document.getElementById("boton-logout");

  botonMostrarRegistro.addEventListener("click", () => {
    const mostrandoRegistro = !formRegistro.classList.contains("hidden");
    formRegistro.classList.toggle("hidden");
    formLogin.classList.toggle("hidden");
    botonMostrarRegistro.textContent = mostrandoRegistro
      ? "¿No tenés cuenta? Creá una"
      : "¿Ya tenés cuenta? Iniciá sesión";
    errorTexto.classList.add("hidden");
  });

  formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    errorTexto.classList.add("hidden");

    const usuario = document.getElementById("login-usuario").value;
    const password = document.getElementById("login-password").value;

    try {
      // Este fetch va SIN token, porque todavía no tenemos uno
      const respuesta = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password })
      });

      const datosRespuesta = await respuesta.json();

      if (!respuesta.ok) {
        errorTexto.textContent = datosRespuesta.error || "No se pudo iniciar sesión.";
        errorTexto.classList.remove("hidden");
        return;
      }

      localStorage.setItem("token", datosRespuesta.token);
      formLogin.reset();
      mostrarApp();
      await cargarDatos();
    } catch (error) {
      errorTexto.textContent = "No se pudo conectar con el servidor.";
      errorTexto.classList.remove("hidden");
    }
  });

  formRegistro.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    errorTexto.classList.add("hidden");

    const usuario = document.getElementById("registro-usuario").value;
    const password = document.getElementById("registro-password").value;

    try {
      const respuesta = await fetch(`${API_URL}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, password })
      });

      const datosRespuesta = await respuesta.json();

      if (!respuesta.ok) {
        errorTexto.textContent = datosRespuesta.error || "No se pudo crear el usuario.";
        errorTexto.classList.remove("hidden");
        return;
      }

      // Cuenta creada: volvemos al formulario de login con el usuario precargado
      formRegistro.reset();
      formRegistro.classList.add("hidden");
      formLogin.classList.remove("hidden");
      botonMostrarRegistro.textContent = "¿No tenés cuenta? Creá una";
      document.getElementById("login-usuario").value = usuario;
      errorTexto.classList.remove("hidden");
      errorTexto.style.color = "var(--accent)";
      errorTexto.textContent = "Cuenta creada. Ya podés iniciar sesión.";
    } catch (error) {
      errorTexto.textContent = "No se pudo conectar con el servidor.";
      errorTexto.classList.remove("hidden");
    }
  });

  botonLogout.addEventListener("click", cerrarSesion);
}

// Arrancamos todo cuando el HTML terminó de cargar
document.addEventListener("DOMContentLoaded", () => {
  configurarNavegacion();
  configurarBuscador();
  configurarSimulador();
  configurarFormularioMovimiento();
  configurarFormularioCuenta();
  configurarFormularioObjetivo();
  configurarLogin();

  // Solo pedimos los datos si ya había una sesión iniciada antes
  if (obtenerToken()) {
    mostrarApp();
    cargarDatos();
  } else {
    mostrarLogin();
  }
});
