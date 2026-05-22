// CLASE Evento: representa cualquier evento de la agenda, ya sea un festivo cargado de la API o un evento creado por el usuario.

class Evento {
    constructor(id, titulo, fecha, hora, esFestivo) {
        this.id       = id;        
        this.titulo   = titulo;    
        this.fecha    = fecha;     
        this.hora     = hora;      
        this.esFestivo = esFestivo; // true = festivo de la API, false = evento propio
    }

    // Devuelve la fecha en formato legible DD/MM/YYYY
    fechaFormateada() {
        const [anio, mes, dia] = this.fecha.split('-');
        return `${dia}/${mes}/${anio}`;
    }

    // Devuelve una descripción de fecha (y hora si la tiene) para mostrar en la tarjeta
    descripcion() {
        const horaTexto = this.hora ? ` — ${this.hora} h` : '';
        return `${this.fechaFormateada()}${horaTexto}`;
    }
}

// CARGA DE FESTIVOS ----------------------------------------------------------------------------

// Se consulta la API de Nager.date al arrancar la página para obtener los festivos nacionales de España
const API_URL = 'https://date.nager.at/api/v3/PublicHolidays/2025/ES';

const apiStatusEl = document.getElementById('api-status');
const eventListEl = document.getElementById('event-list');


// Petición GET a la API
async function cargarFestivos() {
    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        const datos = await respuesta.json();

        // Esto es para actualizar el badge del header para indicar que cargó bien
        apiStatusEl.textContent = `${datos.length} festivos cargados`;
        apiStatusEl.style.color = '#0f9d58';

        // Se vacía el mensaje por defecto 
        eventListEl.innerHTML = '';

        // Por cada festivo que devuelve la API, creamos un objeto Evento y lo pintamos
        datos.forEach(item => {
            const festivo = new Evento(
                item.date,
                item.localName,
                item.date,
                null,            // this.hora -> los festivos no tienen hora concreta
                true             // this.esfestivo -> marcamos que es un festivo para tratarlo diferente al resto
            );
            renderizarEvento(festivo);
        });
    }catch (error){
        apiStatusEl.textContent = 'Sin conexión con la API';
        apiStatusEl.style.color = '#d93025';

        eventListEl.innerHTML = `
            <p class="empty-msg" style="color: #d93025;">
                No se pudieron cargar los festivos. Comprueba tu conexión a internet.
            </p>
        `;

        // Para ver el error en consola y saber que está fallando
        console.error('Error al cargar los festivos:', error);
    }
}


// Crea y añade al DOM una tarjeta de evento. Si es un evento de usuario, incluye un botón para eliminarlo
function renderizarEvento(evento) {
    const card = document.createElement('div');
    card.className = `event-card ${evento.esFestivo ? 'holiday' : 'user-event'}`;

    // Guardamos el id como atributo del elemento para poder encontrarlo al eliminar
    card.dataset.id = evento.id;

    card.innerHTML = `
        <div class="event-info">
            <div class="event-title">
                ${evento.titulo}
                <span class="badge ${evento.esFestivo ? 'badge-holiday' : 'badge-user'}">
                    ${evento.esFestivo ? 'Festivo' : 'Mi evento'}
                </span>
            </div>
            <div class="event-date">${evento.descripcion()}</div>
        </div>
        ${evento.esFestivo ? '' : '<button class="btn-delete" title="Eliminar evento">✕</button>'}
    `;

    // Solo los eventos del usuario tienen botón de eliminar, los festivos no
    if (!evento.esFestivo) {
        card.querySelector('.btn-delete').addEventListener('click', () => {
            eliminarEvento(evento.id);
        });
    }

    eventListEl.appendChild(card);
}

// GESTIÓN DE EVENTOS PROPIOS
// El usuario puede rellenar el formulario para crear eventos y también eliminarlos

const modalOverlay  = document.getElementById('modal-overlay');
const btnOpenModal  = document.getElementById('btn-open-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnCancel     = document.getElementById('btn-cancel');
const eventForm     = document.getElementById('event-form');

// Array en memoria que guarda los eventos creados por el usuario.
let eventosUsuario = [];

function abrirModal() {
    modalOverlay.classList.remove('hidden');
}

function cerrarModal() {
    modalOverlay.classList.add('hidden');
    eventForm.reset();
    limpiarErrores();
}

// VALIDACIÓN DEL FORMULARIO -----------------------------------------------------------------------

function limpiarErrores() {
    document.getElementById('error-title').textContent = '';
    document.getElementById('error-date').textContent = '';
    document.getElementById('error-time').textContent = '';
}

// Valida los campos, rellena los spans de error si hay problema y devuelve true solo si todo es correcto.
function validarFormulario() {
    const titulo = document.getElementById('title').value.trim();
    const fecha  = document.getElementById('date').value;
    const hora   = document.getElementById('time').value;

    const errorTitulo = document.getElementById('error-title');
    const errorFecha  = document.getElementById('error-date');
    const errorHora   = document.getElementById('error-time');

    // Esto es para iniciar sin errores, asumiendo que el formulario es valido.
    let esValido = true;
    limpiarErrores();

    if (titulo === '') {
        errorTitulo.textContent = 'El título no puede estar vacío.';
        esValido = false;
    }

    if (fecha === '') {
        errorFecha.textContent = 'La fecha es obligatoria.';
        esValido = false;
    } else {
        const hoy = new Date().toISOString().split('T')[0]; // Split T corta la fecha por delante de las horas

        if (fecha < hoy) {
            errorFecha.textContent = 'La fecha no puede ser anterior a hoy.';
            esValido = false;
        }
    }

    // [01]\d -> horas de 00 a 19
    // 2[0-3] -> horas de 20 a 23
    // [0-5]\d -> minutos de 00 a 59
    const regexHora = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (hora === '') {
        errorHora.textContent = 'La hora es obligatoria.';
        esValido = false;
    } else if (!regexHora.test(hora)) {
        errorHora.textContent = 'La hora debe tener formato HH:MM (ej. 09:30).';
        esValido = false;
    }

    return esValido;
}

// Básicamente lee el formulario, crea un objeto de Evento y lo muestra
function crearEvento(e) {
    e.preventDefault();

    if (!validarFormulario()) return;

    const titulo = document.getElementById('title').value.trim();
    const fecha  = document.getElementById('date').value;
    const hora   = document.getElementById('time').value;

    const nuevoEvento = new Evento(Date.now(), titulo, fecha, hora, false);

    eventosUsuario.push(nuevoEvento);

    renderizarEvento(nuevoEvento);
    guardarEnLocalStorage();
    cerrarModal();
}

function eliminarEvento(id) {
    eventosUsuario = eventosUsuario.filter(evento => evento.id !== id);
    guardarEnLocalStorage();

    const card = document.querySelector(`[data-id="${id}"]`);
    if (card) card.remove();
}

// LOCALSTORAGE -----------------------------------------------------------------------------------

function guardarEnLocalStorage() {
    localStorage.setItem('eventosUsuario', JSON.stringify(eventosUsuario));
}

// Lee localStorage, reconstruye los objetos Evento y los pinta en la lista.
function cargarDesdeLocalStorage() {
    const datos = localStorage.getItem('eventosUsuario');

    if (!datos) return;

    const eventosGuardados = JSON.parse(datos);

    eventosGuardados.forEach(obj => {

        // Reconstruimos cada uno con new Evento() para recuperar sus métodos.
        const evento = new Evento(obj.id, obj.titulo, obj.fecha, obj.hora, obj.esFestivo);

        eventosUsuario.push(evento);
        renderizarEvento(evento);
    });
}

// Conecta todos los listeners del modal y el formulario.
function inicializarCRUD() {
    cargarDesdeLocalStorage();

    btnOpenModal.addEventListener('click', abrirModal);
    btnCloseModal.addEventListener('click', cerrarModal);
    btnCancel.addEventListener('click', cerrarModal);
    eventForm.addEventListener('submit', crearEvento);

    // Esto es para que si se hace clic fuera del formulario se cierra
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === modalOverlay) cerrarModal();
    });
}

// ARRANQUE -----------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    cargarFestivos();
    inicializarCRUD();
});