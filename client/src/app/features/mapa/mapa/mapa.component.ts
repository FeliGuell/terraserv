import { Component, OnDestroy, OnInit } from '@angular/core';
import * as L from 'leaflet';
import { GeoSearchControl, GoogleProvider } from 'leaflet-geosearch';
import { Subject, takeUntil } from 'rxjs';
import {
  LATITUD_SAN_JUAN,
  LONGITUD_SAN_JUAN,
  MAX_VALUE_LATITUDE,
  MAX_VALUE_LONGITUDE,
  MIN_VALUE_LATITUDE,
  MIN_VALUE_LONGITUDE,
  ZOOM_INICIAL,
} from 'src/app/core/constants/coordenadas.contants';
import {
  MAX_HEIGHT_POPUP,
  MAX_WIDTH_POPUP,
} from 'src/app/core/constants/mapa.constants';
import { EstudioGeofisico } from 'src/app/core/models/estudio-geofisico.interface';
import { EstudioGeofisicoService } from 'src/app/core/services/estudio-geofisico.service';
import { environment } from 'src/environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css'],
})
export class MapaComponent implements OnInit, OnDestroy {
  /**
   * Variables
   */
  map: L.Map; // Variable que almacena el mapa Leaflet
  estudiosGeofisicos: EstudioGeofisico[]; // Arreglo que contiene los estudios geofísicos
  destroy$ = new Subject<void>(); // Sujeto utilizado para manejar la destrucción de suscripciones y evitar fugas de memoria

  // Provider
  provider = new GoogleProvider({
    apiKey: `${environment.API_KEY_GOOGLE_PLACES}`,
  });

  /**
   * Crea un control de búsqueda geográfica utilizando la API de Google Places.
   *
   * Este control permite a los usuarios buscar y seleccionar ubicaciones en el mapa sin mostrar marcadores o popups.
   * Las opciones de configuración incluyen:
   * - `provider`: El proveedor de búsqueda geográfica, en este caso GoogleProvider con una clave API.
   * - `showMarker`: Si se muestra o no un marcador en la ubicación seleccionada.
   * - `showPopup`: Si se muestra o no un popup con información de la ubicación.
   * - `marker`: Configuración del marcador, incluyendo el ícono y si es arrastrable.
   * - `popupFormat`: Formato del popup que se muestra al seleccionar una ubicación.
   * - `maxMarkers`: Número máximo de marcadores a mostrar.
   * - `retainZoomLevel`: Si se mantiene o no el nivel de zoom después de una búsqueda.
   * - `animateZoom`: Si el zoom se anima al seleccionar una ubicación.
   * - `autoClose`: Si el control de búsqueda se cierra automáticamente después de una selección.
   * - `searchLabel`: Etiqueta del campo de búsqueda.
   * - `keepResult`: Si se mantiene o no el resultado de la búsqueda en el campo.
   */
  searchControl = GeoSearchControl({
    provider: this.provider,
    showMarker: false,
    showPopup: false,
    marker: {
      icon: new L.Icon.Default(),
      draggable: false,
    },
    popupFormat: ({ result }: { result: any }) => result.label,
    maxMarkers: 1,
    retainZoomLevel: false,
    animateZoom: true,
    autoClose: true,
    searchLabel: 'Enter location',
    keepResult: true,
  });

  customIconGray = L.icon({
    iconUrl: '../../../../assets/markers/gray-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });
  customIconBlue = L.icon({
    iconUrl: '../../../../assets/markers/blue-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });
  customIconLightBlue = L.icon({
    iconUrl: '../../../../assets/markers/lightblue-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });
  customIconGreen = L.icon({
    iconUrl: '../../../../assets/markers/green-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });
  customIconLightGreen = L.icon({
    iconUrl: '../../../../assets/markers/lightgreen-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });
  customIconBrown = L.icon({
    iconUrl: '../../../../assets/markers/brown-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });
  customIconRed = L.icon({
    iconUrl: '../../../../assets/markers/red-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });
  customIconOrange = L.icon({
    iconUrl: '../../../../assets/markers/orange-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });
  customIconYellow = L.icon({
    iconUrl: '../../../../assets/markers/yellow-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });
  customIconPurple = L.icon({
    iconUrl: '../../../../assets/markers/purple-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });
  customIconPink = L.icon({
    iconUrl: '../../../../assets/markers/pink-marker.png',
    iconSize: [40, 40] as L.PointTuple,
  });

  // Mapear el tipo de estudio a su ícono personalizado
  iconosPersonalizados: Record<string, L.Icon> = {
    GPR: this.customIconPurple,
    MASW: this.customIconBrown,
    PERFILAJE_POZO: this.customIconBlue,
    SEV_SCHLUMBERGER: this.customIconGreen,
    SEV_WENNER: this.customIconLightGreen,
    TOMOGRAFIA_ELECTRICA_DIPOLO_DIPOLO: this.customIconYellow,
    TOMOGRAFIA_ELECTRICA_DIPOLO_POLO: this.customIconOrange,
    TOMOGRAFIA_ELECTRICA_POLO_POLO: this.customIconRed,
    TOMOGRAFIA_SISMICA: this.customIconPink,
    MULTIPLE: this.customIconGray,
  };

  constructor(private estudioService: EstudioGeofisicoService) {}

  /**
   * Método que se ejecuta al iniciar el componente.
   *
   * Este método realiza las siguientes acciones:
   * - Inicializa el mapa si aún no está inicializado.
   * - Se suscribe a los estudios geofísicos de la consulta.
   * - Limpia los marcadores existentes en el mapa.
   * - Se suscribe al evento de búsqueda realizada.
   * - Si hay estudios disponibles, agrega marcadores al mapa.
   * - Si no hay estudios y se ha realizado una búsqueda, muestra un mensaje de advertencia.
   */
  ngOnInit(): void {
    // Inicializa el mapa si aún no está inicializado.
    if (!this.map) {
      this.inicializarMapa();
    }

    // Se inicializa en false
    let busquedaRealizada = false;

    // Se suscribe a los estudios geofísicos de la consulta.
    this.estudioService.estudios$
      .pipe(takeUntil(this.destroy$))
      .subscribe((estudios) => {
        // Limpia los marcadores existentes en el mapa.
        this.limpiarMarcadores();

        // Se suscribe al evento de búsqueda realizada.
        this.estudioService.busquedaRealizada$
          .pipe(takeUntil(this.destroy$))
          .subscribe(() => {
            busquedaRealizada = true;
          });

        if (busquedaRealizada) {
          // Si hay estudios disponibles, agrega marcadores al mapa.
          if (estudios && estudios.length > 0) {
            this.agregarMarcadores(estudios);
            Swal.fire({
              position: 'top',
              icon: 'info',
              title: 'Se encontró ' + estudios.length + ' estudios',
              showConfirmButton: false,
              timer: 1000,
            });
          } else {
            // Si no hay estudios y se ha realizado una búsqueda, muestra un mensaje de advertencia.
            Swal.fire({
              position: 'top',
              icon: 'warning',
              title: 'No hay resultados para mostrar',
              showConfirmButton: false,
              timer: 1000,
            });
          }
        }
      });
  }

  /**
   * Realiza las tareas de limpieza y finalización cuando el componente se destruye.
   * Esto incluye completar la suscripción al Subject destroy$.
   * @method ngOnDestroy
   * @returns {void}
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicializa el mapa en la ubicación de San Juan, Argentina, y configura las capas base y controles.
   *
   * Características del mapa:
   * - **Vista Inicial**: Centra el mapa en las coordenadas geográficas de San Juan con un nivel de zoom predeterminado.
   * - **Capas Base**: Añade múltiples capas base incluyendo OpenStreetMap y opciones de imágenes satelitales y topográficas.
   * - **Control de Búsqueda**: Incorpora una herramienta de búsqueda para localizar direcciones fácilmente.
   * - **Control de Capas**: Permite al usuario alternar entre las diferentes capas base disponibles.
   *
   * Las capas base disponibles son:
   * - Open Street Map: Proporciona una vista de calle estándar.
   * - Stadia Maps Satellite: Ofrece imágenes satelitales detalladas.
   * - Open Topo Map: Muestra un mapa topográfico detallado.
   */
  private inicializarMapa(): void {
    // Coordenadas de San Juan, Argentina
    const sanJuanCoords: [number, number] = [
      LATITUD_SAN_JUAN,
      LONGITUD_SAN_JUAN,
    ];
    const zoomLevel: number = ZOOM_INICIAL;

    // Crea el mapa y establece la vista inicial
    this.map = L.map('map').setView(sanJuanCoords, zoomLevel);

    // Define y añade la capa base de OpenStreetMap
    const osmTileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      }
    );

    // Define y añade la capa de imágenes satelitales de Stadia Maps
    const stadiaAlidadeSatellite = L.tileLayer(
      `https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg?api_key=${environment.API_KEY_STADIA_MAPS}`,
      {
        minZoom: 0,
        maxZoom: 20,
        attribution:
          '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

    // Define y añade la capa de OpenTopoMap
    const openTopoMap = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 17,
        attribution:
          'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
      }
    );

    // Agrupa las capas base en un objeto para su uso en el control de capas
    const baseMaps = {
      'Open Street Map': osmTileLayer,
      'Stadia Maps Satellite': stadiaAlidadeSatellite,
      'Open Topo Map': openTopoMap,
    };

    // Añade la capa base, el control de búsqueda al mapa y el control de las capas
    osmTileLayer.addTo(this.map);

    // Añade el control de búsqueda al mapa
    this.map.addControl(this.searchControl);

    // Añade el control de capas al mapa para permitir la selección de capas base
    L.control.layers(baseMaps).addTo(this.map);
  }

  /**
   * Agrega marcadores al mapa para cada estudio geofísico proporcionado.
   *
   * Este método realiza las siguientes acciones:
   * - Crea un array para almacenar las coordenadas de los marcadores.
   * - Itera sobre cada estudio geofísico y sus coordenadas.
   * - Valida las coordenadas y agrega marcadores al mapa.
   * - Ajusta la vista del mapa para incluir todos los marcadores.
   *
   * @param {EstudioGeofisico[]} estudios - Los estudios geofísicos para los cuales agregar marcadores.
   */
  private agregarMarcadores(estudios: EstudioGeofisico[]): void {
    const bounds: L.LatLngExpression[] = []; // Array para las coordenadas de los marcadores.

    estudios.forEach((estudio) => {
      estudio.coordenadas?.forEach((coordenada) => {
        const { latitudDecimal: lat, longitudDecimal: lng } = coordenada;
        if (this.validarCoordenadas(lat!, lng!)) {
          bounds.push([lat!, lng!]); // Agrega coordenadas válidas a bounds.

          // Determina el ícono basado en el tipo de estudio.
          const icono = this.obtenerIconoEstudio(estudio.tiposEstudio);

          // Crea y agrega el marcador al mapa.
          const marker = L.marker([lat!, lng!], { icon: icono }).addTo(
            this.map
          );
          this.agregarPopup(marker, estudio); // Agrega un popup al marcador.
        }
      });
    });

    if (bounds.length > 0) {
      const boundsObject = L.latLngBounds(bounds);
      this.map.fitBounds(boundsObject); // Ajusta la vista del mapa.
    }
  }

  /**
   * Obtiene el ícono personalizado para el marcador basado en el tipo de estudio.
   *
   * @param {Set<string> | undefined} tiposEstudios - El conjunto de tipos de estudio.
   * @returns {L.Icon} - El ícono personalizado para el marcador.
   */
  private obtenerIconoEstudio(tiposEstudios: Set<string> | undefined): L.Icon {
    const tipos = Array.from(tiposEstudios!);
    return tipos.length > 1
      ? this.iconosPersonalizados['MULTIPLE']
      : this.iconosPersonalizados[tipos[0]];
  }

  /**
   * Elimina todos los marcadores del mapa.
   *
   * Este método recorre todas las capas del mapa y elimina aquellas que son instancias de L.Marker,
   * efectivamente limpiando todos los marcadores existentes en el mapa.
   */
  private limpiarMarcadores(): void {
    this.map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        this.map.removeLayer(layer); // Elimina el marcador del mapa
      }
    });
  }

  /**
   * Asocia un popup informativo a un marcador en el mapa.
   *
   * El popup muestra detalles del estudio geofísico, como el nombre del estudio,
   * el nombre del cliente, la fecha en que se realizó y una descripción breve.
   * También incluye un enlace para ver más detalles del estudio.
   *
   * @param {L.Marker} marker - El marcador al que se le agregará el popup.
   * @param {EstudioGeofisico} estudio - El estudio geofísico asociado al marcador.
   */
  private agregarPopup(marker: L.Marker, estudio: EstudioGeofisico): void {
    // Define el contenido HTML del popup.
    const popupContent = `
    <div>
      <h5 class="fw-medium">${estudio.nombreEstudio}</h5>
      <p class="my-1"><strong>Nombre cliente: </strong> ${estudio.nombreCliente}</p>
      <p class="my-1"><strong>Fecha realizado: </strong> ${estudio.fechaRealizado}</p>
      <p class="my-1"><strong>Descripción: </strong> <span>${estudio.descripcion}</span></p>
      <a class="link-offset-2 link-offset-3-hover link-underline link-underline-opacity-0 link-underline-opacity-75-hover" href="/estudios/details/${estudio.id}" target="_blank"> Ver detalles <i class="bi bi-box-arrow-up-right"></i></a>
    </div>
  `;

    // Configura y agrega el popup al marcador.
    marker.bindPopup(popupContent, {
      maxWidth: MAX_WIDTH_POPUP, // ancho máximo del popup
      maxHeight: MAX_HEIGHT_POPUP, // altura máxima del popup
    });
  }

  /**
   * Valida que las coordenadas proporcionadas estén dentro de los límites aceptables y no estén vacías.
   *
   * @param {number} latitud - La latitud a validar.
   * @param {number} longitud - La longitud a validar.
   * @returns {boolean} - Verdadero si las coordenadas son válidas, falso en caso contrario.
   */
  private validarCoordenadas(latitud: number, longitud: number): boolean {
    if (
      latitud &&
      longitud &&
      latitud >= MIN_VALUE_LATITUDE &&
      latitud <= MAX_VALUE_LATITUDE &&
      longitud >= MIN_VALUE_LONGITUDE &&
      longitud <= MAX_VALUE_LONGITUDE
    ) {
      return true;
    }
    return false;
  }
}
