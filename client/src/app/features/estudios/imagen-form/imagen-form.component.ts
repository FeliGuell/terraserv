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
import { DataUrl, NgxImageCompressService } from 'ngx-image-compress';
import { ImagenToUpload } from 'src/app/core/models/imagen/imagen-to-upload.model';
import { AssetService } from 'src/app/core/services/asset.service';
import { ImagenService } from 'src/app/core/services/imagen.service';
import { Imagen } from 'src/app/core/models/imagen/imagen.model';
import { AssetResponse } from 'src/app/core/models/asset-response';
import * as Constants from 'src/app/core/constants/asset.constants';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-imagen-form',
  templateUrl: './imagen-form.component.html',
  styleUrls: ['./imagen-form.component.css'],
})
export class ImagenFormComponent implements OnChanges, DoCheck {
  @Input() parentForm: FormGroup; // Formulario de estudio-create
  @Input() uploadEstudioToEditFinish: boolean = false; // Indicador de estudio cargado para la edición
  @Output() readyImagenes: EventEmitter<boolean> = new EventEmitter<boolean>(); // Enviar evento al padre para indicar que no hay operaciones en curso

  // Obtener el FormArray para las imagenes
  get imagenesFormArray(): FormArray {
    return this.parentForm.get('imagenes') as FormArray;
  }

  erroresArray: string[] = []; // Un array para guardar los errores que van a ser enviados al componente padre

  // Contadores de imágenes
  imagenesSeleccionadasContador = 0;
  imagenesTotalesContador = 0;

  //Banderas
  stopUpload: boolean = false; // Bandera para que detenga la carga de imágenes en caso de errores
  uploadImagenesToCloudFinish: boolean = true; // Bandera para indicar que no hay imágenes por subir a la nube
  isUploadingImagenesToEdit: boolean = false; // Bandera para indicar que se están cargando las imágenes del estudio a editar
  isUploadingImagenesToCloud: boolean = false; // Bandera para indicar que se están subiendo las imágenes al servidor

  imagenesArrayUploaded: Imagen[] = []; // Arreglo para ver las imágenes subidas en la nube
  imagenesArrayPreview: ImagenToUpload[] = []; // Arreglo para ver las imágenes próximas a subir
  nombresUnicosImagen = new Set<string>(); // Una colección de nombres únicos de las imágenes

  formData = new FormData(); // FormData para enviar todas las imágenes a subir

  fileStatus = { status: '', requestType: '', percent: 0 }; // Estado de carga de las imágenes

  constructor(
    private assetService: AssetService,
    private imagenService: ImagenService,
    private formBuilder: FormBuilder,
    private imageCompress: NgxImageCompressService
  ) {}

  /**
   * Método del ciclo de vida de Angular que se ejecuta cuando cambian las propiedades vinculadas a datos de entrada.
   * Este método verifica si se ha completado la carga del formulario del estudio a editar y, si es así,
   * indica que se están cargando las imágenes del estudio a editar y llama al método para cargar las imágenes.
   *
   * @param changes Objeto que contiene los cambios actuales y anteriores para cada propiedad vinculada a datos de entrada.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Verificar si se ha completado la carga del formulario del estudio a editar
    if (
      changes['uploadEstudioToEditFinish'] &&
      changes['uploadEstudioToEditFinish'].currentValue === true
    ) {
      // Indicar que se están cargando las imágenes del estudio a editar y cargar las imágenes
      this.isUploadingImagenesToEdit = true;
      this.loadImagenes();
    }
  }

  /**
   * Método de ciclo de vida de Angular que se ejecuta cuando Angular realiza la detección de cambios.
   * Este método verifica si todas las operaciones de carga de imágenes han finalizado y emite un evento
   * con el resultado para indicar si se puede proceder con la creación del estudio geofísico.
   */
  ngDoCheck(): void {
    // Comprobar si todas las operaciones de carga de imágenes han finalizado
    const canProceed =
      this.uploadImagenesToCloudFinish &&
      !this.isUploadingImagenesToEdit &&
      !this.isUploadingImagenesToCloud;

    // Emitir un evento con el resultado de la comprobación
    // Si 'canProceed' es verdadero, se puede proceder con la creación del estudio geofísico
    // Si 'canProceed' es falso, aún hay operaciones de carga de imágenes en curso
    this.readyImagenes.emit(canProceed);
  }

  /**
   * Prepara las imágenes seleccionadas por el usuario para su posterior carga al servidor.
   * Este método reinicia el arreglo de errores, valida y cuenta las imágenes seleccionadas,
   * y las almacena en un arreglo para su previsualización. Si las imágenes no son válidas,
   * el proceso se detiene y no se realiza la carga.
   *
   * @param event El evento disparado por el input de selección de archivos.
   */
  prepareImagesForUpload(event: Event): void {
    // Reiniciar el arreglo de errores
    this.erroresArray = [];

    // Obtener el elemento de entrada de archivos y validar su existencia
    const inputElement = event.target as HTMLInputElement;
    if (!inputElement.files || inputElement.files.length === 0) {
      return; // No continuar si no hay archivos seleccionados
    }

    // Contar y validar las imágenes seleccionadas
    const files: FileList = inputElement.files;
    this.uploadImagenesToCloudFinish = false; // Indicar que hay imágenes pendientes de carga
    this.imagenesSeleccionadasContador = files.length;

    if (!this.validateImageFiles(files)) {
      return; // No continuar si las imágenes no son válidas
    }

    // Sumar al contador total de imágenes y almacenar para previsualización
    this.imagenesTotalesContador += this.imagenesSeleccionadasContador;
    const filesArray: File[] = Array.from(files);
    this.storeImagePreviews(filesArray);

    // Resetear el valor del input para permitir nuevas selecciones de archivos
    inputElement.value = '';
  }

  /**
   * Sube las imágenes seleccionadas al servidor.
   * Este método gestiona el proceso completo de carga, incluyendo la rotación y compresión de imágenes,
   * la creación de un FormData con las imágenes, y la comunicación con el servicio de carga.
   * Si la carga se detiene o se encuentra con errores, se maneja adecuadamente.
   * Al completar la carga, se actualiza el estado de la aplicación y se muestra una notificación al usuario.
   */
  async uploadImagenes(): Promise<void> {
    // Verificar si la carga de imágenes está detenida
    if (this.stopUpload) {
      Swal.fire('Error', 'La carga de imágenes ha sido detenida', 'error');
      return;
    }

    // Indicar que ha comenzado la carga de imágenes
    this.isUploadingImagenesToCloud = true;

    try {
      // Realizar la rotación y compresión de las imágenes antes de la carga
      await this.rotateImageSave();
      await this.compressAndSaveImage();
    } catch (error) {
      // Manejar errores durante la rotación o compresión
      console.error('Ocurrió un error en la subida de imágenes: ', error);
      this.flagHandlerError();
      return; // Detener la ejecución si hay un error
    }

    // Preparar el FormData con las imágenes para la carga
    this.imagenesArrayPreview.forEach((imagen) => {
      this.formData.append('files', imagen.blob, imagen.fileName);
    });

    // Iniciar la carga de imágenes al servidor
    this.assetService.upload(this.formData).subscribe({
      next: (event) => this.reportProgress(event),
      error: () => this.flagHandlerError(),
      complete: () => {
        this.updateImagenesFormArray(); // Actualizar el formArray

        // Actualizar el estado y notificar al usuario al completar la carga
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Imagenes subidas con éxito!',
          showConfirmButton: false,
          timer: Constants.ALERT_TIMER,
        });

        // Reiniciar los estados y preparar para una nueva carga si es necesario
        this.imagenesArrayPreview = [];
        this.isUploadingImagenesToCloud = false;
        this.uploadImagenesToCloudFinish = true;
        this.formData = new FormData();
      },
    });
  }

  /**
   * Elimina una imagen subida al servidor identificada por su clave única.
   * Este método busca la imagen en el arreglo de imágenes subidas y, si la encuentra,
   * procede a deshabilitar el botón de eliminación y a solicitar su eliminación del servidor.
   * Gestiona los errores y actualiza el estado de la aplicación según corresponda.
   *
   * @param key La clave única de la imagen a eliminar del servidor.
   * @throws {Error} Si la clave es nula o si la imagen no se encuentra en el arreglo.
   */
  deleteImageUpload(key: string): void {
    // Validar que la clave no sea nula o indefinida
    if (!key) {
      console.error(
        'Error al eliminar: La clave proporcionada es nula o indefinida'
      );
      this.flagHandlerError();
      throw new Error('Error al eliminar el recurso: Clave inválida');
    }

    // Buscar el índice de la imagen en el arreglo por su clave
    const index = this.imagenesArrayUploaded.findIndex(
      (imagen) => imagen.imagenKey === key
    );

    // Si no se encuentra la imagen, manejar el error
    if (index === -1) {
      console.error(
        'Error al eliminar: No se encontró la imagen con la clave proporcionada'
      );
      this.flagHandlerError();
      throw new Error('Error al eliminar el recurso: Imagen no encontrada');
    }

    // Deshabilitar el botón de eliminación y solicitar la eliminación de la imagen al servidor
    const imagen = this.imagenesArrayUploaded[index];
    imagen.deleteButtonDisabled = true;

    this.assetService.delete(key).subscribe({
      next: () => {
        // Eliminar el nombre del archivo del conjunto de nombres únicos si existe
        this.nombresUnicosImagen.delete(imagen.imagenFileName!);

        // Eliminar la imagen del formulario y del arreglo de imágenes subidas
        this.imagenesFormArray.removeAt(index);
        this.imagenesArrayUploaded.splice(index, 1);

        // Limpiar el arreglo de errores y actualizar el contador total de imágenes
        this.erroresArray = [];
        console.info(`Imagen con clave ${key} eliminada exitosamente.`);
      },
      error: () => this.flagHandlerError(),
      complete: () => this.imagenesTotalesContador--, // Decrementar el contador total de imágenes
    });
  }

  /**
   * Elimina una imagen específica del arreglo de previsualizaciones y actualiza el estado relevante.
   * Este método busca la imagen por su nombre de archivo y, si la encuentra, la elimina del arreglo.
   * También maneja los errores y actualiza los contadores y estados relacionados con la carga de imágenes.
   *
   * @param fileName El nombre del archivo de la imagen a eliminar.
   * @throws {Error} Si el nombre del archivo es nulo o si la imagen no se encuentra en el arreglo.
   */
  deleteImagePreview(fileName: string): void {
    // Validar que el nombre del archivo no sea nulo o indefinido
    if (!fileName) {
      console.error('Error al eliminar: el fileName es null o indefinido');
      this.flagHandlerError();
      throw new Error('Error al eliminar el recurso: fileName inválido');
    }

    // Buscar el índice de la imagen en el arreglo por su nombre de archivo
    const index = this.imagenesArrayPreview.findIndex(
      (imagen) => imagen.fileName === fileName
    );

    // Si no se encuentra la imagen, manejar el error
    if (index === -1) {
      console.error(
        `Error al eliminar: No se encontró la imagen con el fileName: ${fileName}`
      );
      this.flagHandlerError();
      throw new Error('Error al eliminar el recurso: Imagen no encontrada');
    }

    // Deshabilitar el botón de eliminación y eliminar la imagen del arreglo
    this.imagenesArrayPreview[index].deleteButtonDisabled = true;
    this.imagenesArrayPreview.splice(index, 1);
    this.imagenesTotalesContador--; // Decrementar el contador total de imágenes
    this.erroresArray = []; // Limpiar el arreglo de errores

    // Eliminar el nombre del archivo del conjunto de nombres únicos
    this.nombresUnicosImagen.delete(fileName);

    // Actualizar los estados de carga según si quedan imágenes por subir
    this.uploadImagenesToCloudFinish = this.imagenesTotalesContador === 0;
    this.uploadEstudioToEditFinish = this.imagenesTotalesContador !== 0;
  }

  /**
   * Carga las imágenes asociadas a un estudio geofísico para su edición.
   * Este método verifica primero si hay imágenes para cargar en el FormArray.
   * Si hay imágenes, obtiene sus claves y solicita al servicio de imágenes que las recupere.
   * Una vez que las imágenes son recuperadas, se almacenan y se actualiza el contador de imágenes totales.
   * Si no hay imágenes o si la cantidad de imágenes recuperadas no coincide con las claves proporcionadas,
   * se maneja el error adecuadamente.
   */
  private loadImagenes(): void {
    // Verificar si el FormArray de imágenes está vacío
    if (!this.imagenesFormArray || this.imagenesFormArray.length === 0) {
      this.isUploadingImagenesToEdit = false;
      return;
    }

    // Extraer las claves de las imágenes para su carga
    const keysImagenes: string[] = this.imagenesFormArray.controls
      .map((control) => control.get('imagenKey')?.value)
      .filter(Boolean) as string[];

    // Si no hay claves de imágenes, no hay nada que cargar
    if (keysImagenes.length === 0) {
      this.isUploadingImagenesToEdit = false;
      return;
    }

    // Solicitar al servicio de imágenes la carga de las imágenes por sus claves
    this.imagenService.getImagenesByKeys(keysImagenes).subscribe({
      next: (imagenes) => {
        // Asegurarse de que el número de imágenes recibidas coincida con el número de claves
        if (imagenes.length !== keysImagenes.length) {
          console.error(
            'Error: La cantidad de imágenes recibidas no coincide con las claves proporcionadas'
          );
          this.flagHandlerError();
          return;
        }

        // Almacenar las imágenes recibidas y actualizar el contador total
        this.storeImagenUploaded(imagenes);
        this.imagenesTotalesContador += imagenes.length;
      },
      error: () => this.flagHandlerError(),
      complete: () => (this.isUploadingImagenesToEdit = false), // Indicar la finalización de la carga
    });
  }

  /**
   * Maneja los eventos de progreso durante la carga de archivos al servidor.
   * Este método actualiza el estado de la carga basándose en el tipo de evento HTTP recibido.
   * En caso de un evento de progreso de carga, llama a `updateStatus` para actualizar el porcentaje de carga.
   * Si se recibe una respuesta completa, procesa los archivos recibidos y verifica la consistencia de los datos.
   *
   * @param httpEvent Evento HTTP que contiene información sobre el progreso o la respuesta de la carga.
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
            this.storeArraysInImagenUploaded(
              keysBody,
              urlsBody,
              fileNamesBody,
              sizesBody
            );
          } else {
            console.error(`Los arreglos no tienen la misma longitud en imagen-form -> keyBody:${keysBody.length}, 
                                                                                      urlsBody:${urlsBody.length}, 
                                                                                      fileNames:${fileNamesBody.length}
                                                                                      sizes:${sizesBody.length}`);
            this.flagHandlerError();
            throw new Error('Error en la respuesta del servidor');
          }
        }
        this.fileStatus.status = 'done'; // Actualizar el estado a 'done' una vez completado
        break;

      default:
        // Manejar otros tipos de eventos HTTP si es necesario
        break;
    }
  }

  /**
   * Actualiza el estado del progreso de carga o descarga de un archivo.
   * Este método establece el estado del archivo en 'progress' y calcula el porcentaje completado
   * basado en la cantidad de datos cargados y el tamaño total del archivo. También registra el tipo de solicitud
   * que se está realizando, ya sea carga o descarga.
   *
   * @param loaded Cantidad de datos ya cargados o descargados.
   * @param total Tamaño total del archivo que se está cargando o descargando.
   * @param requestType Tipo de solicitud en curso ('upload' o 'download').
   */
  private updateStatus(
    loaded: number,
    total: number,
    requestType: string
  ): void {
    this.fileStatus.status = 'progress';
    this.fileStatus.requestType = requestType;
    this.fileStatus.percent = Math.round((100 * loaded) / total);
  }

  /**
   * Almacena las previsualizaciones de imágenes en un arreglo y actualiza un conjunto con los nombres de archivo únicos.
   * Cada archivo se lee como una URL de datos base64 y se almacena junto con sus metadatos en `imagenesArrayPreview`.
   * Si ocurre un error durante la lectura o asignación, se maneja y se lanza una excepción.
   *
   * @param files Array de objetos File que representan los archivos de imagen a previsualizar.
   */
  private storeImagePreviews(files: File[]): void {
    for (const file of files) {
      const reader = new FileReader();
      const imagenToUpload = new ImagenToUpload();

      // Inicialización de propiedades de la imagen con valores predeterminados
      imagenToUpload.blob = file;
      imagenToUpload.fileName = file.name;
      imagenToUpload.orientation = 0; // La orientación predeterminada es 0
      imagenToUpload.angle = 0; // El ángulo predeterminado es 0
      imagenToUpload.deleteButtonDisabled = false; // El botón de eliminar está habilitado por defecto

      reader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target?.result) {
          imagenToUpload.base64 = event.target.result as string;
          this.imagenesArrayPreview.push(imagenToUpload);
          this.nombresUnicosImagen.add(imagenToUpload.fileName);
        } else {
          console.error('Error al cargar la imagen:', event);
          this.flagHandlerError();
          throw new Error('Error al cargar la imagen');
        }
      };

      reader.onerror = (error) => {
        console.error('Error al leer el archivo:', error);
        this.flagHandlerError();
        throw new Error('Error al leer el archivo');
      };

      reader.readAsDataURL(file);

    }
  }

  /**
   * Este método privado se utiliza para procesar un array de objetos `Imagen` y almacenarlos en el array `imagenesArrayUploaded`.
   * Cada objeto `Imagen` representa una imagen que ha sido subida.
   * Además, el nombre de cada archivo se añade a un conjunto de nombres únicos para evitar duplicados.
   *
   * @param imagenes Array de objetos `Imagen` que representan las imágenes subidas.
   */
  private storeImagenUploaded(imagenes: Imagen[]) {
    imagenes.forEach((imagen) => {
      const imagenUploaded = new Imagen();
      imagenUploaded.imagenKey = imagen.imagenKey || '';
      imagenUploaded.imagenFileName = imagen.imagenFileName || '';
      imagenUploaded.imagenSize = imagen.imagenSize || 0;
      imagenUploaded.imagenUrl = imagen.imagenUrl || '';

      this.imagenesArrayUploaded.push(imagenUploaded);

      if (imagen.imagenFileName != null) {
        this.nombresUnicosImagen.add(imagen.imagenFileName!);
      }
    });
  }

  /**
   * Este método privado se utiliza para cargar los datos de las imágenes subidas en la nube y almacenarlos en un arreglo.
   * Cada imagen se representa como un objeto `Imagen` que se añade al arreglo `imagenesArrayUploaded`.
   * Además, el nombre de cada archivo se añade a un conjunto de nombres únicos para evitar duplicados.
   *
   * @param keys Array de claves únicas que identifican a cada imagen en la nube.
   * @param urls Array de URLs donde se alojan las imágenes en la nube.
   * @param fileNames Array de nombres de los archivos de imagen.
   * @param sizes Array de tamaños de los archivos de imagen.
   */
  private storeArraysInImagenUploaded(
    keys: string[],
    urls: string[],
    fileNames: string[],
    sizes: number[]
  ): void {
    keys.forEach((key, index) => {
      const imagenUploaded = new Imagen();
      imagenUploaded.imagenKey = key;
      imagenUploaded.imagenUrl = urls[index];
      imagenUploaded.imagenFileName = fileNames[index];
      imagenUploaded.imagenSize = sizes[index];
      imagenUploaded.deleteButtonDisabled = false;

      this.imagenesArrayUploaded.push(imagenUploaded);
      this.nombresUnicosImagen.add(imagenUploaded.imagenFileName);
    });
  }

  /**
   * Comprime las imágenes y actualiza el arreglo de previsualizaciones con los datos comprimidos.
   *
   * Este método asincrónico itera sobre el arreglo `imagenesArrayPreview` y, para cada imagen,
   * utiliza `imageCompress` para reducir su tamaño. La imagen resultante en formato base64 se
   * convierte de nuevo a un objeto Blob y se actualizan las propiedades `blob` y `base64` de la imagen.
   *
   * Si la conversión de base64 a Blob falla, se registra un error y se lanza una excepción.
   * El método espera a que todas las imágenes sean procesadas antes de completar su ejecución.
   *
   * @throws Un error si la conversión de base64 a Blob falla o si ocurre un error durante la compresión.
   */
  async compressAndSaveImage() {
    try {
      const promises = this.imagenesArrayPreview.map((img) => {
        try {
          return this.imageCompress
            .compressFile(
              img.base64,
              img.orientation,
              Constants.COMPRESSION_RATIO,
              Constants.IMG_QUALITY
            )
            .then((imgBase64: DataUrl) => {
              const blob = this.base64ToBlob(imgBase64);
              if (blob) {
                img.blob = blob;
                img.base64 = imgBase64;
              } else {
                console.error(
                  'No se pudo realizar la conversión de base64 a tipo blob'
                );
                throw new Error(
                  'No se pudo realizar la conversión de base64 a tipo blob'
                );
              }
            });
        } catch (error) {
          console.error('Error en la compresión de la imagen:', error);
          throw new Error('Hubo un error en la compresión de la imágen');
        }
      });
      await Promise.all(promises); // Esperar a que todas las promesas se resuelvan
    } catch (error) {
      console.error('Error en compressAndSaveImage:', error);
      throw new Error('Hubo un error en la compresión de la imágen');
    }
  }

  /**
   * Rota las imágenes según el ángulo especificado y actualiza el arreglo de previsualizaciones.
   *
   * Este método asincrónico procesa cada imagen en `imagenesArrayPreview` que tiene un ángulo asignado
   * diferente de cero. Para cada imagen, se crea una nueva representación rotada utilizando un elemento canvas.
   * Luego, la imagen rotada se convierte de nuevo a un objeto Blob y a una cadena base64, que se almacenan
   * en las propiedades correspondientes de la imagen. El ángulo de la imagen se restablece a cero después
   * de la rotación.
   *
   * El método maneja la carga y el procesamiento de imágenes de forma asíncrona, utilizando promesas para
   * asegurar que todas las imágenes se procesen antes de resolver la promesa principal.
   *
   * @returns Una promesa que se resuelve cuando todas las imágenes han sido rotadas y actualizadas.
   * @throws Un error si ocurre un problema durante la creación del blob o la conversión a base64.
   */
  async rotateImageSave(): Promise<void> {
    try {
      const promises: Promise<void>[] = [];

      this.imagenesArrayPreview.forEach((imagen) => {
        if (imagen.angle != 0) {
          const promise = new Promise<void>((resolve, reject) => {
            const img = new Image(); // Crear una Image para obtener el width y height
            img.src = URL.createObjectURL(imagen.blob);

            img.onload = () => {
              // Crear un canvas
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');

              // Establecer las dimensiones del canvas
              if (imagen.angle % 180 === 0) {
                canvas.width = img.width;
                canvas.height = img.height;
              } else {
                canvas.width = img.height;
                canvas.height = img.width;
              }

              context?.translate(canvas.width / 2, canvas.height / 2); // Mover el origen al centro del canvas
              context?.rotate((imagen.angle * Math.PI) / 180); // Rotar el canvas
              context?.drawImage(img, -img.width / 2, -img.height / 2); // Dibujar la imagen en el canvas rotado

              // Convertir el contenido del canvas a un Blob
              canvas.toBlob(
                async (blob) => {
                  if (blob) {
                    imagen.blob = blob; // Guardar el Blob en la imagen
                    const base64 = await this.blobToBase64(blob);
                    imagen.base64 = base64 as string; // Guardar el base64 en la imagen
                    imagen.angle = 0; // Resetear el ángulo
                    resolve();
                  } else {
                    console.error('No se pudo crear el blob de canvas.');
                    reject(new Error('No se pudo crear el blob de canvas.'));
                  }
                },
                'image/jpeg',
                Constants.IMAGE_QUALITY_SCALE
              );
            };
          });

          promises.push(promise);
        }
      });
      // Devolver una nueva promesa que se resuelve cuando todas las imágenes han sido procesadas
      await Promise.all(promises);
    } catch (error) {
      console.error('Error en rotateImagenSave:', error);
      throw new Error('Hubo un error en rotateImagenSave');
    }
  }

  /**
   * Este método privado se utiliza para obtener el tipo MIME de una cadena en formato base64.
   * El tipo MIME es un estándar que se utiliza para definir el tipo de los datos contenidos en un archivo o una cadena.
   * En este caso, se extrae del prefijo de la cadena base64, que tiene el formato 'data:[MIME];base64,'.
   *
   * @param base64 Es una cadena que contiene los datos en formato base64 de los que se quiere obtener el tipo MIME.
   * @returns Retorna una cadena con el tipo MIME obtenido de la cadena base64.
   *          Si no se puede determinar el tipo MIME, retorna null.
   */
  private getMimeType(base64: string): string | null {
    // La expresión regular busca el patrón 'data:[MIME];' en la cadena base64
    const mimeTypeMatch = base64.match(
      /data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/
    );

    // Si se encuentra el patrón, se retorna el tipo MIME. Si no, se retorna null.
    return mimeTypeMatch && mimeTypeMatch.length ? mimeTypeMatch[1] : null;
  }

  /**
   * Convierte una cadena en formato base64 a un objeto Blob.
   *
   * Este método extrae el tipo MIME de la cadena base64 y utiliza esta información
   * para convertir los datos codificados en base64 de nuevo a un objeto Blob.
   *
   * Si la cadena base64 no contiene un tipo MIME válido o la conversión falla,
   * se invoca el método `flagHandlerError` para gestionar el estado de error.
   *
   * @param base64 La cadena en formato base64 que se desea convertir a Blob.
   * @returns Un objeto Blob representando los datos de la imagen o `null` si la conversión falla.
   * @throws Un error si no se puede obtener el tipo MIME de la cadena base64.
   */
  private base64ToBlob(base64: string): Blob | null {
    // Intentar obtener el tipo MIME de la cadena base64
    const mimeType = this.getMimeType(base64);
    if (!mimeType) {
      this.flagHandlerError();
      throw new Error('No se pudo obtener el MIME type de la cadena base64.');
    }

    // Eliminar el prefijo del tipo MIME de la cadena base64
    const base64Data = base64.split(',')[1];
    if (!base64Data) {
      this.flagHandlerError();
      throw new Error('La cadena base64 no es válida.');
    }

    // Convertir la cadena base64 a un array de bytes
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Crear y retornar el objeto Blob
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * Convierte un objeto Blob a una cadena en formato base64.
   *
   * Este método asincrónico inicia la conversión de un Blob a una cadena base64,
   * que representa los datos del archivo en un formato que puede ser fácilmente
   * transmitido o almacenado. Es útil para la codificación de archivos de imagen
   * para su uso en fuentes de datos URI, entre otros casos de uso.
   *
   * El proceso de conversión se realiza mediante un FileReader, que lee el contenido
   * del Blob y dispara eventos basados en el progreso de la lectura:
   * - `onloadend`: Se ejecuta al finalizar la carga del Blob, resolviendo la promesa
   *   con el resultado en base64 si la lectura es exitosa.
   * - `onerror`: Se ejecuta si ocurre un error durante la lectura del Blob, rechazando
   *   la promesa con un mensaje de error detallado.
   *
   * @param blob El objeto Blob que se desea convertir a base64.
   * @returns Una promesa que se resuelve con la representación en base64 del Blob.
   * @throws Un error si la conversión falla o si ocurre un error durante la lectura del Blob.
   */
  async blobToBase64(blob: Blob) {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = function () {
          if (reader.result) {
            resolve(reader.result as string);
          } else {
            reject(new Error('La lectura del blob no produjo resultados.'));
          }
        };

        reader.onerror = (event) => {
          reject(new Error('Error al leer el blob: ' + (event as any).error));
        };

        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error en blobToBase64:', error);
      throw new Error('Hubo un error en blobToBase64');
    }
  }

  /**
   * Actualiza el FormArray `imagenesFormArray` con las imágenes recién subidas.
   *
   * Este método itera sobre el arreglo `imagenesArrayUploaded` y añade cada imagen al `imagenesFormArray`.
   * Antes de añadir una nueva imagen, realiza una verificación para asegurarse de que no se introduzcan duplicados.
   *
   * Proceso:
   * 1. Itera sobre cada objeto de imagen en `imagenesArrayUploaded`.
   * 2. Verifica si el `imagenKey` de la imagen actual ya existe en `imagenesFormArray`.
   * 3. Si no existe, crea un nuevo FormGroup con los detalles de la imagen.
   * 4. Añade el FormGroup al `imagenesFormArray`.
   *
   * De esta manera, el FormArray mantiene una lista única de imágenes sin duplicados,
   * lo cual es esencial para evitar errores en la subida y en la presentación de las imágenes al usuario.
   */
  private updateImagenesFormArray(): void {
    this.imagenesArrayUploaded.forEach((imagen) => {
      const existeImagen = this.imagenesFormArray.controls.some(
        (control) => control.get('imagenKey')?.value === imagen.imagenKey
      );

      if (!existeImagen) {
        const group = this.formBuilder.group({
          imagenKey: imagen.imagenKey,
          imagenFileName: imagen.imagenFileName,
          imagenSize: imagen.imagenSize,
        });
        this.imagenesFormArray.push(group);
      }
    });
  }

  /**
   * Valida una colección de archivos de imagen según criterios específicos.
   *
   * Este método verifica que la selección de archivos cumpla con las siguientes condiciones:
   * - No superar el número máximo permitido de imágenes (MAX_FILE_UPLOAD_SIZE imágenes).
   * - Asegurar que todos los archivos sean de tipo imagen.
   * - Confirmar que cada archivo no exceda el tamaño máximo permitido (200MB).
   * - Verificar que cada imagen tenga un nombre único dentro del conjunto de archivos.
   *
   * Si alguna de las imágenes no cumple con estos criterios, se agrega un mensaje de error
   * correspondiente al arreglo `erroresArray` y se retorna `false`.
   *
   * @param files Lista de archivos seleccionados por el usuario a través de un input de tipo "file".
   * @returns `true` si todos los archivos pasan las validaciones, de lo contrario `false`.
   */
  private validateImageFiles(files: FileList): boolean {
    if (this.imagenesSeleccionadasContador > Constants.MAX_IMAGE_UPLOAD_COUNT) {
      this.erroresArray.push('Máximo '+ Constants.MAX_FILE_UPLOAD_SIZE + ' imágenes a subir');
      return false;
    } else {
      if (
        this.imagenesTotalesContador + this.imagenesSeleccionadasContador >
        Constants.MAX_FILE_UPLOAD_SIZE 
      ) {
        this.erroresArray.push('Máximo '+ Constants.MAX_FILE_UPLOAD_SIZE +' imágenes a subir');
        return false;
      }
    }
    for (let i = 0; i < files.length; i++) {
      const file: File = files[i];
      if (!file.type.startsWith('image/')) {
        this.erroresArray.push(`El archivo ${file.name} no es una imagen.`);
        return false;
      } else if (file.size >= Constants.MAX_FILE_UPLOAD_SIZE) {
        this.erroresArray.push(
          `El archivo ${file.name} excede el tamaño máximo. (200MB)`
        );
        return false;
      } else if (this.nombresUnicosImagen.has(file.name)) {
        this.erroresArray.push(
          `Hay archivos con el mismo nombre: ${file.name}`
        );
        return false;
      }
    }
    return true;
  }

  /**
   * Gestiona las banderas de estado durante un error en la subida de imágenes.
   * Este método se encarga de actualizar las banderas de control para reflejar
   * que el proceso de carga y subida de imágenes se ha detenido debido a un error.
   *
   * - `isUploadingImagenesToEdit`: Se establece en `false` para indicar que la carga de imágenes para edición se ha detenido.
   * - `isUploadingImagenesToCloud`: Se establece en `false` para indicar que la subida de imágenes a la nube se ha detenido.
   * - `stopUpload`: Se establece en `true` para detener cualquier subida de imágenes en curso.
   *
   * Además, verifica si todas las imágenes han sido procesadas:
   * - `uploadImagenesToCloudFinish`: Se establece en `true` si el contador de imágenes totales es cero, indicando que no hay más imágenes pendientes de subida.
   * - De lo contrario, se establece en `false`, lo que implica que aún hay imágenes que no se han subido a la nube.
   */
  private flagHandlerError(): void {
    this.isUploadingImagenesToEdit = false;
    this.isUploadingImagenesToCloud = false;
    this.stopUpload = true;

    if (this.imagenesTotalesContador === 0) {
      this.uploadImagenesToCloudFinish = true;
    } else {
      this.uploadImagenesToCloudFinish = false;
    }
  }
}
