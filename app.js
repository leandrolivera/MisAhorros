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
    chartInstance: null,         // Instancia del gráfico Chart.js
    plazoFijoRates: [],          // Serie histórica de tasas plazo fijo
    dolarBlueRates: [],          // Serie histórica del dólar blue
    naranjaxTnaCurrent: 0.18,    // Tasa actual de Naranja X (18% por defecto)
    ratesFetched: false,         // Flag para indicar si se cargaron las tasas de PF
    dolarFetched: false,         // Flag para indicar si se cargaron las tasas del dólar
    editingId: null,             // ID del movimiento que se está editando
    activeInvestments: {         // Filtro de visibilidad para cada tipo de inversión
        capital: true,
        delta: true,
        plazofijo: true,
        plazofijouva: true,
        mercadopago: true,
        naranjax: true,
        dolar: true
    },
    deltaHistory: [],            // Historial de cotizaciones de Delta
    inflation: {},               // Inflación mensual INDEC { 'YYYY-MM': % }
    uvaRates: []                 // Serie diaria de la UVA
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
    textSubmitForm: document.getElementById('text-submit-form'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    formLoader: document.getElementById('form-loader'),
    formLoaderText: document.getElementById('form-loader-text'),
    
    valCapitalInvertido: document.getElementById('val-capital-invertido'),
    valTotalSuscripciones: document.getElementById('val-total-suscripciones'),
    valTenenciaValorizada: document.getElementById('val-tenencia-valorizada'),
    valTotalCuotapartes: document.getElementById('val-total-cuotapartes'),
    metricGananciaBox: document.getElementById('card-ganancia'),
    metricGananciaIcon: document.getElementById('metric-ganancia-icon'),
    valGananciaNeta: document.getElementById('val-ganancia-neta'),
    valGananciaPorcentaje: document.getElementById('val-ganancia-porcentaje'),
    
    valGananciaDiaria: document.getElementById('val-ganancia-diaria'),
    valGananciaMensual: document.getElementById('val-ganancia-mensual'),
    valGananciaDiariaSub: document.getElementById('val-ganancia-diaria-sub'),
    valGananciaMensualSub: document.getElementById('val-ganancia-mensual-sub'),

    monthlySection: document.getElementById('monthly-section'),
    monthlyTableBody: document.getElementById('monthly-table-body'),
    monthlyTableFoot: document.getElementById('monthly-table-foot'),
    inputGoal: document.getElementById('input-goal'),
    goalProgressFill: document.getElementById('goal-progress-fill'),
    goalProgressText: document.getElementById('goal-progress-text'),
    goalRemainingText: document.getElementById('goal-remaining-text'),
    goalAvgContribution: document.getElementById('goal-avg-contribution'),
    goalAvgContributionSub: document.getElementById('goal-avg-contribution-sub'),
    goalAvgReturn: document.getElementById('goal-avg-return'),
    goalAvgReturnSub: document.getElementById('goal-avg-return-sub'),
    goalCurrentIncome: document.getElementById('goal-current-income'),
    goalTargetIncome: document.getElementById('goal-target-income'),
    goalEta: document.getElementById('goal-eta'),
    goalEtaSub: document.getElementById('goal-eta-sub'),
    goalRealSection: document.getElementById('goal-real-section'),
    ladderSection: document.getElementById('ladder-section'),
    ladderProduct: document.getElementById('ladder-product'),
    ladderSummary: document.getElementById('ladder-summary'),
    ladderNextMove: document.getElementById('ladder-next-move'),
    ladderTableBody: document.getElementById('ladder-table-body'),
    ladderNote: document.getElementById('ladder-note'),
    goalInflation: document.getElementById('goal-inflation'),
    goalInflationSub: document.getElementById('goal-inflation-sub'),
    goalRealReturn: document.getElementById('goal-real-return'),
    goalRealReturnSub: document.getElementById('goal-real-return-sub'),
    goalRealIncome: document.getElementById('goal-real-income'),
    goalRealIncomeSub: document.getElementById('goal-real-income-sub'),
    goalRealEta: document.getElementById('goal-real-eta'),
    goalRealEtaSub: document.getElementById('goal-real-eta-sub'),
    
    chartPlaceholder: document.getElementById('chart-placeholder-msg'),
    searchInput: document.getElementById('search-input'),
    tableBody: document.getElementById('table-body'),
    tableEmptyMsg: document.getElementById('table-empty-msg'),
    
    btnExportData: document.getElementById('btn-export-data'),
    btnImportData: document.getElementById('btn-import-data'),
    fileImportInput: document.getElementById('file-import-input'),
    btnDeleteSelected: document.getElementById('btn-delete-selected'),
    btnClearAll: document.getElementById('btn-clear-all'),
    checkAllMovements: document.getElementById('check-all-movements'),
    
    btnImportPdf: document.getElementById('btn-import-pdf'),
    filePdfInput: document.getElementById('file-pdf-input'),
    pdfLoader: document.getElementById('pdf-loader'),
    pdfLoaderText: document.getElementById('pdf-loader-text'),
    
    modalContainer: document.getElementById('modal-container'),
    modalTitle: document.getElementById('modal-title'),
    modalBodyContent: document.getElementById('modal-body-content'),
    btnModalClose: document.getElementById('btn-modal-close'),
    btnModalConfirm: document.getElementById('btn-modal-confirm'),
    
    comparisonSection: document.getElementById('comparison-section'),
    valCompPlazoFijo: document.getElementById('val-comp-plazofijo'),
    diffCompPlazoFijo: document.getElementById('diff-comp-plazofijo'),
    valCompPlazoFijoUva: document.getElementById('val-comp-plazofijouva'),
    diffCompPlazoFijoUva: document.getElementById('diff-comp-plazofijouva'),
    valCompMercadoPago: document.getElementById('val-comp-mercadopago'),
    diffCompMercadoPago: document.getElementById('diff-comp-mercadopago'),
    
    valCompNaranjaX: document.getElementById('val-comp-naranjax'),
    diffCompNaranjaX: document.getElementById('diff-comp-naranjax'),
    valCompDolar: document.getElementById('val-comp-dolar'),
    diffCompDolar: document.getElementById('diff-comp-dolar'),
    
    cardCapital: document.getElementById('card-capital'),
    cardDelta: document.getElementById('card-delta'),
    cardGanancia: document.getElementById('card-ganancia'),
    cardPlazoFijo: document.getElementById('card-plazofijo'),
    cardPlazoFijoUva: document.getElementById('card-plazofijouva'),
    cardMercadoPago: document.getElementById('card-mercadopago'),
    cardNaranjaX: document.getElementById('card-naranjax'),
    cardDolar: document.getElementById('card-dolar')
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
    
    // 4. Conectar con la API para traer cotización actual y luego las tasas históricas
    fetchCurrentCotizacion().then(() => {
        fetchHistoricalRates();
    });
});

// TARJETA ASOCIADA A CADA SERIE DE LA LEYENDA
const getCardForTarget = (target) => ({
    capital: dom.cardCapital,
    delta: dom.cardDelta,
    plazofijo: dom.cardPlazoFijo,
    plazofijouva: dom.cardPlazoFijoUva,
    mercadopago: dom.cardMercadoPago,
    naranjax: dom.cardNaranjaX,
    dolar: dom.cardDolar
}[target]);

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
    
    // Cancelar Edición
    if (dom.btnCancelEdit) {
        dom.btnCancelEdit.addEventListener('click', cancelEdit);
    }
    
    // Buscador en la tabla
    dom.searchInput.addEventListener('input', (e) => {
        renderMovementsTable(e.target.value);
    });
    
    // Meta de capital (se guarda en LocalStorage)
    if (dom.inputGoal) {
        dom.inputGoal.value = getGoalAmount();
        dom.inputGoal.addEventListener('change', (e) => {
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val > 0) {
                localStorage.setItem('mis_ahorros_goal', String(val));
            }
            dom.inputGoal.value = getGoalAmount();
            renderMonthlySection();
        });
    }

    // Escalera de plazos fijos: elegir producto
    if (dom.ladderProduct) {
        dom.ladderProduct.addEventListener('change', renderLadderSection);
    }

    // Exportar Datos
    dom.btnExportData.addEventListener('click', exportDataToJSON);
    
    // Importar Datos (disparar input file)
    dom.btnImportData.addEventListener('click', () => {
        dom.fileImportInput.click();
    });
    
    dom.fileImportInput.addEventListener('change', importDataFromJSON);
    
    // Importar Comprobantes PDF
    if (dom.btnImportPdf && dom.filePdfInput) {
        dom.btnImportPdf.addEventListener('click', () => {
            dom.filePdfInput.click();
        });
        dom.filePdfInput.addEventListener('change', handlePdfImport);
    }
    
    // Limpiar Todo
    if (dom.btnClearAll) {
        dom.btnClearAll.addEventListener('click', handleClearAll);
    }
    
    // Checkbox Maestro (Check All)
    if (dom.checkAllMovements) {
        dom.checkAllMovements.addEventListener('change', handleCheckAll);
    }
    
    // Borrar Seleccionados
    if (dom.btnDeleteSelected) {
        dom.btnDeleteSelected.addEventListener('click', handleDeleteSelected);
    }
    
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

    // Leyenda Interactiva (Filtros del Gráfico y Tarjetas)
    document.querySelectorAll('.legend-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            if (!target || !state.activeInvestments.hasOwnProperty(target)) return;
            
            // Alternar estado
            state.activeInvestments[target] = !state.activeInvestments[target];
            
            // Alternar clase .inactive en el botón clickeado
            if (state.activeInvestments[target]) {
                e.currentTarget.classList.remove('inactive');
            } else {
                e.currentTarget.classList.add('inactive');
            }
            
            // Alternar clase .hidden en la tarjeta asociada
            const cardElement = getCardForTarget(target);
            if (cardElement) {
                if (state.activeInvestments[target]) {
                    cardElement.classList.remove('hidden');
                } else {
                    cardElement.classList.add('hidden');
                }
            }
            
            // Alternar visibilidad de la serie en el gráfico con animación suave
            if (state.chartInstance) {
                const labelMap = {
                    delta: 'Delta Retorno Real',
                    plazofijo: 'Simulación Plazo Fijo',
                    plazofijouva: 'Simulación Plazo Fijo UVA',
                    mercadopago: 'Simulación Mercado Pago',
                    naranjax: 'Simulación Naranja X',
                    dolar: 'Simulación Dólar Blue',
                    capital: 'Capital Invertido'
                };
                const datasetIndex = state.chartInstance.data.datasets.findIndex(ds => ds.label === labelMap[target]);
                if (datasetIndex !== -1) {
                    state.chartInstance.setDatasetVisibility(datasetIndex, state.activeInvestments[target]);
                    state.chartInstance.update();
                }
            }
        });
    });
};

// FETCH COTIZACIÓN ACTUAL Y ANTERIOR (API)
const fetchCurrentCotizacion = async () => {
    setApiStatus('loading', 'Consultando cotización de cierre...');
    
    try {
        // 1. Obtener última cotización
        const responseUltimo = await fetch(`${API_URL_BASE}/ultimo`, { cache: 'no-cache' });
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
            const responsePenultimo = await fetch(`${API_URL_BASE}/penultimo`, { cache: 'no-cache' });
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

// FETCH TASAS DE PLAZO FIJO, DÓLAR BLUE Y TASA DE NARANJA X (API)
const fetchHistoricalRates = async () => {
    setApiStatus('loading', 'Cargando datos históricos y de comparación...');
    
    // Promesa 1: Tasas de Plazo Fijo
    const pfPromise = fetch('https://api.argentinadatos.com/v1/finanzas/tasas/depositos30Dias', { cache: 'no-cache' })
        .then(async res => {
            if (!res.ok) throw new Error('Error en plazo fijo');
            const data = await res.json();
            // La API mezcla unidades: hasta 2025 la TNA viene como fracción (0.34 = 34%), después como % (54.57)
            state.plazoFijoRates = data
                .map(r => ({ ...r, valor: r.valor < 5 ? r.valor * 100 : r.valor }))
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            tnaCache.clear();
            state.ratesFetched = true;
            console.log(`Tasas Plazo Fijo cargadas: ${state.plazoFijoRates.length} registros`);
        })
        .catch(err => {
            console.error('Error cargando tasas históricas de Plazo Fijo:', err);
            state.plazoFijoRates = [{ fecha: '2026-01-01', valor: 30.0 }];
            tnaCache.clear();
            state.ratesFetched = false;
        });

    // Promesa 2: Histórico de Dólar Blue
    const dolarPromise = fetch('https://api.argentinadatos.com/v1/cotizaciones/dolares/blue', { cache: 'no-cache' })
        .then(async res => {
            if (!res.ok) throw new Error('Error en dólar blue');
            const data = await res.json();
            state.dolarBlueRates = data.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
            state.dolarFetched = true;
            console.log(`Cotizaciones Dólar Blue cargadas: ${state.dolarBlueRates.length} registros`);
        })
        .catch(err => {
            console.error('Error cargando tasas de Dólar Blue:', err);
            state.dolarBlueRates = [];
            state.dolarFetched = false;
        });

    // Promesa 3: Tasa de Naranja X (FCI)
    const nxPromise = fetch('https://api.argentinadatos.com/v1/finanzas/fci/otros/ultimo', { cache: 'no-cache' })
        .then(async res => {
            if (!res.ok) throw new Error('Error en tasa Naranja X');
            const data = await res.json();
            const nxInfo = data.find(item => item.fondo === 'NARANJA X');
            if (nxInfo && typeof nxInfo.tna === 'number') {
                state.naranjaxTnaCurrent = nxInfo.tna;
                console.log(`Tasa Naranja X actual: ${state.naranjaxTnaCurrent}`);
            }
        })
        .catch(err => {
            console.error('Error cargando tasa de Naranja X:', err);
            // Mantiene el valor por defecto (0.18)
        });

    // Promesa 4: Histórico de Delta Retorno Real
    const deltaHistoryPromise = fetch('https://api.argentinadatos.com/v1/finanzas/fci/fondos/delta-retorno-real-clase-a/historico', { cache: 'no-cache' })
        .then(async res => {
            if (!res.ok) throw new Error('Error en histórico Delta');
            const data = await res.json();
            // La API devuelve { historico: [...] } (no un arreglo directo)
            const records = Array.isArray(data) ? data : (data.historico || []);
            state.deltaHistory = records
                .filter(r => r.fecha && typeof r.valorCuotaparte === 'number')
                .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
            console.log(`Histórico de Delta cargado: ${state.deltaHistory.length} registros`);
        })
        .catch(err => {
            console.error('Error cargando histórico de Delta:', err);
            state.deltaHistory = [];
        });

    // Promesa 5: Inflación mensual (INDEC)
    const inflationPromise = fetch('https://api.argentinadatos.com/v1/finanzas/indices/inflacion', { cache: 'no-cache' })
        .then(async res => {
            if (!res.ok) throw new Error('Error en inflación');
            const data = await res.json();
            const map = {};
            (Array.isArray(data) ? data : []).forEach(r => {
                if (r.fecha && typeof r.valor === 'number') map[r.fecha.substring(0, 7)] = r.valor;
            });
            state.inflation = map;
            console.log(`Inflación mensual cargada: ${Object.keys(map).length} meses`);
        })
        .catch(err => {
            console.error('Error cargando inflación:', err);
            state.inflation = {};
        });

    // Promesa 6: Serie de la UVA (para el plazo fijo UVA)
    const uvaPromise = fetch('https://api.argentinadatos.com/v1/finanzas/indices/uva', { cache: 'no-cache' })
        .then(async res => {
            if (!res.ok) throw new Error('Error en UVA');
            const data = await res.json();
            state.uvaRates = (Array.isArray(data) ? data : [])
                .filter(r => r.fecha && typeof r.valor === 'number')
                .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
            console.log(`Serie UVA cargada: ${state.uvaRates.length} registros`);
        })
        .catch(err => {
            console.error('Error cargando UVA:', err);
            state.uvaRates = [];
        });

    // Esperar a que se resuelvan todas las promesas
    await Promise.allSettled([pfPromise, dolarPromise, nxPromise, deltaHistoryPromise, inflationPromise, uvaPromise]);
    
    setApiStatus('success', 'API Conectada');
    
    // Si ya hay suscripciones cargadas, recalcular todo para mostrar la comparativa
    if (state.subscriptions.length > 0) {
        recalculateAndRender();
    }
};

// BÚSQUEDA BINARIA: índice del último registro con fecha <= dateStr (series ordenadas asc).
// Las fechas se comparan como texto 'YYYY-MM-DD', así evitamos crear miles de objetos Date.
const findLastIndexOnOrBefore = (series, dateStr) => {
    let lo = 0, hi = series.length - 1, ans = -1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (series[mid].fecha.substring(0, 10) <= dateStr) {
            ans = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return ans;
};

// Cache de TNA por día (la simulación diaria consulta muchas veces las mismas fechas)
const tnaCache = new Map();

// OBTENER LA TASA TNA PARA UNA FECHA ESPECÍFICA (O LA ANTERIOR MÁS CERCANA)
const getTnaForDate = (dateStr) => {
    if (!state.plazoFijoRates || state.plazoFijoRates.length === 0) return 30.0; // TNA por defecto

    const cached = tnaCache.get(dateStr);
    if (cached !== undefined) return cached;

    const idx = findLastIndexOnOrBefore(state.plazoFijoRates, dateStr);
    const rate = idx >= 0 ? state.plazoFijoRates[idx].valor : 30.0;
    tnaCache.set(dateStr, rate);
    return rate;
};

// ALGORITMO SIMULACIÓN PLAZO FIJO COMPUESTO CADA 30 DÍAS
const simulatePlazoFijo = (amount, startDateStr, endDateStr) => {
    let start = new Date(startDateStr);
    const end = new Date(endDateStr);
    let capital = amount;
    
    if (start >= end) return amount;
    
    // Loop en periodos de 30 días
    while (true) {
        const nextPeriod = new Date(start);
        nextPeriod.setDate(nextPeriod.getDate() + 30);
        
        if (nextPeriod <= end) {
            const dateStr = start.toISOString().split('T')[0];
            const tna = getTnaForDate(dateStr);
            const interest = capital * (tna / 100) * (30 / 365);
            capital += interest;
            start = nextPeriod;
        } else {
            break;
        }
    }
    
    // Proporcional de días remanentes al final
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0 && start < end) {
        const dateStr = start.toISOString().split('T')[0];
        const tna = getTnaForDate(dateStr);
        const interest = capital * (tna / 100) * (diffDays / 365);
        capital += interest;
    }
    
    return capital;
};

// SIMULACIÓN REALISTA: "RESCATE A FIN DE MES → PLAZO FIJO 30 DÍAS"
// Estrategia que se puede hacer en la práctica con depósitos diarios:
//  1. Durante el mes cada movimiento se suscribe/rescata en Delta (igual que hoy).
//  2. El último día hábil del mes se rescata todo lo que haya en Delta (a la cotización de ese día).
//  3. El día hábil siguiente se constituye un plazo fijo a 30 días con la TNA vigente.
//  4. Al vencer, capital + intereses se renuevan (el día hábil siguiente si vence en feriado/fin de semana).
// Un plazo fijo vigente se valúa con el interés devengado a la fecha (aunque no se pueda retirar antes).
// `product` define el plazo (termDays), qué se guarda al constituirlo (open) y cómo se valúa (valueAt),
// así la misma estrategia sirve para plazo fijo tradicional y UVA.
// Devuelve { 'YYYY-MM-DD': valor total } para cada día, o null si falta el histórico de Delta.
// `trace` (opcional): si se pasa un objeto, se completa con el detalle de la escalera
// { history: [plazos fijos constituidos], active: [vigentes], deltaValue, pendingCash, endDate }
const simulateMonthlyRolloverSeries = (subscriptions, endDateStr, product, trace = null) => {
    if (!subscriptions || subscriptions.length === 0) return {};
    if (!state.deltaHistory || state.deltaHistory.length === 0) return null;

    // Días hábiles = días con cotización publicada de Delta
    const businessDays = new Set();
    const lastBizOfMonth = {};
    state.deltaHistory.forEach(r => {
        const d = r.fecha.substring(0, 10);
        businessDays.add(d);
        lastBizOfMonth[d.substring(0, 7)] = d; // está ordenado: queda el último del mes
    });
    // Un mes solo "cierra" si ya hay cotizaciones de un mes posterior
    const lastHistoryMonth = state.deltaHistory[state.deltaHistory.length - 1].fecha.substring(0, 7);
    const monthEnds = new Set(
        Object.entries(lastBizOfMonth).filter(([m]) => m < lastHistoryMonth).map(([, d]) => d)
    );

    const deltaPrice = (dateStr) => {
        const idx = findLastIndexOnOrBefore(state.deltaHistory, dateStr);
        return idx >= 0 ? state.deltaHistory[idx].valorCuotaparte / 1000 : null;
    };

    const cuotasByDate = {};
    let firstDate = null;
    subscriptions.forEach(s => {
        cuotasByDate[s.date] = (cuotasByDate[s.date] || 0) + (s.type === 'Rescate' ? -s.cuotapartes : s.cuotapartes);
        if (!firstDate || s.date < firstDate) firstDate = s.date;
    });

    const valuations = {};
    let cuotapartes = 0;  // Tenencia en Delta durante el mes
    let pendingCash = 0;  // Plata rescatada/vencida esperando el próximo día hábil
    let deposits = [];    // Plazos fijos vigentes: { capital, startDate, startTime, maturityTime, tna }
    let lastPrice = null;
    let pendingSources = []; // De dónde viene la plata en espera (aportes del mes / vencimientos)
    const history = [];

    const current = new Date(firstDate);
    const end = new Date(endDateStr);
    const DAY_MS = 1000 * 60 * 60 * 24;

    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const now = current.getTime();
        const isBusinessDay = businessDays.has(dateStr);
        const price = deltaPrice(dateStr) || lastPrice;
        if (price) lastPrice = price;

        // 1. Vencimientos de plazos fijos
        const stillRunning = [];
        deposits.forEach(pf => {
            if (now >= pf.maturityTime) {
                const maturityValue = product.valueAt(pf, dateStr, product.termDays);
                pendingCash += maturityValue;
                pf.status = 'Vencido';
                pf.maturityValue = maturityValue;
                pendingSources.push({ type: 'renovacion', from: pf.startDate, amount: maturityValue });
            } else {
                stillRunning.push(pf);
            }
        });
        deposits = stillRunning;

        // 2. Movimientos del día en Delta
        if (cuotasByDate[dateStr]) {
            cuotapartes += cuotasByDate[dateStr];
            if (cuotapartes < 0) {
                // Rescate mayor a lo que hay en Delta: se cubre con plata en espera (simplificación)
                pendingCash = Math.max(0, pendingCash + cuotapartes * (price || 0));
                cuotapartes = 0;
            }
        }

        // 3. En día hábil, la plata en espera se coloca en un plazo fijo nuevo
        if (isBusinessDay && pendingCash > 0) {
            const maturity = new Date(now + product.termDays * DAY_MS).toISOString().split('T')[0];
            const pf = {
                capital: pendingCash,
                startDate: dateStr,
                maturityDate: maturity,
                startTime: now,
                maturityTime: now + product.termDays * DAY_MS,
                sources: pendingSources,
                status: 'Vigente',
                ...product.open(dateStr)
            };
            deposits.push(pf);
            history.push(pf);
            pendingCash = 0;
            pendingSources = [];
        }

        // 4. Último día hábil del mes: rescatar todo Delta (se acredita al día hábil siguiente)
        if (monthEnds.has(dateStr) && cuotapartes > 0 && price) {
            pendingCash += cuotapartes * price;
            pendingSources.push({ type: 'aportes', month: dateStr.substring(0, 7), amount: cuotapartes * price });
            cuotapartes = 0;
        }

        // 5. Valuación del día
        const pfValue = deposits.reduce((sum, pf) => {
            const elapsedDays = Math.round((now - pf.startTime) / DAY_MS);
            return sum + product.valueAt(pf, dateStr, elapsedDays);
        }, 0);
        valuations[dateStr] = cuotapartes * (price || 0) + pendingCash + pfValue;

        current.setDate(current.getDate() + 1);
    }

    if (trace) {
        const endTime = new Date(endDateStr).getTime();
        trace.endDate = endDateStr;
        trace.termDays = product.termDays;
        trace.history = history;
        trace.active = deposits.map(pf => {
            pf.valueToday = product.valueAt(pf, endDateStr, Math.round((endTime - pf.startTime) / DAY_MS));
            return pf;
        });
        trace.deltaValue = cuotapartes * (lastPrice || 0);
        trace.pendingCash = pendingCash;
        trace.pendingSources = pendingSources;
    }

    return valuations;
};

// Plazo fijo tradicional a 30 días: interés simple con la TNA del día en que se constituye
const simulatePlazoFijoMensualSeries = (subscriptions, endDateStr, trace = null) =>
    simulateMonthlyRolloverSeries(subscriptions, endDateStr, {
        termDays: 30,
        open: (dateStr) => ({ tna: getTnaForDate(dateStr) }),
        valueAt: (pf, dateStr, days) => pf.capital * (1 + (pf.tna / 100) * (days / 365))
    }, trace);

// VALOR DE LA UVA EN UNA FECHA (o el anterior publicado)
const getUvaForDate = (dateStr) => {
    if (!state.uvaRates || state.uvaRates.length === 0) return null;
    const idx = findLastIndexOnOrBefore(state.uvaRates, dateStr);
    return idx >= 0 ? state.uvaRates[idx].valor : state.uvaRates[0].valor;
};

// TNA adicional que pagan los bancos sobre la UVA en un plazo fijo UVA (no precancelable). Aproximación.
const PF_UVA_TNA = 1.0;

// Plazo fijo UVA a 90 días: el capital ajusta por UVA (inflación) y además paga PF_UVA_TNA anual
const simulatePlazoFijoUvaSeries = (subscriptions, endDateStr, trace = null) => {
    if (!state.uvaRates || state.uvaRates.length === 0) return null;
    return simulateMonthlyRolloverSeries(subscriptions, endDateStr, {
        termDays: 90,
        open: (dateStr) => ({ uva: getUvaForDate(dateStr) }),
        valueAt: (pf, dateStr, days) => pf.capital * (getUvaForDate(dateStr) / pf.uva) * (1 + (PF_UVA_TNA / 100) * (days / 365))
    }, trace);
};

// ALGORITMO SIMULACIÓN MERCADO PAGO COMPUESTO DIARIO
const simulateMercadoPago = (amount, startDateStr, endDateStr) => {
    let start = new Date(startDateStr);
    const end = new Date(endDateStr);
    let capital = amount;
    
    if (start >= end) return amount;
    
    // Clonar para el bucle diario
    const current = new Date(start);
    while (current < end) {
        const dateStr = current.toISOString().split('T')[0];
        const tnaPF = getTnaForDate(dateStr);
        // Tasa MP aproximada: 85% de la TNA de plazo fijo
        const tnaMP = tnaPF * 0.85;
        const dailyInterest = capital * (tnaMP / 100) / 365;
        capital += dailyInterest;
        current.setDate(current.getDate() + 1);
    }
    
    return capital;
};

// OBTENER LA COTIZACIÓN DEL DÓLAR BLUE PARA UNA FECHA ESPECÍFICA (O LA ANTERIOR MÁS CERCANA)
const getDolarBlueRateForDate = (dateStr) => {
    if (!state.dolarBlueRates || state.dolarBlueRates.length === 0) return null;

    const idx = findLastIndexOnOrBefore(state.dolarBlueRates, dateStr);
    return idx >= 0 ? state.dolarBlueRates[idx] : state.dolarBlueRates[0];
};

// SIMULACIÓN MERCADO PAGO COMO PORTAFOLIO (una sola pasada día por día).
// Como la simulación es lineal en el monto, es equivalente a sumar simulateMercadoPago()
// de cada movimiento, pero en O(días) en vez de O(movimientos² × días).
// Devuelve { 'YYYY-MM-DD': saldo al inicio de ese día, incluyendo los movimientos de ese día }
const simulateMercadoPagoSeries = (subscriptions, endDateStr) => {
    if (!subscriptions || subscriptions.length === 0) return {};

    const flowsByDate = {};
    let firstDate = null;
    subscriptions.forEach(s => {
        flowsByDate[s.date] = (flowsByDate[s.date] || 0) + (s.type === 'Rescate' ? -s.amount : s.amount);
        if (!firstDate || s.date < firstDate) firstDate = s.date;
    });

    const valuations = {};
    let balance = 0;
    const current = new Date(firstDate);
    const end = new Date(endDateStr);

    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        if (flowsByDate[dateStr]) balance += flowsByDate[dateStr];
        valuations[dateStr] = balance;

        const tnaMP = getTnaForDate(dateStr) * 0.85;
        balance += balance * (tnaMP / 100) / 365;
        current.setDate(current.getDate() + 1);
    }

    return valuations;
};

// ALGORITMO SIMULACIÓN DÓLAR BLUE (COMPRA/VENTA HISTÓRICA)
const simulateDolarBlue = (amount, startDateStr, endDateStr) => {
    const startRate = getDolarBlueRateForDate(startDateStr);
    const endRate = getDolarBlueRateForDate(endDateStr);
    
    if (!startRate || !endRate || startRate.venta <= 0) {
        return amount; // Fallback
    }
    
    const usd = amount / startRate.venta;
    return usd * endRate.compra;
};

// ALGORITMO SIMULACIÓN NARANJA X COMPUESTO DIARIO CON TOPE
const simulateNaranjaXSeries = (subscriptions, endDateStr) => {
    if (!subscriptions || subscriptions.length === 0) return {};
    
    const sortedSubs = [...subscriptions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const subsByDate = {};
    sortedSubs.forEach(s => {
        if (!subsByDate[s.date]) {
            subsByDate[s.date] = 0;
        }
        subsByDate[s.date] += (s.type === 'Rescate' ? -s.amount : s.amount);
    });
    
    const valuations = {};
    let currentBalance = 0;
    
    let current = new Date(sortedSubs[0].date);
    const end = new Date(endDateStr);
    
    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        
        if (subsByDate[dateStr]) {
            currentBalance += subsByDate[dateStr];
            if (currentBalance < 0) currentBalance = 0;
        }
        
        const tnaPF = getTnaForDate(dateStr);
        // Naranja X usa el 90% de la TNA de plazo fijo si está disponible, sino la tasa actual
        const tnaNX = state.ratesFetched ? tnaPF * 0.90 : state.naranjaxTnaCurrent * 100;
        
        const interestEarningBalance = Math.min(currentBalance, 1000000);
        const dailyInterest = interestEarningBalance * (tnaNX / 100) / 365;
        
        currentBalance += dailyInterest;
        valuations[dateStr] = currentBalance;
        
        current.setDate(current.getDate() + 1);
    }
    
    return valuations;
};

// FORMATO DE ETIQUETA COMPARATIVA (+/-)
const formatDiffBadge = (element, value, percent) => {
    element.className = 'comp-diff'; // Reset class
    const formattedVal = formatARS(Math.abs(value));
    const formattedPct = Math.abs(percent).toFixed(2) + '%';
    
    if (value >= 0) {
        element.classList.add('positive');
        element.innerHTML = `<i class="fa-solid fa-caret-up"></i> +${formattedVal} (+${formattedPct}) vs. Delta`;
    } else {
        element.classList.add('negative');
        element.innerHTML = `<i class="fa-solid fa-caret-down"></i> -${formattedVal} (-${formattedPct}) vs. Delta`;
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
    
    const operationTypeInput = document.querySelector('input[name="operation-type"]:checked');
    const operationType = operationTypeInput ? operationTypeInput.value : 'Suscripción';
    
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
            type: operationType,
            manual: true
        };
        
        if (state.editingId) {
            newSubscription.id = state.editingId;
            updateSubscription(newSubscription);
        } else {
            saveNewSubscription(newSubscription);
        }
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
            type: operationType,
            manual: false
        };
        
        if (state.editingId) {
            newSubscription.id = state.editingId;
            updateSubscription(newSubscription);
        } else {
            saveNewSubscription(newSubscription);
        }
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

// CARGAR MOVIMIENTO EN FORMULARIO (EDICIÓN)
const loadMovementIntoForm = (id) => {
    const sub = state.subscriptions.find(s => s.id === id);
    if (!sub) return;
    
    // Cargar datos en el form
    state.editingId = sub.id;
    
    // Tipo de operación
    const radioSuscripcion = document.querySelector('input[name="operation-type"][value="Suscripción"]');
    const radioRescate = document.querySelector('input[name="operation-type"][value="Rescate"]');
    if (sub.type === 'Rescate') {
        if(radioRescate) radioRescate.checked = true;
    } else {
        if(radioSuscripcion) radioSuscripcion.checked = true;
    }
    
    // Fecha
    dom.inputDate.value = sub.date;
    
    // Importe
    dom.inputAmount.value = sub.amount;
    
    // Cuotapartes (siempre manual al editar)
    dom.checkManualCuotapartes.checked = true;
    dom.cuotapartesGroup.classList.remove('hidden');
    dom.inputCuotapartes.value = sub.cuotapartes;
    
    // Cambios visuales
    const formCard = dom.subscriptionForm.closest('.form-card');
    formCard.classList.add('editing');
    formCard.querySelector('.card-title').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar Movimiento';
    dom.textSubmitForm.innerText = 'Guardar Cambios';
    dom.btnCancelEdit.classList.remove('hidden');
    
    // Scroll hacia arriba (al form)
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// CANCELAR EDICIÓN
const cancelEdit = () => {
    state.editingId = null;
    const formCard = dom.subscriptionForm.closest('.form-card');
    formCard.classList.remove('editing');
    formCard.querySelector('.card-title').innerHTML = '<i class="fa-solid fa-pen"></i> Carga Manual';
    dom.textSubmitForm.innerText = 'Cargar Movimiento';
    dom.btnCancelEdit.classList.add('hidden');
    resetForm();
};

// ACTUALIZAR SUBSCRIPCIÓN EXISTENTE
const updateSubscription = (updatedSub) => {
    const index = state.subscriptions.findIndex(s => s.id === updatedSub.id);
    if (index !== -1) {
        state.subscriptions[index] = updatedSub;
        state.subscriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
        saveLocalStorageData();
        recalculateAndRender();
        cancelEdit();
        showAlert('Edición Exitosa', 'El movimiento ha sido actualizado.');
    }
};

// GUARDAR SUBSCRIPCIÓN Y ACTUALIZAR
const saveNewSubscription = (newSub) => {
    state.subscriptions.push(newSub);
    // Ordenar de nuevo cronológicamente por fecha
    state.subscriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    saveLocalStorageData();
    recalculateAndRender();
    
    if (newSub.type === 'Rescate') {
        const impact = getRescateImpactMessage(newSub.amount);
        if (impact) showAlert('Rescate Cargado', `Se registró el rescate del ${formatDateToLocale(newSub.date)}.${impact}`);
    }
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
// OBTENER COTIZACIÓN DEL DÍA ANTERIOR DESDE EL HISTORIAL
const getCotizacionAyer = (fechaHoy) => {
    if (!state.deltaHistory || state.deltaHistory.length === 0) return null;
    let lastCotizacion = null;
    for (const record of state.deltaHistory) {
        if (record.fecha < fechaHoy) {
            lastCotizacion = record.valorCuotaparte / 1000;
        } else {
            break;
        }
    }
    return lastCotizacion;
};

// OBTENER COTIZACIÓN DEL ÚLTIMO DÍA DEL MES ANTERIOR
const getCotizacionMesAnterior = (fechaHoy) => {
    if (!state.deltaHistory || state.deltaHistory.length === 0) return null;
    const primerDiaEsteMes = fechaHoy.substring(0, 7) + '-01';
    let lastCotizacion = null;
    for (const record of state.deltaHistory) {
        if (record.fecha < primerDiaEsteMes) {
            lastCotizacion = record.valorCuotaparte / 1000;
        } else {
            break;
        }
    }
    return lastCotizacion;
};

// CALCULAR GANANCIA DIARIA PURA
const calcularGananciaDiariaPura = (subscriptions, cotizacionHoy, cotizacionAyer, fechaHoy) => {
    if (!cotizacionAyer || !cotizacionHoy) return null;
    
    const movimientosHoy = subscriptions.filter(s => s.date === fechaHoy);
    const movimientosAnteriores = subscriptions.filter(s => s.date < fechaHoy);
    
    const flujoNetoHoy = movimientosHoy.reduce((sum, s) => sum + (s.type === 'Rescate' ? -s.amount : s.amount), 0);
    const cuotapartesAyer = movimientosAnteriores.reduce((sum, s) => sum + (s.type === 'Rescate' ? -s.cuotapartes : s.cuotapartes), 0);
    const cuotapartesHoy = cuotapartesAyer + movimientosHoy.reduce((sum, s) => sum + (s.type === 'Rescate' ? -s.cuotapartes : s.cuotapartes), 0);
    
    const valorInicial = cuotapartesAyer * cotizacionAyer;
    const valorFinal = cuotapartesHoy * cotizacionHoy;
    
    return valorFinal - valorInicial - flujoNetoHoy;
};

// CALCULAR GANANCIA MENSUAL PURA
const calcularGananciaMensualPura = (subscriptions, cotizacionHoy, cotizacionFinMesAnterior, mesActualStr) => {
    if (!cotizacionFinMesAnterior || !cotizacionHoy) return null;
    
    const mesInicio = mesActualStr + '-01';
    const movimientosEsteMes = subscriptions.filter(s => s.date >= mesInicio && s.date.startsWith(mesActualStr));
    const movimientosAnteriores = subscriptions.filter(s => s.date < mesInicio);
    
    const flujoNetoMes = movimientosEsteMes.reduce((sum, s) => sum + (s.type === 'Rescate' ? -s.amount : s.amount), 0);
    const cuotapartesMesAnterior = movimientosAnteriores.reduce((sum, s) => sum + (s.type === 'Rescate' ? -s.cuotapartes : s.cuotapartes), 0);
    const cuotapartesActuales = cuotapartesMesAnterior + movimientosEsteMes.reduce((sum, s) => sum + (s.type === 'Rescate' ? -s.cuotapartes : s.cuotapartes), 0);
    
    const valorInicial = cuotapartesMesAnterior * cotizacionFinMesAnterior;
    const valorFinal = cuotapartesActuales * cotizacionHoy;
    
    return valorFinal - valorInicial - flujoNetoMes;
};

// FECHA DEL ÚLTIMO CIERRE PUBLICADO ANTERIOR A dateStr (según el histórico de Delta)
const getPrevCloseDate = (dateStr) => {
    if (!state.deltaHistory || state.deltaHistory.length === 0) return null;
    let lo = 0, hi = state.deltaHistory.length - 1, ans = null;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const d = state.deltaHistory[mid].fecha.substring(0, 10);
        if (d < dateStr) { ans = d; lo = mid + 1; } else { hi = mid - 1; }
    }
    return ans;
};

// DD/MM
const formatDateShort = (dateStr) => {
    const p = dateStr.split('-');
    return p.length === 3 ? `${p[2]}/${p[1]}` : dateStr;
};

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const formatMonthLabel = (ym) => `${MONTH_NAMES[parseInt(ym.substring(5, 7), 10) - 1]} ${ym.substring(0, 4)}`;

const DEFAULT_GOAL = 30000000;
const getGoalAmount = () => {
    const val = parseFloat(localStorage.getItem('mis_ahorros_goal'));
    return !isNaN(val) && val > 0 ? val : DEFAULT_GOAL;
};

// RESUMEN MENSUAL: aportes, rescates y ganancia pura de cada mes con movimientos.
// Ganancia del mes = tenencia al último cierre del mes - tenencia al cierre del mes anterior - aporte neto del mes
const computeMonthlySummary = () => {
    if (!state.deltaHistory || state.deltaHistory.length === 0 || state.subscriptions.length === 0) return [];

    const priceOnOrBefore = (dateStr) => {
        const idx = findLastIndexOnOrBefore(state.deltaHistory, dateStr);
        return idx >= 0
            ? { date: state.deltaHistory[idx].fecha.substring(0, 10), price: state.deltaHistory[idx].valorCuotaparte / 1000 }
            : null;
    };

    const chron = [...state.subscriptions].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    const firstMonth = chron[0].date.substring(0, 7);
    const lastDate = state.currentFechaCierre || state.deltaHistory[state.deltaHistory.length - 1].fecha.substring(0, 10);
    const lastMonth = lastDate.substring(0, 7);

    const rows = [];
    let cuotapartes = 0;
    let idx = 0;
    let ym = firstMonth;

    while (ym <= lastMonth) {
        const [y, m] = ym.split('-').map(Number);
        const nextMonth = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
        const prevClose = priceOnOrBefore(getPrevCloseDate(ym + '-01') || ym + '-01');
        const cuotapartesInicio = cuotapartes;
        let aportes = 0, rescates = 0;

        while (idx < chron.length && chron[idx].date.startsWith(ym)) {
            const s = chron[idx];
            if (s.type === 'Rescate') {
                rescates += s.amount;
                cuotapartes -= s.cuotapartes;
            } else {
                aportes += s.amount;
                cuotapartes += s.cuotapartes;
            }
            idx++;
        }
        if (cuotapartes < 0) cuotapartes = 0;

        // Último cierre del mes (o el último publicado si el mes está en curso)
        const isCurrent = ym === lastMonth;
        const close = isCurrent ? priceOnOrBefore(lastDate) : priceOnOrBefore(getPrevCloseDate(nextMonth + '-01') || lastDate);
        if (!prevClose || !close) { ym = nextMonth; continue; }
        const closePrice = isCurrent && state.currentCotizacion ? state.currentCotizacion : close.price;

        const valorInicio = cuotapartesInicio * prevClose.price;
        const valorFin = cuotapartes * closePrice;
        const neto = aportes - rescates;

        rows.push({
            month: ym,
            isCurrent,
            closeDate: close.date,
            aportes,
            rescates,
            neto,
            ganancia: valorFin - valorInicio - neto,
            rendFondo: prevClose.price > 0 ? (closePrice / prevClose.price - 1) * 100 : 0,
            inflacion: getInflationForMonth(ym),
            tenencia: valorFin
        });

        ym = nextMonth;
    }
    return rows;
};

// INFLACIÓN DEL MES (INDEC vía API), en %; null si todavía no se publicó
const getInflationForMonth = (ym) => (state.inflation && typeof state.inflation[ym] === 'number' ? state.inflation[ym] : null);

// Rendimiento real = (1 + rendimiento nominal) / (1 + inflación) - 1
const realReturnPct = (nominalPct, inflationPct) => ((1 + nominalPct / 100) / (1 + inflationPct / 100) - 1) * 100;

// Meses para llegar a la meta: valor = valor × (1 + rendimiento) + aporte (máx. 50 años)
const monthsToGoal = (startValue, goal, monthlyContribution, monthlyReturn) => {
    let value = startValue;
    let months = 0;
    while (value < goal && months < 600) {
        value = value * (1 + monthlyReturn) + monthlyContribution;
        months++;
    }
    return value >= goal ? months : null;
};

const formatDuration = (months) => {
    const years = Math.floor(months / 12), rest = months % 12;
    if (years === 0) return `${months} mes${months !== 1 ? 'es' : ''}`;
    return `${years} año${years > 1 ? 's' : ''}${rest ? ` y ${rest} mes${rest > 1 ? 'es' : ''}` : ''}`;
};

const formatEtaMonth = (fromYm, months) => {
    const [y, m] = fromYm.split('-').map(Number);
    const idx = (m - 1) + months;
    return `${MONTH_NAMES[idx % 12]} ${y + Math.floor(idx / 12)}`;
};

// PARÁMETROS DE LA PROYECCIÓN (promedios de los meses completos)
const getProjectionContext = () => {
    const rows = computeMonthlySummary();
    if (rows.length === 0) return null;
    const complete = rows.filter(r => !r.isCurrent);
    const ctx = {
        rows,
        complete,
        tenencia: rows[rows.length - 1].tenencia,
        lastMonth: rows[rows.length - 1].month,
        goal: getGoalAmount()
    };
    if (complete.length === 0) return ctx;

    ctx.avgNeto = complete.reduce((s, r) => s + r.neto, 0) / complete.length;
    // Promedio geométrico del rendimiento mensual del fondo
    const growth = complete.reduce((p, r) => p * (1 + r.rendFondo / 100), 1);
    ctx.avgReturn = Math.pow(growth, 1 / complete.length) - 1;

    // Rendimiento real: solo meses con inflación publicada
    const withInflation = complete.filter(r => r.inflacion !== null);
    if (withInflation.length > 0) {
        const g = withInflation.reduce((p, r) => p * (1 + r.rendFondo / 100), 1);
        const gi = withInflation.reduce((p, r) => p * (1 + r.inflacion / 100), 1);
        ctx.inflMonths = withInflation;
        ctx.avgInflation = Math.pow(gi, 1 / withInflation.length) - 1;
        ctx.avgRealReturn = Math.pow(g / gi, 1 / withInflation.length) - 1;
        ctx.accFondo = (g - 1) * 100;
        ctx.accInflation = (gi - 1) * 100;
    }
    return ctx;
};

const periodLabel = (rows) => rows.length > 1
    ? `${formatMonthLabel(rows[0].month)} – ${formatMonthLabel(rows[rows.length - 1].month)}`
    : formatMonthLabel(rows[0].month);

// MENSAJE DE IMPACTO DE UN RESCATE EN LA META (para avisar al cargarlo)
const getRescateImpactMessage = (rescateAmount) => {
    const ctx = getProjectionContext();
    if (!ctx || ctx.avgReturn === undefined || rescateAmount <= 0) return '';

    const costPerMonth = rescateAmount * ctx.avgReturn;
    let msg = `<br><br><b>Impacto del rescate (${formatARS(rescateAmount)}):</b><br>` +
        `• Mientras esa plata esté fuera del fondo, dejás de ganar ≈ <b>${formatARS(costPerMonth)} por mes</b> ` +
        `(al ${formatPercentage(ctx.avgReturn * 100)} mensual promedio).`;

    if (ctx.tenencia < ctx.goal) {
        const withRescate = monthsToGoal(ctx.tenencia, ctx.goal, ctx.avgNeto, ctx.avgReturn);
        const withoutRescate = monthsToGoal(ctx.tenencia + rescateAmount, ctx.goal, ctx.avgNeto, ctx.avgReturn);
        if (withRescate !== null && withoutRescate !== null) {
            const delay = withRescate - withoutRescate;
            msg += delay > 0
                ? `<br>• Si no vuelve al fondo, la meta de ${formatARS(ctx.goal)} se atrasa ≈ <b>${formatDuration(delay)}</b> ` +
                  `(de ${formatEtaMonth(ctx.lastMonth, withoutRescate)} a ${formatEtaMonth(ctx.lastMonth, withRescate)}).`
                : `<br>• No cambia el mes estimado para llegar a la meta.`;
        }
    }
    msg += `<br>• Si la volvés a suscribir pronto (por ejemplo, un préstamo que te devuelven), el costo es solo el rendimiento de los días que estuvo afuera.`;
    return msg;
};

// RENDERIZAR META DE CAPITAL Y RESUMEN MENSUAL
const renderMonthlySection = () => {
    if (!dom.monthlySection) return;
    const ctx = getProjectionContext();
    if (!ctx) {
        dom.monthlySection.classList.add('hidden');
        return;
    }
    dom.monthlySection.classList.remove('hidden');
    const { rows, complete, tenencia, goal } = ctx;

    const signedClass = (v) => (v >= 0 ? 'cell-positive' : 'cell-negative');

    // --- Tabla mensual (más reciente arriba) ---
    dom.monthlyTableBody.innerHTML = [...rows].reverse().map(r => {
        const ratio = r.aportes > 0 ? (r.ganancia / r.aportes) * 100 : null;
        const enCurso = r.isCurrent ? ` <small style="color:var(--text-muted)">(hasta ${formatDateShort(r.closeDate)})</small>` : '';
        const real = r.inflacion !== null && !r.isCurrent ? realReturnPct(r.rendFondo, r.inflacion) : null;
        return `
            <tr>
                <td><strong>${formatMonthLabel(r.month)}</strong>${enCurso}</td>
                <td class="text-right">${formatARS(r.aportes)}</td>
                <td class="text-right">${r.rescates > 0 ? '-' + formatARS(r.rescates) : '—'}</td>
                <td class="text-right">${formatARS(r.neto)}</td>
                <td class="text-right ${signedClass(r.ganancia)}" style="font-weight:600;">${formatARS(r.ganancia)}</td>
                <td class="text-right ${signedClass(r.rendFondo)}">${formatPercentage(r.rendFondo)}</td>
                <td class="text-right text-muted">${r.inflacion !== null ? r.inflacion.toFixed(1) + '%' : '<small>s/d</small>'}</td>
                <td class="text-right ${real === null ? '' : signedClass(real)}">${real === null ? '—' : formatPercentage(real)}</td>
                <td class="text-right">${ratio === null ? '—' : ratio.toFixed(1) + '%'}</td>
                <td class="text-right">${formatARS(r.tenencia)}</td>
            </tr>`;
    }).join('');

    const totAportes = rows.reduce((s, r) => s + r.aportes, 0);
    const totRescates = rows.reduce((s, r) => s + r.rescates, 0);
    const totGanancia = rows.reduce((s, r) => s + r.ganancia, 0);
    dom.monthlyTableFoot.innerHTML = `
        <tr>
            <td>Total</td>
            <td class="text-right">${formatARS(totAportes)}</td>
            <td class="text-right">${totRescates > 0 ? '-' + formatARS(totRescates) : '—'}</td>
            <td class="text-right">${formatARS(totAportes - totRescates)}</td>
            <td class="text-right ${signedClass(totGanancia)}">${formatARS(totGanancia)}</td>
            <td></td><td></td><td></td>
            <td class="text-right">${totAportes > 0 ? ((totGanancia / totAportes) * 100).toFixed(1) + '%' : '—'}</td>
            <td class="text-right">${formatARS(tenencia)}</td>
        </tr>`;

    // --- Meta (nominal) ---
    const pct = goal > 0 ? Math.min(100, (tenencia / goal) * 100) : 0;
    dom.goalProgressFill.style.width = pct.toFixed(1) + '%';
    dom.goalProgressText.innerText = `${formatARS(tenencia)} de ${formatARS(goal)} (${pct.toFixed(1)}%)`;
    dom.goalRemainingText.innerText = tenencia >= goal ? '¡Meta alcanzada!' : `Faltan ${formatARS(goal - tenencia)}`;

    const realEls = [dom.goalInflation, dom.goalRealReturn, dom.goalRealIncome, dom.goalRealEta];
    if (complete.length === 0) {
        [dom.goalAvgContribution, dom.goalAvgReturn, dom.goalCurrentIncome, dom.goalTargetIncome, dom.goalEta, ...realEls].forEach(el => { if (el) el.innerText = '---'; });
        dom.goalEtaSub.innerText = 'Hace falta al menos un mes completo';
        return;
    }
    const { avgNeto, avgReturn } = ctx;

    dom.goalAvgContribution.innerText = formatARS(avgNeto);
    dom.goalAvgContributionSub.innerText = `por mes (${periodLabel(complete)})`;
    dom.goalAvgReturn.innerText = formatPercentage(avgReturn * 100);
    dom.goalAvgReturnSub.innerText = `por mes, ≈ ${formatPercentage((Math.pow(1 + avgReturn, 12) - 1) * 100)} anual`;
    dom.goalCurrentIncome.innerText = formatARS(tenencia * avgReturn);
    dom.goalTargetIncome.innerText = formatARS(goal * avgReturn);

    if (tenencia >= goal) {
        dom.goalEta.innerText = '¡Ya llegaste!';
        dom.goalEtaSub.innerText = '';
    } else {
        const months = monthsToGoal(tenencia, goal, avgNeto, avgReturn);
        dom.goalEta.innerText = months === null ? 'No se alcanza' : `~${formatEtaMonth(ctx.lastMonth, months)}`;
        dom.goalEtaSub.innerText = months === null ? 'con el aporte y rendimiento promedio actuales' : `en ${formatDuration(months)}`;
    }

    // --- Meta en términos reales (pesos de hoy) ---
    if (!dom.goalRealSection) return;
    if (ctx.avgRealReturn === undefined) {
        dom.goalRealSection.classList.add('hidden');
        return;
    }
    dom.goalRealSection.classList.remove('hidden');
    const rr = ctx.avgRealReturn;
    const inflPeriod = periodLabel(ctx.inflMonths);

    dom.goalInflation.innerText = formatPercentage(ctx.avgInflation * 100);
    dom.goalInflationSub.innerText = `por mes (${inflPeriod}), acumulada ${formatPercentage(ctx.accInflation)}`;
    dom.goalRealReturn.innerText = formatPercentage(rr * 100);
    dom.goalRealReturn.className = 'goal-stat-value ' + (rr >= 0 ? 'cell-positive' : 'cell-negative');
    dom.goalRealReturnSub.innerText = `por mes: el fondo subió ${formatPercentage(ctx.accFondo)} vs. inflación ${formatPercentage(ctx.accInflation)}`;

    const realIncome = goal * rr;
    dom.goalRealIncome.innerText = formatARS(realIncome);
    dom.goalRealIncome.className = 'goal-stat-value ' + (realIncome >= 0 ? 'cell-positive' : 'cell-negative');
    dom.goalRealIncomeSub.innerText = realIncome >= 0
        ? `por mes por encima de la inflación (de ${formatARS(goal * avgReturn)} nominales)`
        : `por mes de poder de compra perdido, aunque nominalmente ganes ${formatARS(goal * avgReturn)}`;

    if (tenencia >= goal) {
        dom.goalRealEta.innerText = '¡Ya llegaste!';
        dom.goalRealEtaSub.innerText = '';
    } else {
        // En pesos de hoy: la meta queda fija, los aportes se suponen ajustados por inflación y el fondo rinde su promedio real
        const realMonths = monthsToGoal(tenencia, goal, avgNeto, rr);
        dom.goalRealEta.innerText = realMonths === null ? 'No se alcanza' : `~${formatEtaMonth(ctx.lastMonth, realMonths)}`;
        dom.goalRealEtaSub.innerText = realMonths === null
            ? 'con el aporte y rendimiento real promedio'
            : `en ${formatDuration(realMonths)} (meta de ${formatARS(goal)} en pesos de hoy)`;
    }
};

// ÚLTIMO DÍA HÁBIL (lunes a viernes) DEL MES DE dateStr. No contempla feriados.
const getLastWeekdayOfMonth = (dateStr) => {
    const [y, m] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(y, m, 0)); // último día del mes
    while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().split('T')[0];
};

const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24));

// Texto de "de dónde salió la plata" de un plazo fijo
const describeLadderSources = (sources) => {
    if (!sources || sources.length === 0) return '—';
    return sources.map(src => src.type === 'aportes'
        ? `Aportes de ${formatMonthLabel(src.month)} (${formatARS(src.amount)})`
        : `Renovación del PF del ${formatDateToLocale(src.from)} (${formatARS(src.amount)})`
    ).join('<br>');
};

// RENDERIZAR ESCALERA DE PLAZOS FIJOS (SIMULACIÓN)
const renderLadderSection = () => {
    if (!dom.ladderSection) return;
    if (state.subscriptions.length === 0 || !state.deltaHistory.length || !state.ratesFetched) {
        dom.ladderSection.classList.add('hidden');
        return;
    }

    const productKey = dom.ladderProduct ? dom.ladderProduct.value : 'uva';
    const endDate = state.currentFechaCierre || new Date().toISOString().split('T')[0];
    const trace = {};
    const result = productKey === 'uva'
        ? simulatePlazoFijoUvaSeries(state.subscriptions, endDate, trace)
        : simulatePlazoFijoMensualSeries(state.subscriptions, endDate, trace);

    if (!result || !trace.history) {
        dom.ladderSection.classList.add('hidden');
        return;
    }
    dom.ladderSection.classList.remove('hidden');

    const active = [...trace.active].sort((a, b) => (a.maturityDate < b.maturityDate ? -1 : 1));
    const capitalActivo = active.reduce((s, pf) => s + pf.capital, 0);
    const valorActivo = active.reduce((s, pf) => s + pf.valueToday, 0);
    const proximo = active[0];
    const total = valorActivo + trace.deltaValue + trace.pendingCash;

    // --- Resumen ---
    dom.ladderSummary.innerHTML = `
        <div class="goal-stat">
            <span class="goal-stat-label">Plazos fijos vigentes</span>
            <span class="goal-stat-value">${active.length}</span>
            <span class="goal-stat-sub">capital ${formatARS(capitalActivo)}</span>
        </div>
        <div class="goal-stat">
            <span class="goal-stat-label">Valor hoy de los plazos fijos</span>
            <span class="goal-stat-value">${formatARS(valorActivo)}</span>
            <span class="goal-stat-sub">con interés devengado (bloqueado hasta el vencimiento)</span>
        </div>
        <div class="goal-stat">
            <span class="goal-stat-label">Próximo vencimiento</span>
            <span class="goal-stat-value">${proximo ? formatDateToLocale(proximo.maturityDate) : '—'}</span>
            <span class="goal-stat-sub">${proximo ? `≈ ${formatARS(proximo.valueToday)} hoy · faltan ${daysBetween(endDate, proximo.maturityDate)} días` : 'sin plazos fijos vigentes'}</span>
        </div>
        <div class="goal-stat">
            <span class="goal-stat-label">Esperando en Delta</span>
            <span class="goal-stat-value">${formatARS(trace.deltaValue + trace.pendingCash)}</span>
            <span class="goal-stat-sub">aportes del mes en curso (líquido)</span>
        </div>
        <div class="goal-stat goal-stat-highlight">
            <span class="goal-stat-label">Total con esta estrategia</span>
            <span class="goal-stat-value">${formatARS(total)}</span>
            <span class="goal-stat-sub">al ${formatDateToLocale(endDate)}</span>
        </div>`;

    // --- Próximo traspaso de fin de mes y vencimientos cercanos ---
    const nextMonthEnd = getLastWeekdayOfMonth(endDate);
    const proxVencimientos = active.filter(pf => daysBetween(endDate, pf.maturityDate) <= 35);
    let next = `<b><i class="fa-solid fa-calendar-check"></i> Próximo traspaso: ≈ ${formatDateToLocale(nextMonthEnd)}</b> (último día hábil del mes, sin contar feriados).<br>` +
        `Hoy hay <b>${formatARS(trace.deltaValue + trace.pendingCash)}</b> en Delta para mover; se suma todo lo que aportes hasta ese día. ` +
        `Ese día se rescata de Delta y al día hábil siguiente se arma un plazo fijo ${productKey === 'uva' ? 'UVA a 90' : 'a 30'} días.`;
    if (proxVencimientos.length > 0) {
        next += `<br><b><i class="fa-solid fa-rotate"></i> Vencimientos en las próximas semanas:</b> ` +
            proxVencimientos.map(pf => `${formatDateToLocale(pf.maturityDate)} (≈ ${formatARS(pf.valueToday)} hoy)`).join(' · ') +
            ` → al vencer, se renueva (o se usa esa plata si la necesitás).`;
    }
    dom.ladderNextMove.innerHTML = next;

    // --- Tabla: vigentes primero (por vencimiento), después los vencidos (más recientes arriba) ---
    const done = trace.history.filter(pf => pf.status !== 'Vigente').sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
    const rows = [...active, ...done];
    dom.ladderTableBody.innerHTML = rows.length === 0
        ? `<tr><td colspan="7" class="text-center text-muted">Todavía no se cerró ningún mes: el primer plazo fijo se arma el último día hábil del mes.</td></tr>`
        : rows.map(pf => {
            const vigente = pf.status === 'Vigente';
            const faltan = vigente ? daysBetween(endDate, pf.maturityDate) : null;
            const value = vigente ? pf.valueToday : pf.maturityValue;
            return `
                <tr class="${vigente ? '' : 'ladder-row-done'}">
                    <td><strong>${formatDateToLocale(pf.startDate)}</strong></td>
                    <td style="font-size: 0.8rem;">${describeLadderSources(pf.sources)}</td>
                    <td class="text-right">${formatARS(pf.capital)}</td>
                    <td>${formatDateToLocale(pf.maturityDate)}</td>
                    <td class="text-right">${vigente ? `${faltan} días` : '—'}</td>
                    <td class="text-right" style="font-weight:600;">${formatARS(value)} <small style="color:var(--text-muted)">${vigente ? 'hoy' : 'al vencer'}</small></td>
                    <td class="text-center"><span class="ladder-status ${vigente ? 'vigente' : 'vencido'}">${vigente ? 'Vigente' : 'Vencido → renovado'}</span></td>
                </tr>`;
        }).join('');

    dom.ladderNote.innerText = productKey === 'uva'
        ? `Plazo fijo UVA: el capital ajusta por la variación de la UVA y paga además ${PF_UVA_TNA}% TNA (aproximación; cada banco fija su tasa y monto mínimo). No se puede retirar antes del vencimiento, salvo en la variante precancelable.`
        : 'Plazo fijo tradicional: interés simple con la TNA promedio de depósitos a 30 días (BCRA) del día en que se constituye.';
};

const recalculateAndRender = () => {
    // 1. Cálculos de métricas totales con manejo de Rescates
    let capitalTotal = 0;
    let cuotapartesTotales = 0;
    
    const chronSub = [...state.subscriptions].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    chronSub.forEach(s => {
        if (s.type === 'Rescate') {
            // Capital neto aportado = suscripciones - rescates. Sin tope en cero: si rescatás más de
            // lo que pusiste, esa diferencia es ganancia ya cobrada y debe seguir contando.
            capitalTotal -= s.amount;
            cuotapartesTotales -= s.cuotapartes;
            if (cuotapartesTotales < 0) cuotapartesTotales = 0;
        } else {
            capitalTotal += s.amount;
            cuotapartesTotales += s.cuotapartes;
        }
    });
    
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
    
    // 2.5 Ganancias Puras
    const fechaHoy = state.currentFechaCierre || new Date().toISOString().split('T')[0];
    const mesActualStr = fechaHoy.substring(0, 7);
    const cotizacionAyer = getCotizacionAyer(fechaHoy);
    const cotizacionMesAnterior = getCotizacionMesAnterior(fechaHoy);
    
    const gananciaDiariaPura = calcularGananciaDiariaPura(state.subscriptions, state.currentCotizacion, cotizacionAyer, fechaHoy);
    const gananciaMensualPura = calcularGananciaMensualPura(state.subscriptions, state.currentCotizacion, cotizacionMesAnterior, mesActualStr);
    
    // Subtítulos con el período exacto que mide cada tarjeta
    const fechaAyer = getPrevCloseDate(fechaHoy);
    const fechaCierreMesAnterior = getPrevCloseDate(mesActualStr + '-01');
    if (dom.valGananciaDiariaSub) {
        dom.valGananciaDiariaSub.innerText = fechaAyer
            ? `cierre ${formatDateShort(fechaAyer)} → ${formatDateShort(fechaHoy)}`
            : 'último cierre';
    }
    if (dom.valGananciaMensualSub) {
        dom.valGananciaMensualSub.innerText = fechaCierreMesAnterior
            ? `cierre ${formatDateShort(fechaCierreMesAnterior)} → ${formatDateShort(fechaHoy)}`
            : 'este mes';
    }

    // Actualizar DOM
    if (gananciaDiariaPura !== null) {
        dom.valGananciaDiaria.innerText = formatARS(gananciaDiariaPura);
        const cardD = dom.valGananciaDiaria.closest('.metric-card');
        cardD.className = 'card glass-card metric-card';
        if (gananciaDiariaPura >= 0) {
            cardD.classList.add('border-left-blue');
        } else {
            cardD.classList.add('border-left-red');
        }
    } else {
        dom.valGananciaDiaria.innerText = '---';
    }
    
    if (gananciaMensualPura !== null) {
        dom.valGananciaMensual.innerText = formatARS(gananciaMensualPura);
        const cardM = dom.valGananciaMensual.closest('.metric-card');
        cardM.className = 'card glass-card metric-card';
        if (gananciaMensualPura >= 0) {
            cardM.classList.add('border-left-purple');
        } else {
            cardM.classList.add('border-left-red');
        }
    } else {
        dom.valGananciaMensual.innerText = '---';
    }
    
    // 3. Calcular e imprimir comparativa de inversiones si hay datos
    let totalPlazoFijoVal = 0;
    let totalMercadoPagoVal = 0;
    let totalNaranjaXVal = 0;
    let totalDolarVal = 0;
    
    if (state.subscriptions.length > 0 && (state.ratesFetched || state.dolarFetched)) {
        dom.comparisonSection.classList.remove('hidden');
        
        const endSimulationDate = state.currentFechaCierre || new Date().toISOString().split('T')[0];
        
        // Plazo Fijo: estrategia realista (rescate mensual → PF 30 días).
        // Si todavía no cargó el histórico de Delta, se usa la simulación simple por movimiento.
        const pfMensualMap = simulatePlazoFijoMensualSeries(state.subscriptions, endSimulationDate);
        if (pfMensualMap) {
            totalPlazoFijoVal = pfMensualMap[endSimulationDate] || 0;
        }
        
        state.subscriptions.forEach(s => {
            const flowAmount = s.type === 'Rescate' ? -s.amount : s.amount;
            if (!pfMensualMap) totalPlazoFijoVal += simulatePlazoFijo(flowAmount, s.date, endSimulationDate);
            totalDolarVal += simulateDolarBlue(flowAmount, s.date, endSimulationDate);
        });
        
        // Mercado Pago y Naranja X se simulan como portafolio unificado (una pasada diaria)
        const mpValuationsMap = simulateMercadoPagoSeries(state.subscriptions, endSimulationDate);
        totalMercadoPagoVal = mpValuationsMap[endSimulationDate] || 0;
        const nxValuationsMap = simulateNaranjaXSeries(state.subscriptions, endSimulationDate);
        totalNaranjaXVal = nxValuationsMap[endSimulationDate] || 0;
        
        // Renderizar Plazo Fijo UVA
        const pfUvaMap = simulatePlazoFijoUvaSeries(state.subscriptions, endSimulationDate);
        if (pfUvaMap && dom.valCompPlazoFijoUva) {
            const totalPfUva = pfUvaMap[endSimulationDate] || 0;
            dom.valCompPlazoFijoUva.innerText = formatARS(totalPfUva);
            const diffUva = totalPfUva - tenenciaValorizada;
            formatDiffBadge(dom.diffCompPlazoFijoUva, diffUva, tenenciaValorizada > 0 ? (diffUva / tenenciaValorizada) * 100 : 0);
        }

        // Renderizar Plazo Fijo
        dom.valCompPlazoFijo.innerText = formatARS(totalPlazoFijoVal);
        const diffPF = totalPlazoFijoVal - tenenciaValorizada;
        const diffPFPercent = tenenciaValorizada > 0 ? (diffPF / tenenciaValorizada) * 100 : 0;
        formatDiffBadge(dom.diffCompPlazoFijo, diffPF, diffPFPercent);
        
        // Renderizar Mercado Pago
        dom.valCompMercadoPago.innerText = formatARS(totalMercadoPagoVal);
        const diffMP = totalMercadoPagoVal - tenenciaValorizada;
        const diffMPPercent = tenenciaValorizada > 0 ? (diffMP / tenenciaValorizada) * 100 : 0;
        formatDiffBadge(dom.diffCompMercadoPago, diffMP, diffMPPercent);

        // Renderizar Naranja X
        dom.valCompNaranjaX.innerText = formatARS(totalNaranjaXVal);
        const diffNX = totalNaranjaXVal - tenenciaValorizada;
        const diffNXPercent = tenenciaValorizada > 0 ? (diffNX / tenenciaValorizada) * 100 : 0;
        formatDiffBadge(dom.diffCompNaranjaX, diffNX, diffNXPercent);
        
        // Renderizar Dólar Blue
        dom.valCompDolar.innerText = formatARS(totalDolarVal);
        const diffDolar = totalDolarVal - tenenciaValorizada;
        const diffDolarPercent = tenenciaValorizada > 0 ? (diffDolar / tenenciaValorizada) * 100 : 0;
        formatDiffBadge(dom.diffCompDolar, diffDolar, diffDolarPercent);
    } else {
        dom.comparisonSection.classList.add('hidden');
    }
    
    // 4. Renderizar la tabla de movimientos y el resumen mensual
    renderMovementsTable();
    renderMonthlySection();
    renderLadderSection();
    
    // 5. Aplicar visibilidad de tarjetas del panel y la leyenda personalizada
    const keys = ['capital', 'delta', 'plazofijo', 'plazofijouva', 'mercadopago', 'naranjax', 'dolar'];
    keys.forEach(key => {
        const cardElement = getCardForTarget(key);
        if (cardElement) {
            if (state.activeInvestments[key]) {
                cardElement.classList.remove('hidden');
            } else {
                cardElement.classList.add('hidden');
            }
        }
        
        const legendItem = document.querySelector(`.legend-item[data-target="${key}"]`);
        if (legendItem) {
            if (state.activeInvestments[key]) {
                legendItem.classList.remove('inactive');
            } else {
                legendItem.classList.add('inactive');
            }
        }
    });
    
    // 6. Renderizar o actualizar el gráfico de evolución
    renderChart(capitalTotal, cuotapartesTotales, tenenciaValorizada, totalPlazoFijoVal, totalMercadoPagoVal, totalNaranjaXVal, totalDolarVal);
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
        
        const typeLabel = s.type === 'Rescate' ? 'Rescate' : 'Suscripción';
        const rowClass = s.type === 'Rescate' ? 'row-rescate' : 'row-suscripcion';
        const dotClass = s.type === 'Rescate' ? 'error' : 'success';
        const amountSign = s.type === 'Rescate' ? '-' : '';
        
        tr.className = rowClass;
        tr.innerHTML = `
            <td style="text-align: center;">
                <div class="table-checkbox">
                    <input type="checkbox" class="row-checkbox" data-id="${s.id}">
                    <label></label>
                </div>
            </td>
            <td><strong>${formatDateToLocale(s.date)}</strong></td>
            <td>Delta Retorno Real</td>
            <td><span class="status-dot ${dotClass}"></span> ${typeLabel} ${s.manual ? '<small style="color:var(--text-muted)">(Manual)</small>' : ''}</td>
            <td class="text-right font-weight-bold" style="font-weight: 600;">${amountSign}${formatARS(s.amount)}</td>
            <td class="text-right text-muted">${formatCotizacion(s.cotizacion)}</td>
            <td class="text-right">${amountSign}${formatCuotapartes(s.cuotapartes)}</td>
            <td class="text-center" style="display: flex; justify-content: center; gap: 4px;">
                <button class="btn-primary-icon btn-edit-row" data-id="${s.id}" title="Editar movimiento">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-danger-icon btn-delete-row" data-id="${s.id}" title="Eliminar movimiento">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        
        dom.tableBody.appendChild(tr);
    });
    
    // Restablecer Master Checkbox
    if (dom.checkAllMovements) {
        dom.checkAllMovements.checked = false;
    }
    updateDeleteSelectedButton();
    
    // Agregar event listeners a los checkboxes de las filas
    document.querySelectorAll('.row-checkbox').forEach(chk => {
        chk.addEventListener('change', () => {
            updateMasterCheckbox();
            updateDeleteSelectedButton();
        });
    });
    
    // Agregar event listeners a los botones de editar fila
    document.querySelectorAll('.btn-edit-row').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            loadMovementIntoForm(id);
        });
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
const renderChart = (totalCapital, totalCuotapartes, currentValuation, totalPlazoFijoVal, totalMercadoPagoVal, totalNaranjaXVal, totalDolarVal) => {
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
    
    // Simular Naranja X para toda la serie hasta la última fecha de cierre disponible
    const apiCloseDate = state.currentFechaCierre || new Date().toISOString().split('T')[0];
    const nxValuationsMap = simulateNaranjaXSeries(chronSub, apiCloseDate);
    const mpValuationsMap = state.ratesFetched ? simulateMercadoPagoSeries(chronSub, apiCloseDate) : {};
    const pfMensualMap = state.ratesFetched ? simulatePlazoFijoMensualSeries(chronSub, apiCloseDate) : null;
    
    // Agrupar por fechas
    const dataPoints = [];
    let accumCapital = 0;
    let accumCuotapartes = 0;
    
    chronSub.forEach((s, idx) => {
        // Si el próximo movimiento es del mismo día, el punto de ese día lo calcula el último movimiento del día
        const isLastOfDay = idx === chronSub.length - 1 || chronSub[idx + 1].date !== s.date;
        const flowAmount = s.type === 'Rescate' ? -s.amount : s.amount;
        const flowCuotas = s.type === 'Rescate' ? -s.cuotapartes : s.cuotapartes;
        
        accumCapital += flowAmount; // sin tope en cero (ver recalculateAndRender)
        
        accumCuotapartes += flowCuotas;
        if (accumCuotapartes < 0) accumCuotapartes = 0;
        
        // La tenencia valorizada histórica en esta fecha se calcula en base a la cotización registrada ese día
        const valuationOnDate = accumCuotapartes * s.cotizacion;
        
        // Simular Plazo Fijo, Mercado Pago y Dolar Blue acumulados hasta esta fecha s.date
        if (!isLastOfDay) return;
        
        // chronSub está ordenado: los movimientos hasta esta fecha son chronSub[0..idx]
        const subsUpToThisDate = chronSub.slice(0, idx + 1);
        const pfValuationOnDate = pfMensualMap ? (pfMensualMap[s.date] || 0) : state.ratesFetched ? subsUpToThisDate.reduce((sum, sub) => sum + simulatePlazoFijo(sub.type === 'Rescate' ? -sub.amount : sub.amount, sub.date, s.date), 0) : 0;
        const mpValuationOnDate = mpValuationsMap[s.date] || 0;
        const nxValuationOnDate = nxValuationsMap[s.date] || 0;
        const dolarValuationOnDate = state.dolarFetched ? subsUpToThisDate.reduce((sum, sub) => sum + simulateDolarBlue(sub.type === 'Rescate' ? -sub.amount : sub.amount, sub.date, s.date), 0) : 0;
        
        {
            dataPoints.push({
                date: s.date,
                capital: accumCapital,
                cuotapartes: accumCuotapartes,
                valuation: valuationOnDate,
                plazoFijo: pfValuationOnDate,
                mercadoPago: mpValuationOnDate,
                naranjax: nxValuationOnDate,
                dolar: dolarValuationOnDate
            });
        }
    });
    
    // 3. Añadir el punto actual (hoy) para cerrar el gráfico en la cotización vigente
    const latestDateInSubs = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].date : '';
    
    // Añadimos solo si la fecha del cierre de la API es posterior a la última suscripción
    if (latestDateInSubs && new Date(apiCloseDate) > new Date(latestDateInSubs)) {
        const pfValToday = pfMensualMap ? (pfMensualMap[apiCloseDate] || 0) : state.ratesFetched ? chronSub.reduce((sum, sub) => sum + simulatePlazoFijo(sub.type === 'Rescate' ? -sub.amount : sub.amount, sub.date, apiCloseDate), 0) : 0;
        const mpValToday = mpValuationsMap[apiCloseDate] || 0;
        const nxValToday = nxValuationsMap[apiCloseDate] || 0;
        const dolarValToday = state.dolarFetched ? chronSub.reduce((sum, sub) => sum + simulateDolarBlue(sub.type === 'Rescate' ? -sub.amount : sub.amount, sub.date, apiCloseDate), 0) : 0;
        
        dataPoints.push({
            date: apiCloseDate,
            capital: totalCapital,
            cuotapartes: totalCuotapartes,
            valuation: currentValuation,
            plazoFijo: pfValToday,
            mercadoPago: mpValToday,
            naranjax: nxValToday,
            dolar: dolarValToday
        });
    } else if (dataPoints.length > 0) {
        // Si la cotización actual es del mismo día o anterior, actualizamos la última valuación con la cotización de la API y las simuladas
        dataPoints[dataPoints.length - 1].valuation = currentValuation;
        dataPoints[dataPoints.length - 1].plazoFijo = totalPlazoFijoVal;
        dataPoints[dataPoints.length - 1].mercadoPago = totalMercadoPagoVal;
        dataPoints[dataPoints.length - 1].naranjax = totalNaranjaXVal;
        dataPoints[dataPoints.length - 1].dolar = totalDolarVal;
    }
    
    // Preparar arrays para el gráfico
    const labels = dataPoints.map(dp => formatDateToLocale(dp.date));
    const capitalData = dataPoints.map(dp => dp.capital);
    const valuationData = dataPoints.map(dp => dp.valuation);
    const pfData = dataPoints.map(dp => dp.plazoFijo || 0);
    const pfUvaMap = simulatePlazoFijoUvaSeries(chronSub, apiCloseDate);
    const pfUvaData = dataPoints.map(dp => (pfUvaMap ? pfUvaMap[dp.date] || 0 : 0));
    const mpData = dataPoints.map(dp => dp.mercadoPago || 0);
    const nxData = dataPoints.map(dp => dp.naranjax || 0);
    const dolarData = dataPoints.map(dp => dp.dolar || 0);
    
    // Configuración de Chart.js
    const ctx = document.getElementById('savings-chart').getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (state.chartInstance) {
        state.chartInstance.destroy();
    }
    
    // Gradientes
    const gradCapital = ctx.createLinearGradient(0, 0, 0, 300);
    gradCapital.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
    gradCapital.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
    
    const gradTenencia = ctx.createLinearGradient(0, 0, 0, 300);
    gradTenencia.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
    gradTenencia.addColorStop(1, 'rgba(139, 92, 246, 0.0)');
    
    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Delta Retorno Real',
                    data: valuationData,
                    borderColor: '#a855f7',
                    borderWidth: 3,
                    backgroundColor: gradTenencia,
                    fill: true,
                    tension: 0.15,
                    pointBackgroundColor: '#a855f7',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 3.5,
                    pointHoverRadius: 5.5,
                    hidden: !state.activeInvestments.delta
                },
                {
                    label: 'Simulación Plazo Fijo',
                    data: pfData,
                    borderColor: '#eab308',
                    borderWidth: 2,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: '#eab308',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 2.5,
                    pointHoverRadius: 4.5,
                    hidden: !state.activeInvestments.plazofijo
                },
                {
                    label: 'Simulación Plazo Fijo UVA',
                    data: pfUvaData,
                    borderColor: '#f472b6',
                    borderWidth: 2,
                    borderDash: [2, 3],
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: '#f472b6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 2.5,
                    pointHoverRadius: 4.5,
                    hidden: !state.activeInvestments.plazofijouva
                },
                {
                    label: 'Simulación Mercado Pago',
                    data: mpData,
                    borderColor: '#06b6d4',
                    borderWidth: 2,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: '#06b6d4',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 2.5,
                    pointHoverRadius: 4.5,
                    hidden: !state.activeInvestments.mercadopago
                },
                {
                    label: 'Simulación Naranja X',
                    data: nxData,
                    borderColor: '#ff5000',
                    borderWidth: 2,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: '#ff5000',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 2.5,
                    pointHoverRadius: 4.5,
                    hidden: !state.activeInvestments.naranjax
                },
                {
                    label: 'Simulación Dólar Blue',
                    data: dolarData,
                    borderColor: '#10b981',
                    borderWidth: 2,
                    backgroundColor: 'transparent',
                    fill: false,
                    tension: 0.1,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 2.5,
                    pointHoverRadius: 4.5,
                    hidden: !state.activeInvestments.dolar
                },
                {
                    label: 'Capital Invertido',
                    data: capitalData,
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    backgroundColor: gradCapital,
                    fill: true,
                    tension: 0.1,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 2,
                    pointHoverRadius: 4,
                    hidden: !state.activeInvestments.capital
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

// LIMPIAR TODO
const handleClearAll = () => {
    if (state.subscriptions.length === 0) return;
    if (confirm('¿Estás seguro de que querés borrar todos los movimientos? Esta acción no se puede deshacer.')) {
        state.subscriptions = [];
        saveLocalStorageData();
        recalculateAndRender();
        showAlert('Limpieza Completa', 'Todos los movimientos han sido eliminados.');
    }
};

// CHECK ALL (MAESTRO)
const handleCheckAll = (e) => {
    const isChecked = e.target.checked;
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(chk => chk.checked = isChecked);
    updateDeleteSelectedButton();
};

// ACTUALIZAR MASTER CHECKBOX STATE
const updateMasterCheckbox = () => {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (!dom.checkAllMovements) return;
    
    if (checkboxes.length > 0 && checkboxes.length === checkedBoxes.length) {
        dom.checkAllMovements.checked = true;
        dom.checkAllMovements.indeterminate = false;
    } else if (checkedBoxes.length > 0) {
        dom.checkAllMovements.checked = false;
        dom.checkAllMovements.indeterminate = true;
    } else {
        dom.checkAllMovements.checked = false;
        dom.checkAllMovements.indeterminate = false;
    }
};

// MOSTRAR/OCULTAR BOTÓN BORRAR SELECCIONADOS
const updateDeleteSelectedButton = () => {
    if (!dom.btnDeleteSelected) return;
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkedBoxes.length > 0) {
        dom.btnDeleteSelected.classList.remove('hidden');
        dom.btnDeleteSelected.innerHTML = `<i class="fa-solid fa-trash-can"></i> Borrar ${checkedBoxes.length}`;
    } else {
        dom.btnDeleteSelected.classList.add('hidden');
    }
};

// BORRAR SELECCIONADOS
const handleDeleteSelected = () => {
    const checkedBoxes = document.querySelectorAll('.row-checkbox:checked');
    if (checkedBoxes.length === 0) return;
    
    if (confirm(`¿Estás seguro de que querés borrar ${checkedBoxes.length} movimientos?`)) {
        const idsToDelete = Array.from(checkedBoxes).map(chk => chk.getAttribute('data-id'));
        state.subscriptions = state.subscriptions.filter(s => !idsToDelete.includes(s.id));
        saveLocalStorageData();
        recalculateAndRender();
        showAlert('Borrado Exitoso', `Se eliminaron ${idsToDelete.length} movimientos.`);
    }
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

// PROCESAMIENTO DE PDFs
async function handlePdfImport(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    dom.pdfLoader.classList.remove('hidden');
    
    let successCount = 0;
    let duplicateCount = 0;
    let importedRescates = 0;
    const failedFiles = [];
    
    // Claves de movimientos ya cargados, para no duplicar al reimportar los mismos PDFs
    const movementKey = (m) => `${m.type === 'Rescate' ? 'R' : 'S'}|${m.date}|${Number(m.amount).toFixed(2)}|${Number(m.cuotapartes).toFixed(4)}`;
    const existingReceipts = new Set(state.subscriptions.filter(s => s.receipt).map(s => s.receipt));
    const existingKeys = new Set(state.subscriptions.map(movementKey));
    
    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            if (dom.pdfLoaderText) {
                dom.pdfLoaderText.innerText = `Procesando comprobante ${i + 1} de ${files.length}...`;
            }
            // Ceder el control al navegador para que pueda repintar (evita que la pestaña parezca colgada)
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // Leer el archivo como ArrayBuffer
            const arrayBuffer = await file.arrayBuffer();
            
            // Cargar con PDF.js
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            let fullText = '';
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }
            
            const parsed = parseReceipt(fullText);
            if (parsed.date && parsed.amount && parsed.cuotapartes && parsed.cotizacion) {
                const key = movementKey(parsed);
                if ((parsed.receipt && existingReceipts.has(parsed.receipt)) || existingKeys.has(key)) {
                    duplicateCount++;
                    continue;
                }
                if (parsed.receipt) existingReceipts.add(parsed.receipt);
                existingKeys.add(key);
                
                const newSubscription = {
                    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    date: parsed.date,
                    amount: parsed.amount,
                    cuotapartes: parsed.cuotapartes,
                    cotizacion: parsed.cotizacion,
                    type: parsed.type,
                    receipt: parsed.receipt,
                    manual: true
                };
                
                state.subscriptions.push(newSubscription);
                if (newSubscription.type === 'Rescate') importedRescates += newSubscription.amount;
                successCount++;
            } else {
                console.warn(`No se pudieron extraer todos los datos del PDF: ${file.name}`, parsed);
                failedFiles.push(file.name);
            }
        }
        
        let detail = '';
        if (duplicateCount > 0) detail += `<br>Se omitieron ${duplicateCount} comprobantes ya cargados.`;
        if (failedFiles.length > 0) detail += `<br>No se pudieron leer ${failedFiles.length}: ${failedFiles.join(', ')}`;
        
        if (successCount > 0) {
            if (dom.pdfLoaderText) dom.pdfLoaderText.innerText = 'Calculando comparativas...';
            await new Promise(resolve => setTimeout(resolve, 0));
            state.subscriptions.sort((a, b) => new Date(b.date) - new Date(a.date));
            saveLocalStorageData();
            recalculateAndRender();
            const impact = importedRescates > 0 ? getRescateImpactMessage(importedRescates) : '';
            showAlert('Importación PDF Exitosa', `Se cargaron ${successCount} comprobantes correctamente.${detail}${impact}`);
        } else if (duplicateCount > 0) {
            showAlert('Sin Cambios', `Todos los comprobantes seleccionados ya estaban cargados.${detail}`);
        } else {
            showAlert('Importación Fallida', 'No se pudieron extraer datos válidos de los comprobantes. Verificá que sean liquidaciones del Banco Santa Fe válidas.');
        }
    } catch (err) {
        console.error(err);
        showAlert('Error al procesar', 'Ocurrió un error al leer el archivo PDF.');
    } finally {
        dom.pdfLoader.classList.add('hidden');
        dom.filePdfInput.value = ''; // Reset
    }
}

function parseReceipt(text) {
    let result = {
        receipt: null,       // Número de comprobante (para evitar duplicados)
        type: 'Suscripción', // default
        date: null,
        amount: null,
        cuotapartes: null,
        cotizacion: null
    };

    // Tipo de operación
    if (/LIQUIDACION DE RESCATE/i.test(text)) {
        result.type = 'Rescate';
    } else if (/LIQUIDACION DE SUSCRIPCION/i.test(text)) {
        result.type = 'Suscripción';
    }

    // Número de comprobante
    const receiptMatch = text.match(/Número:\s*(\d+)/i);
    if (receiptMatch) result.receipt = receiptMatch[1];

    // Monto
    const amountMatch = text.match(/(?:MONTO DEPOSITADO|IMPORTE NETO|IMPORTE A COBRAR)\s*\$\s*([\d\.,]+)/i);
    if (amountMatch) {
        let rawAmount = amountMatch[1].replace(/\./g, '').replace(',', '.');
        result.amount = parseFloat(rawAmount);
    }

    // Cuotapartes
    // Suscripción: "CUOTAPARTES SUSCRIPTAS:   337,5596" / Rescate: "CUOTAPARTES RESCATADAS   4.645,3263"
    const cuotasMatch = text.match(/CUOTAPARTES\s+(?:SUSCRIPTAS|RESCATADAS)\s*:?\s*([\d\.,]+)/i);
    if (cuotasMatch) {
        let rawCuotas = cuotasMatch[1].replace(/\./g, '').replace(',', '.');
        result.cuotapartes = parseFloat(rawCuotas);
    }
    
    // Cotización
    // Suscripción: "VALOR CUOTAPARTE:   103,685379" / Rescate: "VALOR DE LA CUOTAPARTE   $   107,992182"
    const cotMatch = text.match(/VALOR (?:DE LA )?CUOTAPARTE\s*:?\s*\$?\s*([\d\.,]+)/i);
    if (cotMatch) {
        let rawCot = cotMatch[1].replace(/\./g, '').replace(',', '.');
        result.cotizacion = parseFloat(rawCot);
    }

    // Fecha
    const dateMatch = text.match(/(\d{1,2})\s+de\s+([a-zA-Z]+)\s+de\s+(\d{4})/i);
    if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const months = {
            'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06',
            'julio': '07', 'agosto': '08', 'septiembre': '09', 'setiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
        };
        const month = months[dateMatch[2].toLowerCase()];
        const year = dateMatch[3];
        if (month) {
            result.date = `${year}-${month}-${day}`;
        }
    }

    // Fallback: si no encontró cotización, calcularla (Valor Cuotaparte)
    if (!result.cotizacion && result.amount && result.cuotapartes) {
        result.cotizacion = result.amount / result.cuotapartes;
    }

    return result;
}
