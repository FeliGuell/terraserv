import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { EstudioGeofisico } from 'src/app/core/models/estudio-geofisico.interface';
import { environment } from 'src/environments/environment';
import { EnumTipoEstudioGeofisico } from '../models/enums/tipo-estudio.enum';
import { EnumAreaAplicacionEstudioGeofisico } from '../models/enums/area-estudio.enum';
import { PaginatedResponse } from '../models/paginated-response';

@Injectable({
  providedIn: 'root',
})
export class EstudioGeofisicoService {
  // URL base de la API
  private urlEndPoint: string = environment.URL_API.concat('estudios');

  // Subject para almacenar y emitir los estudios
  private estudiosSubject = new BehaviorSubject<EstudioGeofisico[]>([]);
  estudios$ = this.estudiosSubject.asObservable();

  // BehaviorSubject que almacena los registros geofísicos paginados
  private registrosSubject = new BehaviorSubject<PaginatedResponse<EstudioGeofisico>>({
    content: [],        // Arreglo de estudios geofísicos
    totalElements: 0,   // Total de elementos (registros)
    totalPages: 0,      // Total de páginas
    number: 0           // Número de la página actual
  });
  registros$ = this.registrosSubject.asObservable();

  // Subject para emitir el evento de búsqueda realizada
  private busquedaRealizadaSource = new Subject<boolean>();
  busquedaRealizada$ = this.busquedaRealizadaSource.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los estudios geofísicos desde la API.
   * @returns Observable con la lista de estudios geofísicos.
   */
  getEstudios(): Observable<EstudioGeofisico[]> {
    return this.http.get<EstudioGeofisico[]>(this.urlEndPoint);
  }

  /**
   * Filtra los estudios geofísicos según los criterios del formulario.
   * @param form Formulario con los criterios de filtrado.
   */
  filterEstudios(form: any): void {
    this.http
      .post<EstudioGeofisico[]>(this.urlEndPoint, form)
      .subscribe((estudios) => {
        this.estudiosSubject.next(estudios);
      });
  }

  /**
   * Obtiene un estudio geofísico específico por su ID.
   * @param id ID del estudio geofísico.
   * @returns Observable con el estudio geofísico.
   */
  getEstudio(id: number): Observable<EstudioGeofisico> {
    return this.http.get<EstudioGeofisico>(`${this.urlEndPoint}/${id}`);
  }

  /**
   * Obtiene las opciones de tipo de estudio geofísico desde la API.
   * @returns Observable con la lista de tipos de estudio geofísico.
   */
  getTipoEstudioOptions(): Observable<EnumTipoEstudioGeofisico[]> {
    return this.http.get<EnumTipoEstudioGeofisico[]>(
      `${this.urlEndPoint}/enums/tipo-estudio`
    );
  }

  /**
   * Obtiene las opciones de área de aplicación de estudio geofísico desde la API.
   * @returns Observable con la lista de áreas de aplicación de estudio geofísico.
   */
  getAreaEstudioOptions(): Observable<EnumAreaAplicacionEstudioGeofisico[]> {
    return this.http.get<EnumAreaAplicacionEstudioGeofisico[]>(
      `${this.urlEndPoint}/enums/area-estudio`
    );
  }

  /**
   * Envía un nuevo estudio geofísico a la API.
   * @param form Formulario con los datos del nuevo estudio geofísico.
   * @returns Observable con la respuesta de la API.
   */
  postEstudioGeofisico(form: any): Observable<any> {
    return this.http.post<any>(`${this.urlEndPoint}/form`, form);
  }

  /**
   * Actualiza un estudio geofísico existente en la API.
   * @param form Formulario con los datos actualizados del estudio geofísico.
   * @param id ID del estudio geofísico a actualizar.
   * @returns Observable con la respuesta de la API.
   */
  putEstudioGeofisico(form: any, id: number): Observable<any> {
    return this.http.put(`${this.urlEndPoint}/form/${id}`, form);
  }

  /**
   * Elimina un estudio geofísico de la API.
   * @param id ID del estudio geofísico a eliminar.
   * @returns Observable con la respuesta de la API.
   */
  deleteEstudioGeofisico(id: number): Observable<any> {
    return this.http.delete(`${this.urlEndPoint}/${id}`);
  }

  /**
   * Limpia la lista de estudios geofísicos almacenados en el Subject.
   * @method clearEstudiosGeofisicos
   * @description No recibe parámetros y No retorna valores.
   * @usage Invocado para resetear la lista de estudios a un arreglo vacío.
   */
  clearEstudiosGeofisicos(): void {
    this.estudiosSubject.next([]);
  }

  /**
   * Emite el evento de búsqueda realizada.
   * @method realizarBusqueda
   * @description No recibe parámetrosy No retorna valores
   * @usage Invocado para notificar que se ha realizado una búsqueda.
   */
  realizarBusqueda(): void {
    this.busquedaRealizadaSource.next(true);
  }

  /**
   * Restablece el estado de búsqueda realizada a falso.
   * @method resetearBusquedaRealizada
   * @description Este método no recibe parámetros y no retorna valores.
   * @usage Invocado para notificar que se ha reseteado la búsqueda.
   */
  resetearBusquedaRealizada(): void {
    this.busquedaRealizadaSource.next(false);
  }

/**
 * Obtiene registros de estudio geofísico paginados y actualiza el BehaviorSubject con la respuesta obtenida.
 * 
 * @method obtenerRegistrosEstudio
 * @param {any} form - Objeto que contiene los parámetros de filtrado, paginación y ordenamiento.
 * - {number} form.page - Número de página que se desea obtener (predeterminado: 0).
 * - {number} form.size - Tamaño de la página, es decir, número de registros por página (predeterminado: 10).
 * - {string} form.sort - Campo por el cual se desea ordenar los registros (predeterminado: "id").
 * - {string} form.direction - Dirección del ordenamiento ("asc" para ascendente, "desc" para descendente; predeterminado: "asc").
 * - {string} [form.consultaMultiple] - Cadena de texto para buscar coincidencias en los campos nombreEstudio, nombreCliente y ubicacionEstudio.
 * - {string} [form.fechaInicio] - Fecha de inicio del rango de fechas en el que se realizó el estudio geofísico.
 * - {string} [form.fechaFin] - Fecha de fin del rango de fechas en el que se realizó el estudio geofísico.
 * - {EnumTipoEstudioGeofisico} [form.tipoEstudio] - Enumerador del tipo de estudio geofísico.
 * - {EnumAreaAplicacionEstudioGeofisico} [form.areaEstudio] - Enumerador del área de aplicación del estudio geofísico.
 * 
 * @returns {void}
 * @description Este método envía una solicitud HTTP POST al endpoint `/registros` con el objeto de filtro,
 *              recibe la respuesta paginada de registros de estudios geofísicos y actualiza el `BehaviorSubject`
 *              `registrosSubject` con los datos recibidos. La respuesta es un `Observable` que se maneja internamente
 *              para actualizar el estado de los registros.
 * @usage Invocado para obtener una lista paginada de registros de estudios geofísicos basada en los criterios de filtrado
 *        y actualización automática de los componentes suscritos al `BehaviorSubject`.
 */
  obtenerRegistrosEstudio(form: any): void {
    this.http.post<PaginatedResponse<EstudioGeofisico>>(
        `${this.urlEndPoint}/registros`, form)
        .subscribe((registros) => {
          this.registrosSubject.next(registros);
        });
  }

  /**
   * Función para obtener el string personalizado para cada valor de los enums de tipo de estudio.
   *
   * @param enumTipoValue - El valor de la enumeración de tipo de estudio.
   * @returns El string personalizado para el valor de la enumeración.
   */
  getLabelForEnumTipo(enumTipoValue: EnumTipoEstudioGeofisico): string {
    switch (enumTipoValue) {
      case EnumTipoEstudioGeofisico.GPR:
        return 'GEO-RADAR';
      case EnumTipoEstudioGeofisico.MASW:
        return 'MASW';
      case EnumTipoEstudioGeofisico.PERFILAJE_POZO:
        return 'Perfilaje de pozo';
      case EnumTipoEstudioGeofisico.SEV_SCHLUMBERGER:
        return 'SEV Schlumberger';
      case EnumTipoEstudioGeofisico.SEV_WENNER:
        return 'SEV Wenner';
      case EnumTipoEstudioGeofisico.TOMOGRAFIA_ELECTRICA_DIPOLO_DIPOLO:
        return 'Tomografía Eléctrica Dipolo-Dipolo';
      case EnumTipoEstudioGeofisico.TOMOGRAFIA_ELECTRICA_DIPOLO_POLO:
        return 'Tomografía Eléctrica Dipolo-Polo';
      case EnumTipoEstudioGeofisico.TOMOGRAFIA_ELECTRICA_POLO_POLO:
        return 'Tomografía Eléctrica Polo-Polo';
      case EnumTipoEstudioGeofisico.TOMOGRAFIA_SISMICA:
        return 'Tomografía Sísmica';
      default:
        return enumTipoValue; // Mantener el valor original si no hay un string personalizado definido
    }
  }

  /**
   * Obtiene etiquetas personalizadas para cada valor de los enums de tipos de estudio geofísico.
   * @param enumTipoValues - Los valores de los enums de tipos de estudio geofísico.
   * @returns {Set<string>} - Un conjunto de etiquetas personalizadas.
   */
  getLabelsForEnumTipos(
    enumTipoValues: Set<EnumTipoEstudioGeofisico>
  ): Set<string> {
    let labels = new Set<string>();

    enumTipoValues.forEach((enumTipoValue) => {
      switch (enumTipoValue) {
        case EnumTipoEstudioGeofisico.GPR:
          labels.add('GEO-RADAR');
          break;
        case EnumTipoEstudioGeofisico.MASW:
          labels.add('MASW');
          break;
        case EnumTipoEstudioGeofisico.PERFILAJE_POZO:
          labels.add('Perfilaje de pozo');
          break;
        case EnumTipoEstudioGeofisico.SEV_SCHLUMBERGER:
          labels.add('SEV Schlumberger');
          break;
        case EnumTipoEstudioGeofisico.SEV_WENNER:
          labels.add('SEV Wenner');
          break;
        case EnumTipoEstudioGeofisico.TOMOGRAFIA_ELECTRICA_DIPOLO_DIPOLO:
          labels.add('Tomografía Eléctrica Dipolo-Dipolo');
          break;
        case EnumTipoEstudioGeofisico.TOMOGRAFIA_ELECTRICA_DIPOLO_POLO:
          labels.add('Tomografía Eléctrica Dipolo-Polo');
          break;
        case EnumTipoEstudioGeofisico.TOMOGRAFIA_ELECTRICA_POLO_POLO:
          labels.add('Tomografía Eléctrica Polo-Polo');
          break;
        case EnumTipoEstudioGeofisico.TOMOGRAFIA_SISMICA:
          labels.add('Tomografía Sísmica');
          break;
        default:
          labels.add(enumTipoValue); // Mantener el valor original si no hay una etiqueta personalizada definida
      }
    });

    return labels;
  }

  /**
   * Función para obtener el string personalizado para cada valor de los enums de área de aplicación.
   *
   * @param enumAreaValue - El valor de la enumeración de área de aplicación.
   * @returns El string personalizado para el valor de la enumeración.
   */
  getLabelForEnumArea(
    enumAreaValue: EnumAreaAplicacionEstudioGeofisico
  ): string {
    switch (enumAreaValue) {
      case EnumAreaAplicacionEstudioGeofisico.GEOTECNIA:
        return 'Geotecnia';
      case EnumAreaAplicacionEstudioGeofisico.HIDROGEOLOGIA:
        return 'Hidrogeología';
      case EnumAreaAplicacionEstudioGeofisico.MINERIA:
        return 'Minería';
      case EnumAreaAplicacionEstudioGeofisico.ARQUEOLOGIA:
        return 'Arqueología';
      case EnumAreaAplicacionEstudioGeofisico.MEDIO_AMBIENTE:
        return 'Medio ambiente';
      default:
        return enumAreaValue;
    }
  }

  /**
   * Obtiene etiquetas personalizadas para cada valor de los enums de areas de aplicación de estudio geofísico.
   * @param enumAreaValues - Los valores de los enums de areas de aplicación de estudio geofísico.
   * @returns {Set<string>} - Un conjunto de etiquetas personalizadas.
   */
  getLabelsForEnumAreas(
    enumAreaValues: Set<EnumAreaAplicacionEstudioGeofisico>
  ): Set<string> {
    let labels = new Set<string>();

    enumAreaValues.forEach((enumAreaValues) => {
      switch (enumAreaValues) {
        case EnumAreaAplicacionEstudioGeofisico.GEOTECNIA:
          labels.add('Geotecnia');
          break;
        case EnumAreaAplicacionEstudioGeofisico.HIDROGEOLOGIA:
          labels.add('Hidrogeología');
          break;
        case EnumAreaAplicacionEstudioGeofisico.MINERIA:
          labels.add('Minería');
          break;
        case EnumAreaAplicacionEstudioGeofisico.ARQUEOLOGIA:
          labels.add('Arqueología');
          break;
        case EnumAreaAplicacionEstudioGeofisico.MEDIO_AMBIENTE:
          labels.add('Medio ambiente');
          break;
        default:
          labels.add(enumAreaValues);
      }
    });

    return labels;
  }
}
