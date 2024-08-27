import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { saveAs } from 'file-saver';
import { ArchivoAdjunto } from 'src/app/core/models/archivo-adjunto.model';
import { EstudioGeofisico } from 'src/app/core/models/estudio-geofisico.interface';
import { EstudioGeofisicoService } from 'src/app/core/services/estudio-geofisico.service';
import { AssetService } from 'src/app/core/services/asset.service';
import Swal from 'sweetalert2';
import { Imagen } from 'src/app/core/models/imagen/imagen.model';

@Component({
  selector: 'app-estudio-detail',
  templateUrl: './estudio-detail.component.html',
  styleUrls: ['./estudio-detail.component.css'],
})
export class EstudioDetailComponent implements OnInit {
  estudio: EstudioGeofisico; // estudio a cargar
  areasEstudio: Set<string>;
  tiposEstudio: Set<string>;
  idEstudio: number; // id del estudio a cargar
  estudioLoaded: boolean = false; // Bandera para indicar el estudio ya cargado

  constructor(
    private activateRoute: ActivatedRoute,
    private estudioService: EstudioGeofisicoService,
    private assetService: AssetService,
    private router: Router
  ) {}

  /**
   * Función que se ejecuta al inicializar el componente.
   * Carga el estudio geofísico si se proporciona un id en los parámetros de ruta.
   */
  ngOnInit(): void {
    // Suscribe a los parámetros de ruta
    this.activateRoute.params.subscribe((params) => {
      // Verifica si se proporcionó un id en los parámetros
      if (params['id']) {
        // Expresión regular para validar que el id contenga solo números
        const regex = /^\d+$/;

        // Verifica que el id cumpla con la expresión regular
        if (regex.test(params['id'])) {
          // Asigna el id a una propiedad del componente
          this.idEstudio = +params['id'];

          // Obtiene el estudio geofísico por id
          this.estudioService.getEstudio(this.idEstudio).subscribe({
            next: (data: EstudioGeofisico) => {
              // Asigna el estudio obtenido a una propiedad del componente
              this.estudio = data;

              console.log(data);

              // Convierte los valores de enum a strings personalizados
              this.convertirEnumsAStrings();
            },
            complete: () => {
              // Indica que el estudio ha sido cargado
              this.estudioLoaded = true;
            },
          });
        } else {
          console.error(
            'Error al cargar el estudio geofísico: El id es inválido'
          );
          throw new Error('El estudio geofísico no existe');
        }
      }
    });
  }

  /**
   * Convierte los valores de enum de tipo de estudio y área de aplicación a strings personalizados.
   */
  private convertirEnumsAStrings(): void {
    // Convierte los valores de enum de tipo de estudio a strings personalizados
    if (this.estudio.tiposEstudio && this.estudio.tiposEstudio !== null) {
      this.tiposEstudio = this.estudioService.getLabelsForEnumTipos(
        this.estudio.tiposEstudio
      );
    }

    // Convierte el valor de enum de área de aplicación a un string personalizado
    if (this.estudio.areasEstudio && this.estudio.areasEstudio !== null) {
      this.areasEstudio = this.estudioService.getLabelsForEnumAreas(
        this.estudio.areasEstudio
      );
    }
  }

  /**
   * Método para eliminar un estudio geofísico.
   */
  delete(): void {
    // Muestra un cuadro de diálogo de confirmación
    Swal.fire({
      position: 'top',
      icon: 'warning',
      title: 'Está seguro que desea eliminar?',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
    }).then((result) => {
      if (result.isConfirmed) {
        // Muestra una alerta de procesando solicitud
        Swal.fire({
          position: 'top-end',
          icon: 'info',
          title: 'Procesando solicitud...',
          showConfirmButton: false,
          timer: 1500,
        });

        // Elimina el estudio geofísico usando el servicio
        this.estudioService.deleteEstudioGeofisico(this.idEstudio).subscribe({
          complete: () => {
            // Redirige a la lista de estudios una vez que se completa la eliminación
            this.router.navigateByUrl('/estudios');

            // Muestra una notificación de éxito al usuario
            Swal.fire({
              position: 'top-end',
              icon: 'success',
              title: 'Estudio eliminado con éxito!',
              showConfirmButton: false,
              timer: 1500,
            });
          },
        });
      }
    });
  }

  /**
   * Descarga un archivo con el nombre especificado.
   * @param filename - El nombre del archivo a descargar.
   */
  downloadFile(filename: string): void {
    this.showNotification(); // Informa el inicio de la descarga

    // Realiza la solicitud para descargar el archivo
    this.assetService.downloadFile(filename).subscribe({
      next: (data) => {
        // Crea un objeto Blob con los datos recibidos
        const blob = new Blob([data], { type: 'application/octet-stream' });

        // Crea una URL para el Blob
        const url = window.URL.createObjectURL(blob);

        // Crea un elemento <a> para iniciar la descarga
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
      },
    });
  }

  /**
   * Inicia la descarga de un archivo ZIP que contiene una colección de archivos adjuntos.
   *
   * Este método determina el tipo de archivos contenidos en el arreglo `typesFiles` y
   * obtiene las claves (keys) correspondientes para su posterior descarga en formato ZIP.
   *
   * @param nameFileZip - El nombre que se asignará al archivo ZIP descargado.
   * @param typesFiles - Un arreglo que puede contener objetos de tipo `Imagen` o `ArchivoAdjunto`.
   *                     El tipo de los objetos se especifica mediante el parámetro `codigoTipoArchivo`.
   * @param codigoTipoArchivo - Un código numérico que indica el tipo de archivos contenidos en `typesFiles`.
   *                            Utilizar `1` para `Imagen[]` y `2` para `ArchivoAdjunto[]`.
   *
   * @remarks
   * El método utiliza el servicio `assetService` para realizar la descarga del archivo ZIP.
   * Se muestra una notificación al usuario durante el inicio y la finalización del proceso de descarga.
   *
   * @example
   * // Ejemplo de uso del método para descargar un archivo ZIP de imágenes:
   * downloadArchivosZip('fotos-evento.zip', imagenes, 1);
   *
   * // Ejemplo de uso del método para descargar un archivo ZIP de archivos adjuntos:
   * downloadArchivosZip('documentos-proyecto.zip', archivosAdjuntos, 2);
   */
  downloadArchivosZip(
    nameFileZip: string,
    typesFiles: Imagen[] | ArchivoAdjunto[],
    codigoTipoArchivo: number
  ): void {
    let keys: string[] = [];

    if (codigoTipoArchivo === 1) {
      keys = this.obtenerKeysImagenes(typesFiles as Imagen[]);
    } else if (codigoTipoArchivo === 2) {
      keys = this.obtenerKeysArchivosAdjuntos(typesFiles as ArchivoAdjunto[]);
    }

    if (keys && keys.length > 0) {
      this.showNotification(); // Informa el inicio de la descarga

      // Descarga el archivo ZIP con los archivos adjuntos
      this.assetService.downloadZip(keys).subscribe({
        next: (data: Blob) => {
          saveAs(data, nameFileZip); // Guarda el archivo ZIP en el cliente
        },
      });
    } else {
      this.showNotificationNoFiles(); // Informa que no hay archivos para descargar
    }
  }

  /**
   * Obtiene las keys de los archivos adjuntos de un estudio.
   * @param archivos - Los archivos adjuntos del estudio.
   * @returns {string[]} - Un arreglo con las keys de los archivos adjuntos.
   */
  private obtenerKeysArchivosAdjuntos(archivos: ArchivoAdjunto[]): string[] {
    // Verifica que existan archivos adjuntos en el estudio
    if (archivos && archivos.length > 0) {
      // Mapea los archivos adjuntos para obtener las keys
      return archivos.map((adjunto) => adjunto.archivoKey!);
    }
    return [];
  }

  /**
   * Obtiene las keys de las imagenes de un estudio.
   * @param archivos - Las imagenes del estudio.
   * @returns {string[]} - Un arreglo con las keys de las imagenes.
   */
  private obtenerKeysImagenes(imagenes: Imagen[]): string[] {
    // Verifica que existan imagenes en el estudio
    if (imagenes && imagenes.length > 0) {
      // Mapea las imagenes para obtener las keys
      return imagenes.map((imagen) => imagen.imagenKey!);
    }
    return [];
  }

  /**
   * Muestra una notificación para informar el inicio de la descarga.
   */
  private showNotification(): void {
    // Crea una notificación visual
    Swal.fire({
      position: 'top-end',
      icon: 'info',
      title: 'Iniciando descarga...',
      showConfirmButton: false,
      timer: 1500,
    });
  }

  /**
   * Muestra una notificación para informar que no hay archivos para descargar.
   */
  private showNotificationNoFiles(): void {
    // Crea una notificación visual
    Swal.fire({
      position: 'top-end',
      icon: 'info',
      title: 'No hay archivos para descargar',
      showConfirmButton: false,
      timer: 1500,
    });
  }
}
