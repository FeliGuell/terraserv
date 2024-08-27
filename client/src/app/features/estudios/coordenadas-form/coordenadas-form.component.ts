import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { MarkerGroup } from 'src/app/core/models/marker-group.interface';
import * as L from 'leaflet';
import { environment } from 'src/environments/environment';
import { GoogleProvider, GeoSearchControl } from 'leaflet-geosearch';
import {
  LATITUD_SAN_JUAN,
  LONGITUD_SAN_JUAN,
  MAX_QUANTITY_COORDENADAS,
  MAX_VALUE_LATITUDE,
  MAX_VALUE_LONGITUDE,
  MIN_QUANTITY_COORDENADAS,
  MIN_VALUE_LATITUDE,
  MIN_VALUE_LONGITUDE,
  ZOOM_INICIAL,
} from 'src/app/core/constants/coordenadas.contants';

@Component({
  selector: 'app-coordenadas-form',
  templateUrl: './coordenadas-form.component.html',
  styleUrls: ['./coordenadas-form.component.css'],
})
//
export class CoordenadasFormComponent implements OnInit, OnChanges {
  // Formulario padre al que pertenece este componente
  @Input() parentForm: FormGroup;

  // Indicador de si el estudio para editar ha terminado de cargarse
  @Input() uploadEstudioToEditFinish: boolean = false;

  // Mapa de Leaflet
  map: L.Map;
  // Grupo de marcadores en el mapa
  markers: MarkerGroup[] = [];
  // Contador de coordenadas agregadas
  contadorCoordenadas: number = 0;
  // Máximo y mínimo de coordenadas permitidas
  maxCoordenadas = MAX_QUANTITY_COORDENADAS;
  minCoordenadas = MIN_QUANTITY_COORDENADAS;
  // Valores mínimos y máximos para latitud y longitud
  minValueLatitude = MIN_VALUE_LATITUDE;
  maxValueLatitude = MAX_VALUE_LATITUDE;
  minValueLongitude = MIN_VALUE_LONGITUDE;
  maxValueLongitude = MAX_VALUE_LONGITUDE;

  // Constantes para la ubicación inicial del mapa
  latitudSanJuan = LATITUD_SAN_JUAN;
  longitudSanJuan = LONGITUD_SAN_JUAN;
  zoomInicial = ZOOM_INICIAL;

  // Proveedor de búsqueda de Google con la API key
  provider = new GoogleProvider({
    apiKey: `${environment.API_KEY_GOOGLE_PLACES}`,
  });

  // Control de búsqueda geográfica
  searchControl = GeoSearchControl({
    provider: this.provider,
    showMarker: false, // No mostrar marcador
    showPopup: false, // No mostrar popup
    marker: {
      icon: new L.Icon.Default(), // Icono por defecto para el marcador
      draggable: false, // Marcador no arrastrable
    },
    popupFormat: ({ result }: { result: any }) => result.label, // Formato del popup
    maxMarkers: 1, // Máximo de marcadores
    retainZoomLevel: false, // No retener nivel de zoom
    animateZoom: true, // Animar el zoom
    autoClose: true, // Cerrar automáticamente
    searchLabel: 'Enter location', // Etiqueta de búsqueda
    keepResult: true, // Mantener resultado después de la búsqueda
  });

  // Opciones de personalización de icono de Marker
  customIcon = L.icon({
    iconUrl: '../../../../assets/markers/orange-marker.png', // Ruta a tu icono
    iconSize: [40, 40] as L.PointTuple, // Tamaño del icono
  });

  constructor(private formBuilder: FormBuilder) {}

  /**
   * Método de ciclo de vida de Angular que se invoca una vez que Angular ha inicializado
   * todas las propiedades vinculadas a datos de una directiva.
   */
  ngOnInit(): void {
    // Verifica si el mapa ya está inicializado para evitar reinstanciarlo
    if (!this.map) {
      this.inicializarMapa(); // Método para inicializar el mapa
    }
  }

  /**
   * Método de ciclo de vida de Angular que se invoca cuando cualquier propiedad vinculada a datos
   * cambia. El método recibe un objeto SimpleChanges que contiene los valores actuales y anteriores
   * de las propiedades vinculadas a datos.
   * @param changes - Objeto que contiene los cambios de las propiedades
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Verifica si 'uploadEstudioToEditFinish' está presente en los cambios
    if (changes['uploadEstudioToEditFinish']) {
      // Verifica si 'uploadEstudioToEditFinish' cambió a 'true'
      if (changes['uploadEstudioToEditFinish'].currentValue === true) {
        // Inicializa el mapa si aún no se ha hecho
        if (!this.map) {
          this.inicializarMapa();
        }
        this.limpiarMarcadores(); // Limpia los marcadores existentes en el mapa
        this.cargarCoordenadas(); // Carga las coordenadas para el estudio
      }
    }
  }

  /**
   * Agrega una nueva coordenada al arreglo de marcadores y al FormArray del formulario.
   * Este método incrementa el contador de coordenadas, crea un nuevo marcador en el mapa,
   * le asigna un popup, y lo asocia a un FormGroup para manejar los datos de la coordenada.
   * También se suscribe a cambios en los valores de latitud y longitud para actualizar
   * el marcador correspondiente.
   */
  addCoordenada(): void {
    // Verifica si se ha alcanzado el número máximo de coordenadas permitidas
    if (this.contadorCoordenadas >= this.maxCoordenadas) {
      console.error(
        'Se ha alcanzado el número máximo de coordenadas permitidas.'
      );
      return;
    }

    // Incrementa el contador de coordenadas
    this.contadorCoordenadas++;

    // Crea un nuevo marcador en el centro del mapa o en una ubicación predeterminada
    const marker = this.crearNuevoMarcador(null, null);

    // Agrega un popup al marcador con información de la coordenada
    this.agregarPopupAlMarcador(marker);

    // Crea un nuevo FormGroup para gestionar los datos del marcador
    const group = this.crearNuevoFormGroupParaMarcador(marker);

    // Almacena el marcador y su FormGroup asociado en el arreglo de marcadores
    this.markers.push({ marker: marker, group: group });

    // Maneja el evento 'dragend' para actualizar las coordenadas cuando se desplace el marcador
    this.manejarDragEnd(marker, group);

    // Se suscribe a los cambios de los valores de latitud y longitud en el FormGroup
    this.suscribirseACambiosDeCoordenadas(group, marker);

    // Añade el FormGroup al FormArray del formulario para gestionar las coordenadas
    this.coordenadasFormArray.push(group);
  }

  /**
   * Carga las coordenadas existentes en el formulario para un estudio geofísico.
   * Itera sobre el FormArray de coordenadas, crea un marcador para cada una en el mapa,
   * y asocia cada marcador a su FormGroup correspondiente. También se suscribe a los
   * cambios de latitud y longitud para actualizar la posición del marcador.
   */
  cargarCoordenadas(): void {
    // Verifica si hay coordenadas para cargar
    if (this.coordenadasFormArray.length === 0) {
      console.warn('No hay coordenadas para cargar.');
      return;
    }

    // Itera sobre el arreglo de controles de coordenadas
    this.coordenadasFormArray.controls.forEach((coordenada, index) => {
      // Incrementa el contador de coordenadas
      this.contadorCoordenadas++;

      // Obtiene la latitud y longitud de las coordenadas del FormGroup
      const latitud = coordenada.get('latitudDecimal')?.value;
      const longitud = coordenada.get('longitudDecimal')?.value;

      // Crea un nuevo marcador en el mapa para cada coordenada
      const marker = this.crearNuevoMarcador(latitud, longitud);

      // Asigna un popup al marcador con información de la coordenada
      this.agregarPopupAlMarcador(marker);

      // Obtiene el FormGroup correspondiente al marcador
      const group = this.coordenadasFormArray.at(index) as FormGroup;

      // Almacena el marcador y el FormGroup asociado en el arreglo de marcadores
      this.markers.push({ marker: marker, group: group });

      // Maneja el evento 'dragend' para actualizar las coordenadas cuando se desplace el marcador
      this.manejarDragEnd(marker, group);

      // Se suscribe a los cambios de los valores de latitud y longitud en el FormGroup
      this.suscribirseACambiosDeCoordenadas(group, marker);
    });
  }

  /**
   * Elimina la última coordenada del arreglo de marcadores y del FormArray del formulario.
   * Remueve el marcador del mapa y el FormGroup asociado del FormArray, además de
   * decrementar el contador de coordenadas.
   */
  deleteCoordenada(): void {
    // Verifica si hay marcadores para eliminar
    if (this.markers.length === 0) {
      console.warn('No hay coordenadas para eliminar.');
      return;
    }

    // Obtiene y remueve el último grupo de marcador del arreglo
    const markerGroup = this.markers.pop();
    if (markerGroup) {
      // Remueve el marcador del mapa
      markerGroup.marker.remove();

      // Obtiene el índice del FormGroup asociado en el FormArray
      const index = this.coordenadasFormArray.controls.indexOf(
        markerGroup.group
      );
      if (index > -1) {
        // Remueve el FormGroup del FormArray
        this.coordenadasFormArray.removeAt(index);
        // Decrementa el contador de coordenadas
        this.contadorCoordenadas--;
      }
    }
  }

  /**
   * Inicializa el mapa centrado en San Juan, Argentina, y agrega múltiples capas base y un control de búsqueda.
   *
   * Este método configura el mapa con las siguientes características:
   * - Un punto de vista inicial centrado en las coordenadas de San Juan, Argentina.
   * - Una capa base de OpenStreetMap que proporciona una vista de calle estándar.
   * - Una capa de imágenes satelitales de Stadia Maps que ofrece una vista detallada desde el espacio.
   * - Una capa de OpenTopoMap que muestra un mapa topográfico detallado.
   * - Un control de capas que permite al usuario cambiar entre las diferentes capas base disponibles.
   * - Un control de búsqueda que facilita la localización de direcciones específicas en el mapa.
   */
  private inicializarMapa(): void {
    // Crea y configura el mapa
    this.map = L.map('map').setView(
      [LATITUD_SAN_JUAN, LONGITUD_SAN_JUAN],
      ZOOM_INICIAL
    );

    // Define las capas base
    const osmTileLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }
    );

    const stadiaAlidadeSatellite = L.tileLayer(
      `https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg?api_key=${environment.API_KEY_STADIA_MAPS}`,
      {
        minZoom: 0,
        maxZoom: 20,
        attribution:
          '&copy; CNES, Distribution Airbus DS, © Airbus DS, © PlanetObserver (Contains Copernicus Data) | &copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    );

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

    // Agrega la capa base de OpenStreetMap y el control de capas al mapa
    osmTileLayer.addTo(this.map);
    L.control.layers(baseMaps).addTo(this.map);

    // Agrega el control de búsqueda al mapa (asegúrate de que 'this.searchControl' esté definido)
    this.map.addControl(this.searchControl);
  }

  /**
   * Crea un nuevo marcador en el mapa en la ubicación especificada o en el centro del mapa si no se proporcionan coordenadas.
   * El marcador es arrastrable y utiliza un icono personalizado.
   * @param latitud - La latitud donde se colocará el marcador o null para usar el centro del mapa
   * @param longitud - La longitud donde se colocará el marcador o null para usar el centro del mapa
   * @returns {L.Marker} - El marcador creado
   */
  private crearNuevoMarcador(
    latitud: number | null,
    longitud: number | null
  ): L.Marker {
    // Determina la ubicación del marcador: coordenadas proporcionadas o centro del mapa
    const posicion =
      latitud && longitud ? [latitud, longitud] : this.map.getCenter();

    // Crea y retorna el marcador en la ubicación determinada
    return L.marker(posicion as L.LatLngExpression, {
      draggable: true, // Permite que el marcador sea arrastrable
      icon: this.customIcon, // Usa el icono personalizado
    }).addTo(this.map); // Añade el marcador al mapa
  }

  /**
   * Agrega un popup al marcador con el nombre de la coordenada.
   * @param marker - El marcador al que se agregará el popup.
   */
  private agregarPopupAlMarcador(marker: L.Marker): void {
    // Crea un popup con el número de la coordenada
    const popupContent = `<b>Coordenada ${this.contadorCoordenadas}</b>`;

    // Asigna el contenido del popup al marcador y ábrelo
    marker.bindPopup(popupContent).openPopup();
  }

  /**
   * Limpia todos los marcadores existentes en el mapa.
   * También reinicia el arreglo de marcadores.
   */
  private limpiarMarcadores(): void {
    this.markers.forEach(({ marker }) => this.map.removeLayer(marker));
    this.markers = [];
  }

  /**
   * Crea un nuevo FormGroup asociado a un marcador.
   * @param marker - El marcador para el cual se creará el FormGroup.
   * @returns {FormGroup} - El FormGroup creado.
   */
  crearNuevoFormGroupParaMarcador(marker: L.Marker): FormGroup {
    return this.formBuilder.group({
      latitudDecimal: [marker.getLatLng().lat],
      longitudDecimal: [marker.getLatLng().lng],
    });
  }

  /**
   * Maneja el evento 'dragend' del marcador.
   * Actualiza las coordenadas en el FormGroup cuando se arrastra el marcador.
   * @param marker - El marcador que se ha arrastrado.
   * @param group - El FormGroup asociado al marcador.
   */
  private manejarDragEnd(marker: L.Marker, group: FormGroup): void {
    marker.on('dragend', () => {
      const lat = marker.getLatLng().lat;
      const lng = marker.getLatLng().lng;
      group.get('latitudDecimal')!.setValue(lat);
      group.get('longitudDecimal')!.setValue(lng);
      this.map.panTo(marker.getLatLng());
    });
  }

  /**
   * Suscribe al evento de cambios de valor de latitud y longitud en el FormGroup.
   * Actualiza la posición del marcador y centra el mapa cuando se modifican las coordenadas.
   * @param group - El FormGroup asociado al marcador.
   * @param marker - El marcador al que se aplicarán los cambios.
   */
  private suscribirseACambiosDeCoordenadas(
    group: FormGroup,
    marker: L.Marker
  ): void {
    // Suscribe al cambio de latitud en el FormGroup
    group.get('latitudDecimal')?.valueChanges.subscribe((lat) => {
      const latitud = lat;
      const longitud = group.get('longitudDecimal')?.value;

      // Valida que las coordenadas sean correctas y no estén vacías
      if (this.validarCoordenadas(latitud!, longitud!)) {
        // Actualiza la posición del marcador y centra el mapa
        marker.setLatLng([latitud!, longitud!]);
        this.map.panTo(new L.LatLng(latitud!, longitud!));
      }
    });

    // Suscribe al cambio de longitud en el FormGroup
    group.get('longitudDecimal')?.valueChanges.subscribe((lon) => {
      const latitud = group.get('latitudDecimal')?.value;
      const longitud = lon;

      // Valida que las coordenadas sean correctas y no estén vacías
      if (this.validarCoordenadas(latitud!, longitud!)) {
        // Actualiza la posición del marcador y centra el mapa
        marker.setLatLng([latitud!, longitud!]);
        this.map.panTo(new L.LatLng(latitud!, longitud!));
      }
    });
  }

  /**
   * Método para ajustar el paso(incremento o decremento) de los inputs
   */
  adjustIncrement() {
    // Obtener el elemento de entrada (input) con el ID 'longitudInput'
    const input = document.getElementById('longitudInput') as HTMLInputElement;

    if (input) {
      // Verificar si se encontró un elemento con el ID 'longitudInput
      const currentValue = parseFloat(input.value); // Obtener el valor actual del input y convertirlo a un número
      input.step = this.calculateSmallestStep(currentValue); // Ajusta el paso para que sea el valor mínimo más pequeño
    }
  }

  /**
   * Calcula el paso más pequeño basado en el valor actual.
   * @param value - El valor actual del input.
   * @returns {string} - El paso más pequeño como cadena.
   */
  private calculateSmallestStep(value: number): string {
    const decimalCount = this.getDecimalCount(value);
    const smallestStep = 1 / Math.pow(10, decimalCount + 1);
    return smallestStep.toString();
  }

  /**
   * Cuenta la cantidad de dígitos decimales en un número.
   * @param num - El número del cual se contarán los dígitos decimales.
   * @returns {number} - La cantidad de dígitos decimales.
   */
  private getDecimalCount(num: number): number {
    const [, decimal] = num.toString().split('.');
    return decimal ? decimal.length : 0;
  }

  /**
   * Valida las coordenadas para asegurarse de que no superen los límites y no estén vacías.
   * @param latitud - La latitud a validar.
   * @param longitud - La longitud a validar.
   * @returns {boolean} - Verdadero si las coordenadas son válidas, falso de lo contrario.
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

  // Obtener el FormArray para las coordenadas
  get coordenadasFormArray(): FormArray {
    return this.parentForm.get('coordenadas') as FormArray;
  }
}
