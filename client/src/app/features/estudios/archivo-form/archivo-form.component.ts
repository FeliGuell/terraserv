import { HttpEvent, HttpEventType } from '@angular/common/http';
import {
  Component,
  DoCheck,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormArray, FormBuilder, FormGroup } from '@angular/forms';
import { AssetService } from 'src/app/core/services/asset.service';
import Swal from 'sweetalert2';
import { ArchivoService } from '../../../core/services/archivo.service';
import { ArchivoAdjunto } from 'src/app/core/models/archivo-adjunto.model';
import { AssetResponse } from 'src/app/core/models/asset-response';
import {
  MAX_FILE_UPLOAD_SIZE,
  MAX_IMAGE_UPLOAD_COUNT,
} from 'src/app/core/constants/asset.constants';

@Component({
  selector: 'app-archivo-form',
  templateUrl: './archivo-form.component.html',
  styleUrls: ['./archivo-form.component.css'],
})
export class ArchivoFormComponent implements OnChanges, DoCheck {
  @Input() parentForm: FormGroup; // Formulario de estudio-form
  @Input() uploadEstudioToEditFinish: boolean = false; // Indicador de estudio cargado para la edición
  @Output() readyArchivos: EventEmitter<boolean> = new EventEmitter<boolean>(); // Enviar evento al padre para indicar que no hay operaciones en curso

  erroresArray: string[] = []; // Un array para guardar los errores que van a ser enviados al componente padre

  // Contadores para no superar la cantidad máxima por estudio geofísico (MAX_IMAGE_UPLOAD_COUNT)
  archivosSeleccionadosContador = 0;
  archivosTotalesContador = 0;

  // Banderas
  isUploadingArchivosToEdit: boolean = false; // Bandera para indicar que se estan cargando los archivos del estudio a editar
  isUploadingArchivoToCloud: boolean = false; // Bandera indicadora de estado de subida de archivo a la nube

  archivosArrayUploaded: ArchivoAdjunto[] = []; // Arreglo para almacenar los archivos
  nombresUnicosArchivosUploaded = new Set<string>();
  formData = new FormData(); // FormData para enviar todos los archivos a subir
  fileStatus = { status: '', requestType: '', percent: 0 }; // Estado de carga de los archivos

  // Obtener el FormArray para los archivos
  get archivosAdjuntosFormArray(): FormArray {
    return this.parentForm.get('archivosAdjuntos') as FormArray;
  }

  constructor(
    private assetService: AssetService,
    private archivoService: ArchivoService,
    private formBuilder: FormBuilder
  ) {}

  /**
   * Este método se encarga de manejar los cambios en las propiedades de entrada del componente.
   * Se invoca automáticamente cada vez que Angular detecta un cambio en una propiedad de entrada.
   *
   * @param changes - Es un objeto que contiene los cambios actuales y anteriores de cada propiedad de entrada del componente.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Verifica si la propiedad de entrada `uploadEstudioToEditFinish` ha cambiado a `true`.
   *   Si es así, indica que se están cargando archivos del estudio estableciendo `this.isUploadingArchivosToEdit` en `true`
   *   y llama al método `loadArchivos()` para cargar los archivos del estudio a editar.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['uploadEstudioToEditFinish'] &&
      changes['uploadEstudioToEditFinish'].currentValue === true
    ) {
      this.isUploadingArchivosToEdit = true;
      this.loadArchivos();
    }
  }

  /**
   *
   * Este método se encarga de validar que no hay operaciones de carga de archivos en curso y que se puede proceder con la creación del estudio geofísico.
   * Se invoca automáticamente en cada ciclo de detección de cambios de Angular.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Verifica si `this.isUploadingArchivosToEdit` y `this.isUploadingArchivoToCloud` son `false`.
   *   Si es así, emite un evento `readyArchivos` con el valor `true` para indicar que se puede proceder con la creación del estudio geofísico.
   * - Si alguna de las variables es `true`, emite un evento `readyArchivos` con el valor `false` para indicar que aún
   *   hay operaciones de carga de archivos en curso y que no se puede proceder con la creación del estudio geofísico.
   */
  ngDoCheck(): void {
    if (!this.isUploadingArchivosToEdit && !this.isUploadingArchivoToCloud) {
      this.readyArchivos.emit(true);
    } else {
      this.readyArchivos.emit(false);
    }
  }

  /**
   *
   * Este método se encarga de subir los archivos seleccionados por el usuario.
   * Utiliza el servicio `assetService` para subir los archivos y actualiza los contadores y arreglos correspondientes.
   *
   * @param event - Es el evento que se dispara cuando el usuario selecciona los archivos a subir.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Resetea `this.erroresArray` para limpiar cualquier error previo.
   * - Obtiene el elemento de entrada HTML del evento y verifica si el usuario ha seleccionado archivos. Si no, retorna inmediatamente.
   * - Actualiza `this.archivosSeleccionadosContador` y `this.archivosTotalesContador` con la cantidad de archivos seleccionados.
   * - Valida los archivos seleccionados utilizando el método `validateArchivos()`. Si la validación falla,
   *   resta la cantidad de archivos seleccionados de `this.archivosTotalesContador` y retorna inmediatamente.
   * - Indica que está cargando archivos estableciendo `this.isUploadingArchivoToCloud` en `true`.
   * - Añade cada archivo seleccionado a `this.formData`.
   * - Llama al método `upload()` del servicio `assetService`, pasándole `this.formData` como argumento.
   * - Se suscribe al Observable retornado por `upload()`.
   * - En el callback `next`, llama al método `reportProgress()` para manejar los eventos de progreso de carga.
   * - En el callback `error`, llama al método `flagHandlerError()` para manejar cualquier error que pueda ocurrir durante la subida de los archivos.
   * - En el callback `complete`, llama al método `handleUploadCompletion()` para manejar la finalización de la carga,
   *   muestra una notificación de éxito, indica que la carga de archivos ha terminado estableciendo `this.isUploadingArchivoToCloud` en `false`,
   *   limpia el valor del elemento de entrada HTML, y resetea `this.formData`.
   */
  uploadArchivos(event: Event): void {
    this.erroresArray = [];
    const inputElement = event.target as HTMLInputElement;

    if (!(inputElement.files && inputElement.files.length > 0)) return;

    this.archivosSeleccionadosContador = inputElement.files.length;
    this.archivosTotalesContador += this.archivosSeleccionadosContador;

    const files: FileList = inputElement.files;
    if (!this.validateArchivos(files)) {
      this.archivosTotalesContador -= this.archivosSeleccionadosContador;
      return;
    }

    this.isUploadingArchivoToCloud = true;

    const filesArray: File[] = Array.from(inputElement.files);
    for (const file of filesArray) {
      this.formData.append('files', file);
    }

    this.assetService.upload(this.formData).subscribe({
      next: (event) => this.reportProgress(event),
      error: () => this.flagHandlerError(),
      complete: () => {
        this.handleUploadCompletion(inputElement);

        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Archivos subidos con éxito!',
          showConfirmButton: false,
          timer: 1500,
        });

        this.isUploadingArchivoToCloud = false;
        inputElement.value = '';
        this.formData = new FormData();
      },
    });
  }

  /**
   * Método `deleteArchivo()`
   *
   * Este método se encarga de manejar la eliminación de un archivo subido en el servidor. Utiliza el servicio `assetService` para eliminar el archivo y actualiza los arreglos y contadores correspondientes.
   *
   * @param key - Es la clave única del archivo que se va a eliminar.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Verifica si la clave del archivo es nula o indefinida. Si es así, registra un error, llama al método `flagHandlerError()` para manejar el error, y lanza una excepción.
   * - Busca el índice del archivo en el arreglo `this.archivosArrayUploaded` utilizando la clave del archivo.
   * - Si no se encuentra el archivo, registra un error, llama al método `flagHandlerError()` para manejar el error, y lanza una excepción.
   * - Deshabilita el botón de eliminación del archivo.
   * - Llama al método `delete()` del servicio `assetService`, pasándole la clave del archivo como argumento.
   * - Se suscribe al Observable retornado por `delete()`.
   * - En el callback `next`, elimina el nombre del archivo de `this.nombresUnicosArchivosUploaded`, elimina el archivo de `this.archivosAdjuntosFormArray` y `this.archivosArrayUploaded`, y resetea `this.erroresArray`.
   * - En el callback `error`, llama al método `flagHandlerError()` para manejar cualquier error que pueda ocurrir durante la eliminación del archivo.
   * - En el callback `complete`, decrementa `this.archivosTotalesContador` para indicar que se ha eliminado un archivo.
   */
  deleteArchivo(key: string) {
    if (!key) {
      console.error('Error al eliminar el recurso: el key es null');
      this.flagHandlerError();
      throw new Error('Error al eliminar el recurso');
    }

    const index = this.archivosArrayUploaded.findIndex(
      (archivo) => archivo.archivoKey === key
    );

    if (index === -1) {
      console.error('Error al eliminar: No se encontró el archivo en la nube');
      this.flagHandlerError();
      throw new Error('Error al eliminar el recurso');
    }

    const archivo = this.archivosArrayUploaded[index];
    archivo.deleteButtonDisabled = true;

    this.assetService.delete(key).subscribe({
      next: () => {
        if (this.nombresUnicosArchivosUploaded.has(archivo.archivoFileName!)) {
          this.nombresUnicosArchivosUploaded.delete(archivo.archivoFileName!);
        }
        this.archivosAdjuntosFormArray.removeAt(index);
        this.archivosArrayUploaded.splice(index, 1);
        this.erroresArray = [];
        console.log(`Archivo ${key} eliminado exitosamente.`);
      },
      error: () => this.flagHandlerError(),
      complete: () => this.archivosTotalesContador--,
    });
  }

  /**
   *
   * Este método privado se encarga de cargar los archivos del estudio geofísico que se van a editar. Obtiene las claves de los archivos utilizando el método `getKeysArchivos()` y luego utiliza el método `fetchArchivos()` para obtener y almacenar los archivos correspondientes a las claves.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Obtiene un arreglo de las claves de los archivos utilizando el método `getKeysArchivos()`.
   * - Si el arreglo de claves no está vacío, llama al método `fetchArchivos()` pasándole el arreglo de claves como argumento.
   */
  private loadArchivos(): void {
    const keysArchivos: string[] = this.getKeysArchivos();

    if (keysArchivos.length > 0) {
      this.fetchArchivos(keysArchivos);
    }
  }

  /**
   *
   * Este método privado se encarga de manejar los eventos de progreso de carga durante una solicitud HTTP.
   * Actualiza el estado de la carga y procesa la respuesta del servidor cuando se completa la carga.
   *
   * @param httpEvent - Es el evento HTTP que se está manejando.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Verifica el tipo del evento HTTP.
   * - Si el evento es de tipo `UploadProgress`, actualiza el estado de la carga utilizando el método `updateStatus()`.
   * - Si el evento es de tipo `Response`, procesa la respuesta del servidor. Extrae los arreglos de claves, URLs, nombres de archivos,
   *   y tamaños de la respuesta. Verifica si todos los arreglos tienen la misma longitud. Si es así, almacena los arreglos utilizando el método `storeArraysInArchivos()`.
   *   Si no, maneja el error utilizando el método `flagHandlerError()` y lanza una excepción.
   * - Al final de la respuesta, establece `this.fileStatus.status` en `'done'` para indicar que la carga ha terminado.
   */
  private reportProgress(httpEvent: HttpEvent<AssetResponse>): void {
    switch (httpEvent.type) {
      case HttpEventType.UploadProgress:
        // Asegurarse de que 'total' no sea nulo antes de llamar a updateStatus
        if (httpEvent.total) {
          this.updateStatus(httpEvent.loaded, httpEvent.total, 'Uploading...');
        }
        break;

      case HttpEventType.ResponseHeader:
        // Aquí se podrían manejar cabeceras específicas si fuera necesario
        break;

      // Cuando se recibe la respuesta completa del servidor
      case HttpEventType.Response:
        if (httpEvent.body?.files) {
          const files = httpEvent.body.files as Array<{
            key: string;
            url: string;
            fileName: string;
            size: number;
          }>;

          // Desestructurar para obtener arrays individuales
          const keysBody = files.map((file) => file.key);
          const urlsBody = files.map((file) => file.url);
          const fileNamesBody = files.map((file) => file.fileName);
          const sizesBody = files.map((file) => file.size);

          // Verificar que todos los arrays tengan la misma longitud antes de proceder
          if (
            keysBody.length === urlsBody.length &&
            keysBody.length === fileNamesBody.length &&
            keysBody.length === sizesBody.length
          ) {
            // Guardar
            this.storeArraysInArchivos(
              keysBody,
              urlsBody,
              fileNamesBody,
              sizesBody
            );
          } else {
            // Manejar el caso de que los arreglos tengan longitudes diferentes
            this.flagHandlerError();
            throw new Error('Error en la respuesta del servidor');
          }
        }
        this.fileStatus.status = 'done';
        break;

      default:
        break;
    }
  }

  /**
   *
   * Este método privado se encarga de manejar la finalización de la carga de archivos.
   * Actualiza los controles del formulario de archivos adjuntos `archivosAdjuntosFormArray` con los archivos que se han cargado.
   *
   * @param inputElement - Es el elemento de entrada HTML que se utilizó para seleccionar los archivos.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Itera sobre el arreglo `this.archivosArrayUploaded`.
   * - Para cada archivo, verifica si ya existe en `archivosAdjuntosFormArray` comparando las claves de los archivos.
   * - Si el archivo no existe en `archivosAdjuntosFormArray`, crea un nuevo FormGroup con los detalles del archivo y lo añade a `archivosAdjuntosFormArray`.
   */
  private handleUploadCompletion(inputElement: HTMLInputElement): void {
    this.archivosArrayUploaded.forEach((archivo) => {
      const existeArchivo = this.archivosAdjuntosFormArray.controls.some(
        (control) => control.get('archivoKey')?.value === archivo.archivoKey
      );

      if (!existeArchivo) {
        const group = this.formBuilder.group({
          archivoKey: archivo.archivoKey,
          archivoFileName: archivo.archivoFileName,
          archivoSize: archivo.archivoSize,
        });
        this.archivosAdjuntosFormArray.push(group);
      }
    });
  }

  /**
   *
   * Este método privado se encarga de obtener un arreglo de las claves únicas de los archivos del FormArray `archivosAdjuntosFormArray`.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Itera sobre los controles de `archivosAdjuntosFormArray`.
   * - Para cada control (que es un FormGroup), obtiene el valor de la clave del archivo (`archivoKey`).
   * - Filtra los valores nulos o indefinidos.
   * - Retorna el arreglo resultante de claves de archivos.
   *
   * @returns string[] - Un arreglo de las claves únicas de los archivos.
   */
  private getKeysArchivos(): string[] {
    return this.archivosAdjuntosFormArray.controls
      .map((archivoFormGroup) => archivoFormGroup.get('archivoKey')?.value)
      .filter(Boolean) as string[];
  }

  /**
   * Método `fetchArchivos()`
   *
   * Este método privado se encarga de obtener y almacenar los archivos utilizando las claves proporcionadas.
   * Utiliza el servicio `archivoService` para obtener los archivos por sus claves y luego los almacena utilizando el método `storeArchivos()`.
   *
   * @param keysArchivos - Es un arreglo de las claves únicas de los archivos que se van a obtener y almacenar.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Llama al método `getArchivosByKeys()` del servicio `archivoService`, pasándole `keysArchivos` como argumento.
   * - Se suscribe al Observable retornado por `getArchivosByKeys()`.
   * - En el callback `next`, verifica si la longitud del arreglo de archivos obtenidos coincide con la longitud de `keysArchivos`.
   *   Si coinciden, llama al método `storeArchivos()` para almacenar los archivos. Luego, incrementa `this.archivosTotalesContador`
   *   por la longitud de `this.archivosArrayUploaded`.
   * - En el callback `error`, llama al método `flagHandlerError()` para manejar cualquier error que pueda ocurrir durante la obtención de los archivos.
   * - En el callback `complete`, establece `this.isUploadingArchivosToEdit` en `false` para indicar que la carga de archivos ha terminado.
   */
  private fetchArchivos(keysArchivos: string[]): void {
    this.archivoService.getArchivosByKeys(keysArchivos).subscribe({
      next: (archivos) => {
        if (archivos && archivos.length === keysArchivos.length) {
          this.storeArchivos(archivos);
        }
        this.archivosTotalesContador += this.archivosArrayUploaded.length;
      },
      error: () => this.flagHandlerError(),
      complete: () => (this.isUploadingArchivosToEdit = false),
    });
  }

  /**
   *
   * Este método privado se encarga de almacenar los archivos en el arreglo de archivos subidos.
   * Crea una nueva instancia de `ArchivoAdjunto` para cada archivo y la añade a `this.archivosArrayUploaded`.
   * También añade el nombre del archivo a `this.nombresUnicosArchivosUploaded` si el nombre del archivo no es nulo.
   *
   * @param archivos - Es un arreglo de instancias de `ArchivoAdjunto` que se van a almacenar.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Itera sobre el arreglo `archivos`.
   * - Para cada archivo, crea una nueva instancia de `ArchivoAdjunto` y establece sus propiedades con los valores correspondientes del archivo.
   * - Añade la nueva instancia de `ArchivoAdjunto` a `this.archivosArrayUploaded`.
   * - Si el nombre del archivo no es nulo, lo añade a `this.nombresUnicosArchivosUploaded`.
   */
  private storeArchivos(archivos: ArchivoAdjunto[]): void {
    archivos.forEach((archivo) => {
      const archivoAdjunto = new ArchivoAdjunto();
      archivoAdjunto.archivoKey = archivo.archivoKey || '';
      archivoAdjunto.archivoFileName = archivo.archivoFileName || '';
      archivoAdjunto.archivoSize = archivo.archivoSize || 0;
      archivoAdjunto.archivoUrl = archivo.archivoUrl || '';
      this.archivosArrayUploaded.push(archivoAdjunto);
      if (archivo.archivoFileName) {
        this.nombresUnicosArchivosUploaded.add(archivo.archivoFileName);
      }
    });
  }

  /**
   *
   * Este método privado se encarga de guardar los arreglos en archivos subidos.
   * Crea una nueva instancia de `ArchivoAdjunto` para cada archivo y la añade a `this.archivosArrayUploaded`.
   * También añade el nombre del archivo a `this.nombresUnicosArchivosUploaded`.
   *
   * @param keys - Es un arreglo de las claves únicas de los archivos.
   * @param urls - Es un arreglo de las URLs de los archivos.
   * @param fileNames - Es un arreglo de los nombres de los archivos.
   * @param sizes - Es un arreglo de los tamaños de los archivos.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Itera sobre el arreglo `fileNames`.
   * - Para cada archivo, crea una nueva instancia de `ArchivoAdjunto` y establece sus
   *   propiedades con los valores correspondientes de los arreglos `keys`, `urls`, `fileNames`, y `sizes`.
   * - Añade la nueva instancia de `ArchivoAdjunto` a `this.archivosArrayUploaded`.
   * - Añade el nombre del archivo a `this.nombresUnicosArchivosUploaded`.
   */
  private storeArraysInArchivos(
    keys: string[],
    urls: string[],
    fileNames: string[],
    sizes: number[]
  ): void {
    if (
      keys.length !== urls.length ||
      urls.length !== fileNames.length ||
      fileNames.length !== sizes.length
    ) {
      throw new Error('Todos los arreglos deben tener la misma longitud.');
    }

    for (let index = 0; index < fileNames.length; index++) {
      const archivoAdjunto = new ArchivoAdjunto();
      archivoAdjunto.archivoKey = keys[index] || '';
      archivoAdjunto.archivoFileName = fileNames[index] || '';
      archivoAdjunto.archivoSize = sizes[index] || 0;
      archivoAdjunto.archivoUrl = urls[index] || '';
      this.archivosArrayUploaded.push(archivoAdjunto);
      this.nombresUnicosArchivosUploaded.add(fileNames[index]);
    }
  }

  /**
   *
   * Este método privado se encarga de actualizar el estado del archivo en curso durante un proceso de carga o descarga.
   *
   * @param loaded - Es el número de bytes que se han cargado o descargado hasta el momento.
   * @param total - Es el tamaño total del archivo en bytes.
   * @param requestType - Es el tipo de solicitud que se está realizando, por ejemplo, 'carga' o 'descarga'.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Establece `this.fileStatus.status` en `'progress'`: Esto indica que el archivo está en proceso de carga o descarga.
   * - Actualiza `this.fileStatus.requestType` con el valor de `requestType`: Esto permite rastrear el tipo de solicitud que se está realizando.
   * - Calcula y actualiza `this.fileStatus.percent` con el porcentaje de progreso de la carga o descarga. Esto se calcula como el número de bytes cargados o descargados dividido por el tamaño total del archivo, multiplicado por 100.
   */
  private updateStatus(loaded: number, total: number, requestType: string) {
    this.fileStatus.status = 'progress';
    this.fileStatus.requestType = requestType;
    this.fileStatus.percent = Math.round(100 * (loaded / total));
  }

  /**
   *
   * Este método se encarga de validar que todos los archivos cumplan con las siguientes condiciones:
   *
   * - No sean más de MAX_IMAGE_UPLOAD_COUNT archivos.
   * - No excedan el tamaño máximo permitido MAX_FILE_UPLOAD_SIZE).
   * - Tengan un nombre único.
   *
   * @param files - Lista de archivos a validar.
   * @returns boolean - Retorna `true` si todos los archivos cumplen con las condiciones, `false` en caso contrario.
   */
  private validateArchivos(files: FileList): boolean {
    // Reiniciar el estado de carga de archivos
    this.isUploadingArchivosToEdit = false;

    // Validar que no sean más de MAX_IMAGE_UPLOAD_COUNT archivos
    if (files.length > MAX_IMAGE_UPLOAD_COUNT) {
      this.erroresArray.push('Máximo '+ MAX_IMAGE_UPLOAD_COUNT + ' archivos a subir');
      return false;
    }

    // Crear un nuevo conjunto para almacenar los nombres de los archivos
    this.nombresUnicosArchivosUploaded = new Set();

    for (let i = 0; i < files.length; i++) {
      const file: File = files[i];

      // Validar que el archivo no exceda el tamaño máximo
      if (file.size >= MAX_FILE_UPLOAD_SIZE) {
        this.erroresArray.push(
          `El archivo ${file.name} excede el tamaño máximo. (200MB)`
        );
        return false;
      }

      // Validar que el archivo tenga un nombre único
      if (this.nombresUnicosArchivosUploaded.has(file.name)) {
        this.erroresArray.push(
          `Hay un archivo con el mismo nombre: ${file.name}`
        );
        return false;
      }

      // Agregar el nombre del archivo al conjunto de nombres únicos
      this.nombresUnicosArchivosUploaded.add(file.name);
    }

    return true;
  }

  /**
   * Método `flagHandlerError()`
   *
   * Este método se encarga de gestionar las banderas en caso de que ocurra un error durante el proceso de carga de archivos.
   *
   * Cuando se invoca este método, realiza las siguientes acciones:
   *
   * - Establece `this.isUploadingArchivosToEdit` en `false`: Esto indica que el proceso de carga de archivos para editar ha terminado.
   * Se utiliza para controlar el estado de la carga de archivos que están siendo preparados para la edición.
   *
   * - Establece `this.isUploadingArchivoToCloud` en `false`: Esto indica que el proceso de subida de archivos a la nube ha terminado.
   * Se utiliza para controlar el estado de la carga de archivos que están siendo subidos a la nube.
   *
   * Este método se invoca generalmente cuando ocurre un error durante la carga o la subida de archivos,
   * para asegurar que las banderas reflejen correctamente el estado del sistema.
   */
  private flagHandlerError(): void {
    this.isUploadingArchivosToEdit = false; // Indicar que se dejó de cargar archivos
    this.isUploadingArchivoToCloud = false; // Indicar que dejó de subir archivos
  }
}
