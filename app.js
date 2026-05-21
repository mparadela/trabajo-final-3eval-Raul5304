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
        apiStatusEl.textContent = '✗ Sin conexión con la API';
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


// Crea una tarjeta de evento en el DOM
function renderizarEvento(evento) {
    const card = document.createElement('div');

    card.className = `event-card ${evento.esFestivo ? 'holiday' : 'user-event'}`;

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
    `;

    eventListEl.appendChild(card);
}

// ARRANQUE -----------------------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', cargarFestivos);