/**
 * MisAhorros - Lógica de la aplicación
 * Delta Retorno Real (Clase A)
 */

// CONFIGURACIÓN DE LA API
const API_URL_BASE = 'https://api.argentinadatos.com/v1/finanzas/fci/rentaFija';
const FUND_NAME = 'Delta Retorno Real - Clase A';

// ESTADO GLOBAL DE LA APP
let state = {
    subscriptions: [],          // Historial de suscripciones cargadas
    currentCotizacion: 0,       // Cotización actual del fondo (último cierre)
    currentFechaCierre: '',     // Fecha del último cierre del fondo
    currentVarDiaria: null,      // Variación diaria calculada
    chartInstance: null         // Instancia del gráfico Chart.js
};

// SELECTORES DOM
const dom = {
    apiStatusBox: document.getElementById('api-status-box'),
    apiStatusDot: document.getElementById('api-status-dot'),
    apiStatusText: document.getElementById('api-status-text'),
    
    fundCotizacion: document.getElementById('fund-cotizacion'),
    fundFechaCierre: document.getElementById('fund-fecha-cierre'),
    fundVarDiaria: document.getElementById('fund-var-diaria'),
    
    subscriptionForm: document.getElementById('subscription-form'),
    inputDate: document.getElementById('input-date'),
    inputAmount: document.getElementById('input-amount'),
    checkManualCuotapartes: document.getElementById('check-manual-cuotapartes'),
    cuotapartesGroup: document.getElementById('cuotapartes-group'),
    inputCuotapartes: document.getElementById('input-cuotapartes'),
    btnSubmitForm: document.getElementById('btn-submit-form'),
    formLoader: document.getElementById('form-loader'),
    formLoaderText: document.getElementById('form-loader-text'),
    
    valCapitalInvertido: document.getElementById('val-capital-invertido'),
    valTotalSuscripciones: document.getElementById('val-total-suscripciones'),
    valTenenciaValorizada: document.getElementById('val-tenencia-valorizada'),
    valTotalCuotapartes: document.getElementById('val-total-cuotapartes'),
    metricGananciaBox: document.getElementById('metric-ganancia-box'),
    metricGananciaIcon: document.getElementById('metric-ganancia-icon'),
    valGananciaNeta: document.getElementById('val-ganancia-neta'),
    valGananciaPorcentaje: document.getElementById('val-ganancia-porcentaje'),
    
    chartPlaceholder: document.getElementById('chart-placeholder-msg'),
    searchInput: document.getElementById('search-input'),
    tableBody: document.getElementById('table-body'),
    tableEmptyMsg: document.getElementById('table-empty-msg'),
    
    btnExportData: document.getElementById('btn-export-data'),
    btnImportData: document.getElementById('btn-import-data'),
    fileImportInput: document.getElementById('file-import-input'),
    
    modalContainer: document.getElementById('modal-container'),
    modalTitle: document.getElementById('modal-title'),
    modalBodyContent: document.getElementById('modal-body-content'),
    btnModalClose: document.getElementById('btn-modal-close'),
    btnModalConfirm: document.getElementById('btn-modal-confirm')
};

// FORMATOS Y UTILIDADES
const formatARS = (value) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const formatCotizacion = (value) => {
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
    }).format(value);
};

const formatCuotapartes = (value) => {
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
    }).format(value);
};

const formatPercentage = (value) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
};

const formatDateToLocale = (dateStr) => {
    // Convierte YYYY-MM-DD a DD/MM/YYYY
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

// MOSTRAR MODAL ALERTA
const showAlert = (title, message) => {
    dom.modalTitle.innerText = title;
    dom.modalBodyContent.innerHTML = `<p>${message}</p>`;
    dom.modalContainer.classList.remove('hidden');
};

// INICIALIZACIÓN DE LA APLICACIÓN
document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar datos guardados en LocalStorage
    loadLocalStorageData();
    
    // 2. Establecer fecha por defecto en el formulario (hoy)
    const localToday = new Date();
    // Ajustar a zona horaria local de Argentina
    const year = localToday.getFullYear();
    const month = String(localToday.getMonth() + 1).padStart(2, '0');
    const day = String(localToday.getDate()).padStart(2, '0');
    dom.inputDate.value = `${year}-${month}-${day}`;
    // Limitar la fecha a hoy (no permitir fechas futuras)
    dom.inputDate.max = `${year}-${month}-${day}`;
    
    // 3. Registrar Event Listeners
    setupEventListeners();
    
    // 4. Conectar con la API para traer cotización actual
    fetchCurrentCotizacion();
});

// EVENT LISTENERS
const setupEventListeners = () => {
    // Checkbox de cuotapartes manuales
    dom.checkManualCuotapartes.addEventListener('change', (e) => {
        if (e.target.checked) {
            dom.cuotapartesGroup.classList.remove('hidden');
            dom.inputCuotapartes.required = true;
        } else {
            dom.cuotapartesGroup.classList.add('hidden');
            dom.inputCuotapartes.required = false;
            dom.inputCuotapartes.value = '';
        }
    });
    
    // Envío del Formulario
    dom.subscriptionForm.addEventListener('submit', handleFormSubmit);
    
    // Buscador en la tabla
    dom.searchInput.addEventListener('input', (e) => {
        renderMovementsTable(e.target.value);
    });
    
    // Exportar Datos
    dom.btnExportData.addEventListener('click', exportDataToJSON);
    
    // Importar Datos (disparar input file)
    dom.btnImportData.addEventListener('click', () => {
        dom.fileImportInput.click();
    });
    
    dom.fileImportInput.addEventListener('change', importDataFromJSON);
    
    // Cerrar Modal
    dom.btnModalClose.addEventListener('click', () => {
        dom.modalContainer.classList.add('hidden');
    });
    dom.btnModalConfirm.addEventListener('click', () => {
        dom.modalContainer.classList.add('hidden');
    });
    
    // Cerrar modal haciendo click fuera
    dom.modalContainer.addEventListener('click', (e) => {
        if (e.target === dom.modalContainer) {
            dom.modalContainer.classList.add('hidden');
        }
    });
};

// FETCH COTIZACIÓN ACTUAL Y ANTERIOR (API)
const fetchCurrentCotizacion = async () => {
    setApiStatus('loading', 'Consultando cotización de cierre...');
    
    try {
        // 1. Obtener última cotización
        const responseUltimo = await fetch(`${API_URL_BASE}/ultimo`);
        if (!responseUltimo.ok) throw new Error('Error al conectar con la API de ArgentinaDatos');
        
        const dataUltimo = await responseUltimo.json();
        const fundUltimo = dataUltimo.find(f => f.fondo === FUND_NAME);
        
        if (!fundUltimo) {
            throw new Error(`No se encontró el fondo "${FUND_NAME}" en el último cierre.`);
        }
        
        state.currentCotizacion = fundUltimo.vcp / 1000;
        state.currentFechaCierre = fundUltimo.fecha;
        
        // Guardar en cache por las dudas
        localStorage.setItem('mis_ahorros_last_cotizacion', state.currentCotizacion);
        localStorage.setItem('mis_ahorros_last_fecha', state.currentFechaCierre);

        // 2. Intentar obtener penúltima cotización para calcular variación diaria
        try {
            const responsePenultimo = await fetch(`${API_URL_BASE}/penultimo`);
            if (responsePenultimo.ok) {
                const dataPenultimo = await responsePenultimo.json();
                const fundPenultimo = dataPenultimo.find(f => f.fondo === FUND_NAME);
                if (fundPenultimo && fundPenultimo.vcp) {
                    const vcpPenultimo = fundPenultimo.vcp / 1000;
                    state.currentVarDiaria = ((state.currentCotizacion - vcpPenultimo) / vcpPenultimo) * 100;
                }
            }
        } catch (err) {
            console.warn('No se pudo calcular la variación diaria:', err.message);
        }
        
        setApiStatus('success', 'API Conectada');
        updateFundInfoUI();
        recalculateAndRender();
        
    } catch (error) {
        console.error(error);
        
        // Cargar desde cache local si la API falla
        const cachedCotizacion = localStorage.getItem('mis_ahorros_last_cotizacion');
        const cachedFecha = localStorage.getItem('mis_ahorros_last_fecha');
        
        if (cachedCotizacion) {
            state.currentCotizacion = parseFloat(cachedCotizacion);
            state.currentFechaCierre = cachedFecha || 'Desconocida';
            setApiStatus('error', 'API caídas (Cargado Caché)');
            updateFundInfoUI();
            recalculateAndRender();
        } else {
            setApiStatus('error', 'Error de conexión');
            showAlert('Error de Red', 'No pudimos conectar con la API de cotizaciones y no hay datos guardados en caché. Se usará una cotización provisoria de $103,869968 para estimaciones.');
            state.currentCotizacion = 103.869968;
            state.currentFechaCierre = '---';
            updateFundInfoUI();
            recalculateAndRender();
        }
    }
};

// MANEJAR EL ESTADO VISUAL DE LA API
const setApiStatus = (type, message) => {
    dom.apiStatusDot.className = 'status-dot'; // Reset
    
    if (type === 'loading') {
        dom.apiStatusDot.classList.add('loading', 'pulsing');
        dom.apiStatusText.innerText = message;
    } else if (type === 'success') {
        dom.apiStatusDot.classList.add('success');
        dom.apiStatusText.innerText = message;
    } else if (type === 'error') {
        dom.apiStatusDot.classList.add('error');
        dom.apiStatusText.innerText = message;
    }
};

// ACTUALIZAR WIDGET DE INFO DEL FONDO
const updateFundInfoUI = () => {
    dom.fundCotizacion.innerText = formatCotizacion(state.currentCotizacion);
    dom.fundFechaCierre.innerText = formatDateToLocale(state.currentFechaCierre);
    
    if (state.currentVarDiaria !== null) {
        dom.fundVarDiaria.innerText = formatPercentage(state.currentVarDiaria);
        dom.fundVarDiaria.className = 'fund-metric-value'; // Reset
        if (state.currentVarDiaria >= 0) {
            dom.fundVarDiaria.classList.add('positive');
        } else {
            dom.fundVarDiaria.classList.add('negative');
        }
    } else {
        dom.fundVarDiaria.innerText = '---';
        dom.fundVarDiaria.className = 'fund-metric-value';
    }
};

// LOGICA DE SUBMIT DEL FORMULARIO
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const dateInputVal = dom.inputDate.value;
    const amountVal = parseFloat(dom.inputAmount.value);
    const isManual = dom.checkManualCuotapartes.checked;
    
    if (!dateInputVal || isNaN(amountVal) || amountVal <= 0) {
        showAlert('Campos Inválidos', 'Por favor, ingresá una fecha y un importe válido.');
        return;
    }
    
    // Si carga manual está activo
    if (isManual) {
        const cuotapartesVal = parseFloat(dom.inputCuotapartes.value);
        if (isNaN(cuotapartesVal) || cuotapartesVal <= 0) {
            showAlert('Cantidad Inválida', 'Por favor, ingresá una cantidad de cuotapartes válida.');
            return;
        }
        
        const cotizacionCalculada = amountVal / cuotapartesVal;
        
        const newSubscription = {
            id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            date: dateInputVal,
            amount: amountVal,
            cuotapartes: cuotapartesVal,
            cotizacion: cotizacionCalculada,
            manual: true
        };
        
        saveNewSubscription(newSubscription);
        resetForm();
        return;
    }
    
    // Si la cotización es automática (Opción A)
    showFormLoader(true, 'Buscando cotización histórica de esa fecha...');
    
    try {
        // Formatear fecha para la API: YYYY/MM/DD
        const formattedDate = dateInputVal.replace(/-/g, '/');
        const url = `${API_URL_BASE}/${formattedDate}`;
        
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        
        const data = await res.json();
        const fundOnDate = data.find(f => f.fondo === FUND_NAME);
        
        if (!fundOnDate || !fundOnDate.vcp) {
            throw new Error('No se encontró cotización para ese fondo en la fecha provista.');
        }
        
        const historicalCotizacion = fundOnDate.vcp / 1000;
        const calculatedCuotapartes = amountVal / historicalCotizacion;
        
        const newSubscription = {
            id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            date: dateInputVal,
            amount: amountVal,
            cuotapartes: calculatedCuotapartes,
            cotizacion: historicalCotizacion,
            manual: false
        };
        
        saveNewSubscription(newSubscription);
        resetForm();
        
    } catch (err) {
        console.error(err);
        showFormLoader(false);
        
        // ACTIVAR EL SMART FALLBACK
        showAlert(
            'Cotización No Encontrada', 
            `No pudimos obtener la cotización automática para el <b>${formatDateToLocale(dateInputVal)}</b>.<br><br>` + 
            `<b>¿Por qué ocurre esto?</b><br>` + 
            `• Fines de semana o feriados sin actividad financiera.<br>` + 
            `• Datos incompletos en la API para esa fecha específica.<br><br>` + 
            `<b>¿Cómo proceder?</b><br>` + 
            `Hemos activado el ingreso manual. Por favor, ingresá la cantidad de cuotapartes exacta que figura en tu comprobante.`
        );
        
        // Habilitar checkbox manual y campo
        dom.checkManualCuotapartes.checked = true;
        dom.cuotapartesGroup.classList.remove('hidden');
        dom.inputCuotapartes.required = true;
        dom.inputCuotapartes.focus();
    }
}

// CONTROL DE SPINNER EN FORMULARIO
const showFormLoader = (show, text = '') => {
    if (show) {
        dom.formLoaderText.innerText = text;
        dom.formLoader.classList.remove('hidden');
        dom.btnSubmitForm.disabled = true;
    } else {
        dom.formLoader.classList.add('hidden');
        dom.btnSubmitForm.disabled = false;
    }
};

// RESETEAR FORMULARIO A VALORES BASE
const resetForm = () => {
    showFormLoader(false);
    dom.inputAmount.value = '';
    dom.inputCuotapartes.value = '';
    
    // Resetear checkbox manual
    dom.checkManualCuotapartes.checked = false;
    dom.cuotapartesGroup.classList.add('hidden');
    dom.inputCuotapartes.required = false;
    
    // Mantener la fecha de hoy por defecto
    const localToday = new Date();
    const year = localToday.getFullYear();
    const month = String(localToday.getMonth() + 1).padStart(2, '0');
    const day = String(localToday.getDate()).padStart(2, '0');
    dom.inputDate.value = `${year}-${month}-${day}`;
};

// GUARDAR SUBSCRIPCIÓN Y ACTUALIZAR
const saveNewSubscription = (newSub) => {
    state.subscriptions.push(newSub);
    // Ordenar de nuevo cronológicamente por fecha
    state.subscriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    saveLocalStorageData();
    recalculateAndRender();
};

// ELIMINAR SUBSCRIPCIÓN
const deleteSubscription = (id) => {
    state.subscriptions = state.subscriptions.filter(s => s.id !== id);
    saveLocalStorageData();
    recalculateAndRender();
};

// GUARDAR Y CARGAR DESDE LOCALSTORAGE
const saveLocalStorageData = () => {
    localStorage.setItem('mis_ahorros_subscriptions', JSON.stringify(state.subscriptions));
};

const loadLocalStorageData = () => {
    const rawData = localStorage.getItem('mis_ahorros_subscriptions');
    if (rawData) {
        try {
            state.subscriptions = JSON.parse(rawData);
            // Ordenar desc por fecha
            state.subscriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (e) {
            console.error('Error cargando datos de LocalStorage:', e);
            state.subscriptions = [];
        }
    } else {
        state.subscriptions = [];
    }
};

// RECALCULAR MÉTRICAS Y VOLVER A RENDERIZAR
const recalculateAndRender = () => {
    // 1. Cálculos de métricas totales
    const capitalTotal = state.subscriptions.reduce((sum, s) => sum + s.amount, 0);
    const cuotapartesTotales = state.subscriptions.reduce((sum, s) => sum + s.cuotapartes, 0);
    const tenenciaValorizada = cuotapartesTotales * state.currentCotizacion;
    const gananciaNeta = tenenciaValorizada - capitalTotal;
    const gananciaPorcentaje = capitalTotal > 0 ? (gananciaNeta / capitalTotal) * 100 : 0;
    
    // 2. Renderizar métricas en la interfaz
    dom.valCapitalInvertido.innerText = formatARS(capitalTotal);
    dom.valTotalSuscripciones.innerText = `${state.subscriptions.length} suscripción/es`;
    
    dom.valTenenciaValorizada.innerText = formatARS(tenenciaValorizada);
    dom.valTotalCuotapartes.innerText = `${formatCuotapartes(cuotapartesTotales)} cuotapartes`;
    
    dom.valGananciaNeta.innerText = formatARS(gananciaNeta);
    dom.valGananciaPorcentaje.innerText = formatPercentage(gananciaPorcentaje) + ' de retorno';
    
    // Aplicar estilos de ganancia/pérdida
    dom.metricGananciaBox.className = 'card glass-card metric-card'; // Reset
    dom.metricGananciaIcon.className = 'metric-icon'; // Reset
    
    if (gananciaNeta >= 0) {
        dom.metricGananciaBox.classList.add('border-left-green');
        dom.metricGananciaIcon.classList.add('bg-soft-green');
        dom.metricGananciaIcon.innerHTML = '<i class="fa-solid fa-arrow-trend-up"></i>';
    } else {
        dom.metricGananciaBox.classList.add('border-left-red');
        dom.metricGananciaIcon.classList.add('bg-soft-red');
        dom.metricGananciaIcon.innerHTML = '<i class="fa-solid fa-arrow-trend-down"></i>';
    }
    
    // 3. Renderizar la tabla de movimientos
    renderMovementsTable();
    
    // 4. Renderizar o actualizar el gráfico de evolución
    renderChart(capitalTotal, cuotapartesTotales, tenenciaValorizada);
};

// RENDERIZAR TABLA DE MOVIMIENTOS
const renderMovementsTable = (searchTerm = '') => {
    dom.tableBody.innerHTML = '';
    
    const term = searchTerm.toLowerCase().trim();
    const filteredMovements = state.subscriptions.filter(s => {
        if (!term) return true;
        const formattedDate = formatDateToLocale(s.date);
        return s.date.includes(term) || 
               formattedDate.includes(term) || 
               s.amount.toString().includes(term) ||
               s.cuotapartes.toString().includes(term);
    });
    
    if (filteredMovements.length === 0) {
        dom.tableEmptyMsg.classList.remove('hidden');
        return;
    }
    
    dom.tableEmptyMsg.classList.add('hidden');
    
    filteredMovements.forEach(s => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td><strong>${formatDateToLocale(s.date)}</strong></td>
            <td>Delta Retorno Real</td>
            <td><span class="status-dot success"></span> Suscripción ${s.manual ? '<small style="color:var(--text-muted)">(Manual)</small>' : ''}</td>
            <td class="text-right font-weight-bold" style="font-weight: 600;">${formatARS(s.amount)}</td>
            <td class="text-right text-muted">${formatCotizacion(s.cotizacion)}</td>
            <td class="text-right">${formatCuotapartes(s.cuotapartes)}</td>
            <td class="text-center">
                <button class="btn-danger-icon btn-delete-row" data-id="${s.id}" title="Eliminar movimiento">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        
        dom.tableBody.appendChild(tr);
    });
    
    // Agregar event listeners a los botones de borrar fila
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const sub = state.subscriptions.find(s => s.id === id);
            if (sub && confirm(`¿Estás seguro de eliminar el movimiento del ${formatDateToLocale(sub.date)} por ${formatARS(sub.amount)}?`)) {
                deleteSubscription(id);
            }
        });
    });
};

// RENDERIZAR O ACTUALIZAR GRÁFICO (Chart.js)
const renderChart = (totalCapital, totalCuotapartes, currentValuation) => {
    // Si no hay datos, mostrar placeholder del gráfico
    if (state.subscriptions.length === 0) {
        dom.chartPlaceholder.classList.remove('hidden');
        if (state.chartInstance) {
            state.chartInstance.destroy();
            state.chartInstance = null;
        }
        return;
    }
    
    dom.chartPlaceholder.classList.add('hidden');
    
    // Ordenar suscripciones de más vieja a más nueva para trazar la línea cronológica
    const chronSub = [...state.subscriptions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Agrupar por fechas
    const dataPoints = [];
    let accumCapital = 0;
    let accumCuotapartes = 0;
    
    chronSub.forEach(s => {
        accumCapital += s.amount;
        accumCuotapartes += s.cuotapartes;
        
        // La tenencia valorizada histórica en esta fecha se calcula en base a la cotización registrada ese día
        const valuationOnDate = accumCuotapartes * s.cotizacion;
        
        // Si ya hay un data point en la misma fecha (ej: múltiples cargas el mismo día), lo actualizamos
        const existingPoint = dataPoints.find(dp => dp.date === s.date);
        if (existingPoint) {
            existingPoint.capital = accumCapital;
            existingPoint.cuotapartes = accumCuotapartes;
            existingPoint.valuation = valuationOnDate;
        } else {
            dataPoints.push({
                date: s.date,
                capital: accumCapital,
                cuotapartes: accumCuotapartes,
                valuation: valuationOnDate
            });
        }
    });
    
    // 3. Añadir el punto actual (hoy) para cerrar el gráfico en la cotización vigente
    const latestDateInSubs = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].date : '';
    const apiCloseDate = state.currentFechaCierre || new Date().toISOString().split('T')[0];
    
    // Añadimos solo si la fecha del cierre de la API es posterior a la última suscripción
    if (latestDateInSubs && new Date(apiCloseDate) > new Date(latestDateInSubs)) {
        dataPoints.push({
            date: apiCloseDate,
            capital: totalCapital,
            cuotapartes: totalCuotapartes,
            valuation: currentValuation
        });
    } else if (dataPoints.length > 0) {
        // Si la cotización actual es del mismo día o anterior, actualizamos la última valuación con la cotización de la API
        dataPoints[dataPoints.length - 1].valuation = currentValuation;
    }
    
    // Preparar arrays para el gráfico
    const labels = dataPoints.map(dp => formatDateToLocale(dp.date));
    const capitalData = dataPoints.map(dp => dp.capital);
    const valuationData = dataPoints.map(dp => dp.valuation);
    
    // Configuración de Chart.js
    const ctx = document.getElementById('savings-chart').getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (state.chartInstance) {
        state.chartInstance.destroy();
    }
    
    // Gradiente para Capital Invertido
    const gradCapital = ctx.createLinearGradient(0, 0, 0, 300);
    gradCapital.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
    gradCapital.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    
    // Gradiente para Tenencia Valorizada
    const gradTenencia = ctx.createLinearGradient(0, 0, 0, 300);
    gradTenencia.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    gradTenencia.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
    
    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Tenencia Valorizada',
                    data: valuationData,
                    borderColor: '#a855f7',
                    borderWidth: 3,
                    backgroundColor: gradTenencia,
                    fill: true,
                    tension: 0.2,
                    pointBackgroundColor: '#a855f7',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    label: 'Capital Invertido',
                    data: capitalData,
                    borderColor: '#3b82f6',
                    borderWidth: 2.5,
                    borderDash: [5, 5],
                    backgroundColor: gradCapital,
                    fill: true,
                    tension: 0.1,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 3,
                    pointHoverRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false // Oculto porque usamos leyenda HTML customizada
                },
                tooltip: {
                    backgroundColor: '#121923',
                    titleFont: { family: 'Outfit', size: 13, weight: '600' },
                    bodyFont: { family: 'Outfit', size: 12 },
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += formatARS(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.04)',
                        drawTicks: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Outfit', size: 10 },
                        maxRotation: 45,
                        autoSkip: true,
                        maxTicksLimit: 10
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.04)',
                        drawTicks: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: { family: 'Outfit', size: 10 },
                        callback: function(value) {
                            if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
                            if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'k';
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
};

// EXPORTAR DATOS JSON
function exportDataToJSON() {
    if (state.subscriptions.length === 0) {
        showAlert('Sin Datos', 'No hay movimientos para exportar.');
        return;
    }
    
    const dataStr = JSON.stringify(state.subscriptions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const today = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `MisAhorros_Backup_${today}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// IMPORTAR DATOS JSON
function importDataFromJSON(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const importedData = JSON.parse(evt.target.result);
            
            // Validación básica de los datos
            if (!Array.isArray(importedData)) {
                throw new Error('El archivo JSON debe contener un arreglo de suscripciones.');
            }
            
            const isValid = importedData.every(item => {
                return item.id && 
                       item.date && 
                       typeof item.amount === 'number' && 
                       typeof item.cuotapartes === 'number' && 
                       typeof item.cotizacion === 'number';
            });
            
            if (!isValid) {
                throw new Error('El formato de los elementos dentro del archivo es inválido.');
            }
            
            if (confirm(`Se detectaron ${importedData.length} movimientos. ¿Deseas sobreescribir tus movimientos actuales con esta copia de seguridad?`)) {
                state.subscriptions = importedData;
                state.subscriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
                saveLocalStorageData();
                recalculateAndRender();
                showAlert('Importación Exitosa', `Se cargaron con éxito ${importedData.length} movimientos.`);
            }
            
        } catch (err) {
            showAlert('Archivo Inválido', `No se pudo importar la copia de seguridad: ${err.message}`);
        }
        // Limpiar el input file
        dom.fileImportInput.value = '';
    };
    reader.readAsText(file);
}
