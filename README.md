# MisAhorros - Delta Retorno Real

**MisAhorros** es una aplicación web interactiva y de cliente único (Single Page Application) diseñada para realizar el seguimiento visual, diario y preciso de tus inversiones financieras. 

La aplicación está optimizada específicamente para el seguimiento del Fondo Común de Inversión (FCI) **Delta Retorno Real - Clase A** (anteriormente conocido como *Delta Gestión VIII*), un fondo gestionado por Delta Asset Management S.A. en Argentina que tiene como objetivo ganarle a la inflación a través de activos indexados por CER (coeficiente de estabilización de referencia).

---

## 🎯 Propósito de la Aplicación

Cuando invertimos en Fondos Comunes de Inversión, los brokers y bancos suelen mostrar únicamente el saldo actual y los movimientos individuales, pero no siempre facilitan visualizar de forma clara e interactiva la **evolución histórica del capital invertido frente a la ganancia real obtenida**. 

**MisAhorros** resuelve esto permitiéndote:
1. **Registrar todas tus suscripciones (depósitos):** Pudiendo hacerlo de forma automática o ingresando los datos exactos del comprobante.
2. **Visualizar el crecimiento de tus ahorros:** Comparando en un gráfico de líneas dinámico el dinero total que depositaste (*Capital Invertido*) vs. lo que vale tu inversión al valor cuotaparte del día (*Tenencia Valorizada*).
3. **Calcular rendimientos netos al instante:** Conocer en tiempo real cuánto dinero ganaste en pesos ($) y qué porcentaje de retorno representa sobre tu capital inicial.

---

## 🚀 Características Principales

### 1. Conexión en Tiempo Real con la API
La aplicación se conecta de forma automática en cada inicio a la API pública y gratuita de **ArgentinaDatos**. Esta API recopila los cierres diarios de la Cámara Argentina de Fondos Comunes de Inversión (CAFCI). 
* Obtiene el valor cuotaparte (VCP) actualizado al último cierre hábil bursátil.
* Calcula la variación porcentual diaria del fondo y muestra la fecha del último cierre registrado.

### 2. Carga Inteligente de Movimientos (Smart Fallback)
Al registrar una nueva suscripción, la app ofrece la **Opción C** de carga flexible:
* **Carga Automática (Recomendada):** Ingresás la fecha de concertación y el importe en pesos ($). La app consulta la API de forma histórica en segundo plano para obtener el valor cuotaparte de ese día y calcular automáticamente cuántas cuotapartes compraste.
* **Carga Manual (Smart Fallback):** Si ingresás un movimiento en un día sin cotización (fines de semana, feriados) o si la API experimenta problemas temporales de conexión, la app lo detectará automáticamente y habilitará campos manuales para que ingreses la cotización o las cuotapartes de tu comprobante, garantizando que nunca se rompa tu historial.

### 3. Métricas Financieras Clave
Presentación premium mediante tarjetas visuales dinámicas:
* **Capital Invertido:** La suma total de pesos ($) que has destinado a las suscripciones.
* **Tenencia Valorizada:** El valor de mercado actual de tus cuotapartes acumuladas (`Total Cuotapartes × Cotización del Día`).
* **Rendimiento Neto:** La ganancia o pérdida real acumulada en pesos ($) y su equivalencia en porcentaje (%) de retorno de inversión. Cambia dinámicamente de color (verde/rojo) y de ícono según el estado.

### 4. Gráfico Evolutivo Interactivo
Impulsado por **Chart.js**, el gráfico traza cronológicamente tus depósitos. Muestra una línea discontinua azul (*Capital Invertido*) y una línea sólida violeta con sombreado de gradiente (*Tenencia Valorizada*), extendiéndose hasta el día de hoy con la cotización del último cierre.

### 5. Privacidad y Portabilidad de Datos (100% Local)
* **Privacidad Absoluta:** Tus datos financieros no se envían a ningún servidor externo. Se guardan localmente en el almacenamiento seguro de tu propio navegador (`localStorage`).
* **Portabilidad y Respaldo:** Cuenta con funciones integradas para **Exportar** tu base de datos a un archivo JSON y volver a **Importarla** en cualquier momento, lo que te permite transferir tus registros a otros dispositivos o tener copias de seguridad de forma segura.

---

## 🛠️ Tecnologías Utilizadas

La aplicación fue desarrollada buscando la máxima velocidad de carga, control y compatibilidad, evitando dependencias pesadas de compilación:
* **HTML5:** Estructura semántica optimizada y estructurada para buenas prácticas de SEO.
* **CSS3 (Vanilla):** Diseño premium basado en el estilo moderno *Glassmorphism* (efecto cristal esmerilado con `backdrop-filter`, sombras suaves, bordes iluminados por gradientes y transiciones fluidas). Completamente adaptado a pantallas móviles, tablets y monitores grandes (diseño responsivo).
* **JavaScript (ES6+):** Lógica pura para peticiones asíncronas (`Fetch API`), procesamiento de datos financieros y manipulación dinámica del DOM.
* **Chart.js (CDN):** Librería externa ágil y visualmente atractiva para el renderizado del gráfico en un elemento `<canvas>`.
* **FontAwesome (CDN):** Kit de íconos vectoriales modernos y estilizados.

---

## 💻 Cómo Ejecutar la Aplicación en tu PC

No necesitás instalar bases de datos, Node.js, ni servidores web complejos para utilizarla. Al ser una aplicación estática del lado del cliente:

1. Cloná o descargá este repositorio.
2. Buscá el archivo **`index.html`** dentro de la carpeta.
3. Hacé doble clic sobre él (se abrirá automáticamente en tu navegador web Chrome, Firefox, Edge, Safari, etc.).

---

## 📂 Importar Datos de Demostración (Inicio Rápido)

Para probar la aplicación inmediatamente con el historial real que se muestra en las capturas del proyecto (un total de **$1.266.155,47** invertidos en 7 suscripciones durante junio de 2026):

1. Abrí la aplicación en tu navegador.
2. Hacé clic en el botón **Importar** ubicado en la esquina derecha de la sección de movimientos.
3. Seleccioná el archivo **`backup_demo.json`** que se encuentra en la carpeta raíz del proyecto.
4. Confirmá la importación.
5. La app cargará instantáneamente los movimientos históricos con sus cuotapartes exactas y verás las tarjetas de rendimiento valorizando tu tenencia actual en **$1.275.813,43** (basado en la cotización de $103,869968).
