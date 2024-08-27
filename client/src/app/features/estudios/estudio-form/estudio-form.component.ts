import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormArray,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormControl,
  FormGroup,
  ValidatorFn,
} from '@angular/forms';
import { EstudioGeofisicoService } from '../../../core/services/estudio-geofisico.service';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { EnumTipoEstudioGeofisico } from 'src/app/core/models/enums/tipo-estudio.enum';
import { EnumAreaAplicacionEstudioGeofisico } from 'src/app/core/models/enums/area-estudio.enum';
import {
  MAX_VALUE_LATITUDE,
  MAX_VALUE_LONGITUDE,
  MIN_VALUE_LATITUDE,
  MIN_VALUE_LONGITUDE,
} from '../../../core/constants/coordenadas.contants';

@Component({
  selector: 'app-estudio-form',
  templateUrl: './estudio-form.component.html',
  styleUrls: ['./estudio-form.component.css'],
})
export class EstudioFormComponent implements OnInit {
  // Enums
  tipoEstudioOptions: { value: EnumTipoEstudioGeofisico; label: string }[] = [];
  areaEstudioOptions: {
    value: EnumAreaAplicacionEstudioGeofisico;
    label: string;
  }[] = [];
  selectedOptions: EnumTipoEstudioGeofisico[] = [];

  // Banderas
  uploadEstudioToEditFinish: boolean = false; //Bandera para indicar que se cargó correctamente el estudio a editar
  isUploadingEstudioToEdit: boolean = false; //Bandera para indicar que se están cargando el estudio geofísico a editar
  isUploadingEstudioToCloud: boolean = false; //Bandera para indicar que se está subiendo el estudio geofísico a la nube
  readyImagenes: boolean = true; // Bandera para indicar si no hay operaciones en curso en las imágenes
  readyArchivos: boolean = true; // Bandera para indicar si no hay operaciones en curso en los archivos
  parameterExists: boolean = false; // Bandera para indicar si existen parametros
  userLoginOn: boolean = false; // Bandera para indicar si está logueado el usuario

  idEstudioToEdit: number; // id del estudio a editar

  //Formulario principal
  form: FormGroup;

  // Errores
  erroresMap = new Map();
  erroresArray: { key: string; value: string }[] = [];

  constructor(
    private estudioGeofisicoService: EstudioGeofisicoService,
    private formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) {}

  /**
   * Función que se ejecuta al inicializar el componente.
   * Inicializa el formulario principal, obtiene las opciones de tipos de estudio y áreas de aplicación,
   * y carga un estudio geofísico si se proporciona un id en los parámetros de ruta.
   */
  ngOnInit(): void {
    // Inicializa el formulario principal
    this.initializeMainForm();

    // Obtiene las opciones de tipos de estudio
    this.getEstudioTipoOptions();

    // Obtiene las opciones de áreas de aplicación
    this.getAreaEstudioOptions();

    // Carga un estudio geofísico si se proporciona un id en los parámetros de ruta
    this.loadEstudioIfIdProvided();
  }

  /**
   * Inicializa el formulario principal con sus respectivos campos y validadores.
   */
  private initializeMainForm(): void {
    this.form = this.formBuilder.group({
      nombreEstudio: ['', Validators.required],
      nombreCliente: ['', Validators.required],
      descripcion: ['', Validators.required],
      fechaRealizado: ['', [Validators.required, this.fechaRealizadoValidator]],
      ubicacionEstudio: ['', Validators.required],
      coordenadas: this.formBuilder.array(
        [],
        [Validators.required, this.coordenadasValidator]
      ),
      tiposEstudio: this.formBuilder.array(
        [],
        [this.minSelectedCheckboxesOrEnum(1)]
      ),
      areasEstudio: this.formBuilder.array(
        [],
        [this.minSelectedCheckboxesOrEnum(1)]
      ),
      imagenes: this.formBuilder.array([]),
      archivosAdjuntos: this.formBuilder.array([]),
    });
  }

  /**
   * Obtiene las opciones de tipos de estudio geofísico y las mapea a un arreglo de objetos con valor y etiqueta.
   */
  private getEstudioTipoOptions(): void {
    this.estudioGeofisicoService.getTipoEstudioOptions().subscribe({
      next: (enums: EnumTipoEstudioGeofisico[]) => {
        this.tipoEstudioOptions = enums.map(
          (enumValue: EnumTipoEstudioGeofisico) => {
            return {
              value: enumValue,
              label:
                this.estudioGeofisicoService.getLabelForEnumTipo(enumValue),
            };
          }
        );
      },
      error: () => this.flagHandlerError(),
    });
  }

  /**
   * Obtiene las opciones de áreas de aplicación de estudio geofísico y las mapea a un arreglo de objetos con valor y etiqueta.
   */
  private getAreaEstudioOptions(): void {
    this.estudioGeofisicoService.getAreaEstudioOptions().subscribe({
      next: (enums: EnumAreaAplicacionEstudioGeofisico[]) => {
        this.areaEstudioOptions = enums.map(
          (enumValue: EnumAreaAplicacionEstudioGeofisico) => {
            return {
              value: enumValue,
              label:
                this.estudioGeofisicoService.getLabelForEnumArea(enumValue),
            };
          }
        );
      },
      error: () => this.flagHandlerError(),
    });
  }

  /**
   * Carga un estudio geofísico si se proporciona un id en los parámetros de ruta.
   */
  private loadEstudioIfIdProvided(): void {
    this.activatedRoute.params.subscribe((params) => {
      if (params['id']) {
        const regex = /^\d+$/; // Expresión regular para verificar que el id contenga solo números
        if (regex.test(params['id'])) {
          this.idEstudioToEdit = +params['id'];
          if (this.idEstudioToEdit) {
            this.parameterExists = true;
            this.loadEstudio();
          }
        } else {
          console.error(
            'Error al cargar el estudio geofísico: El id es inválido'
          );
          this.flagHandlerError();
          throw new Error('El estudio geofísico no existe');
        }
      }
    });
  }

  /**
   * Método para crear un nuevo estudio geofísico.
   */
  postForm(): void {
    // Valida el formulario principal
    if (this.validarFormulario()) {
      // Resetea los errores
      this.erroresArray = [];

      console.log(this.form.value);

      // Indica que se está subiendo el estudio
      this.isUploadingEstudioToCloud = true;

      // Envía el formulario al servicio para crear el estudio
      this.estudioGeofisicoService
        .postEstudioGeofisico(this.form.value)
        .subscribe({
          next: (data) => {
            console.info('Estudio creado exitosamente:', data);
          },
          error: () => {
            // Maneja el error de la creación del estudio
            this.flagHandlerError();
          },
          complete: () => {
            // Muestra una alerta de éxito
            Swal.fire({
              position: 'top-end',
              icon: 'success',
              title: 'Estudio creado con éxito!',
              showConfirmButton: false,
              timer: 1000,
            });

            // Indica que se dejó de subir el estudio
            this.isUploadingEstudioToCloud = false;

            // Navega al listado de estudios
            this.router.navigateByUrl('/estudios');
          },
        });
    } else {
      // Marca todos los controles del formulario como tocados para mostrar mensajes de validación
      this.form.markAllAsTouched();
      // Muestra una alerta
      Swal.fire({
        position: 'top',
        icon: 'warning',
        title: 'Revise los campos!',
        showConfirmButton: false,
        timer: 1000,
      });
    }
  }

  /**
   * Método para editar un estudio geofísico existente.
   */
  putForm(): void {
    // Valida el formulario principal
    if (this.validarFormulario()) {
      // Resetea los errores
      this.erroresArray = [];

      // Indica que se está subiendo el estudio
      this.isUploadingEstudioToCloud = true;

      // Prepara los valores del formulario para enviarlos al servicio
      const formValues = this.prepararFormularioParaEnvio();

      // Envía los datos actualizados al servicio para editar el estudio
      this.estudioGeofisicoService
        .putEstudioGeofisico(formValues, this.idEstudioToEdit)
        .subscribe({
          next: (data) => {
            console.info('Estudio editado exitosamente:', data);
          },
          error: () => {
            // Maneja el error de la edición del estudio
            this.flagHandlerError();
          },
          complete: () => {
            // Muestra una alerta de éxito
            Swal.fire({
              position: 'top',
              icon: 'success',
              title: 'Estudio editado con éxito!',
              showConfirmButton: false,
              timer: 1000,
            });

            // Indica que se dejó de subir el estudio
            this.isUploadingEstudioToCloud = false;

            // Navega a la página de detalles del estudio editado
            this.router.navigateByUrl(
              `/estudios/details/${this.idEstudioToEdit}`
            );
          },
        });
    } else {
      // Marca todos los controles del formulario como tocados para mostrar mensajes de validación
      this.form.markAllAsTouched();

      // Muestra una alerta
      Swal.fire({
        position: 'top',
        icon: 'warning',
        title: 'Revise los campos!',
        showConfirmButton: false,
        timer: 1000,
      });
    }
  }

  /**
   * Método para cargar un estudio geofísico existente en el formulario.
   */
  loadEstudio(): void {
    // Indica que se está cargando el estudio
    this.isUploadingEstudioToEdit = true;

    // Obtiene el estudio desde el servicio
    this.estudioGeofisicoService.getEstudio(this.idEstudioToEdit).subscribe({
      next: (estudio) => {
        // Desestructura el estudio para obtener las propiedades individuales
        const {
          coordenadas,
          imagenes,
          archivosAdjuntos,
          tiposEstudio,
          areasEstudio,
          ...restoEstudio
        } = estudio;

        // Asignar los valores del estudio al formulario principal
        this.form.patchValue({
          ...restoEstudio,
          tiposEstudio: [],
          areasEstudio: [],
          coordenadas: [],
          imagenes: [],
          archivosAdjuntos: [],
        });

        // Asegurar de que tiposEstudio y areasEstudio no sean null
        const tiposEstudioSeguros = tiposEstudio ?? [];
        const areasEstudioSeguras = areasEstudio ?? [];

        // Convierte los arreglos a Set
        const tiposEstudioSet = new Set(tiposEstudioSeguros);
        const areasEstudioSet = new Set(areasEstudioSeguras);

        // Agrega los valores de tipos de estudios al FormArray correspondiente
        this.agregarItemsAlFormArray(
          this.tiposEstudioFormArray,
          tiposEstudioSet,
          []
        );

        // Agrega los valores de areas de estudios al FormArray correspondiente
        this.agregarItemsAlFormArray(
          this.areasEstudioFormArray,
          areasEstudioSet,
          []
        );

        // Agrega los valores de coordenadas al FormArray correspondiente
        this.agregarItemsAlFormArray(this.coordenadasFormArray, coordenadas!, [
          'latitudDecimal',
          'longitudDecimal',
        ]);

        // Agrega los valores de imágenes al FormArray correspondiente
        this.agregarItemsAlFormArray(this.imagenesFormArray, imagenes!, [
          'imagenKey',
          'imagenUrl',
          'imagenFileName',
          'imagenSize',
        ]);

        // Agrega los valores de archivos adjuntos al FormArray correspondiente
        this.agregarItemsAlFormArray(
          this.archivosAdjuntosFormArray,
          archivosAdjuntos!,
          ['archivoKey', 'archivoUrl', 'archivoFileName', 'archivoSize']
        );
      },
      error: () => {
        // Maneja el error al cargar el estudio
        this.flagHandlerError();
      },
      complete: () => {
        // Establece la bandera de carga completa
        this.uploadEstudioToEditFinish = true;

        // Indica que ya no se está cargando el estudio
        this.isUploadingEstudioToEdit = false;
      },
    });
  }

  /**
   * Función de validación para el campo 'fechaRealizado' del formulario.
   * Verifica que la fecha ingresada no sea mayor a la fecha actual.
   *
   * @param control - Control del formulario a validar.
   * @returns Objeto de errores de validación si la fecha es inválida, o null si es válida.
   */
  private fechaRealizadoValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const fechaIngresada = control.value as Date;
    const fechaIngresadaDate = new Date(fechaIngresada);
    const fechaActual = new Date();

    if (fechaIngresadaDate > fechaActual) {
      // Verificar si la fecha es en el futuro
      return { fechaInvalida: true };
    }

    return null;
  }

  /**
   * Función de validación para el campo 'coordenadas' del formulario.
   * Verifica que cada coordenada se encuentre dentro de los límites geográficos válidos.
   *
   * @param control - Control del formulario a validar.
   * @returns Objeto de errores de validación si las coordenadas son inválidas, o null si son válidas.
   */
  private coordenadasValidator(
    control: AbstractControl
  ): ValidationErrors | null {
    const coordenadasArray = control as FormArray;

    for (let i = 0; i < coordenadasArray.length; i++) {
      const coordenadaGroup = coordenadasArray.at(i);
      const latitud = coordenadaGroup.get('latitudDecimal')?.value;
      const longitud = coordenadaGroup.get('longitudDecimal')?.value;

      // Validar que las coordenadas se encuentren dentro de los límites geográficos válidos
      if (
        latitud < MIN_VALUE_LATITUDE ||
        latitud > MAX_VALUE_LATITUDE ||
        longitud < MIN_VALUE_LONGITUDE ||
        longitud > MAX_VALUE_LONGITUDE
      ) {
        return { coordenadasInvalidas: true };
      }
    }
    return null;
  }

  /**
   * Método para indicar que no hay operaciones en curso en el componente de imágenes.
   *
   * @param statusImagenes - Indica si el componente de imágenes está listo (true) o no (false).
   */
  changeStatusImagenes(statusImagenes: boolean): void {
    this.readyImagenes = statusImagenes;
  }

  /**
   * Método para indicar que no hay operaciones en curso en el componente de archivos.
   *
   * @param statusArchivos - Indica si el componente de archivos está listo (true) o no (false).
   */
  changeStatusArchivos(statusArchivos: boolean): void {
    this.readyArchivos = statusArchivos;
  }

  /**
   * Método para validar el formulario principal y agregar los mensajes de error de los componentes hijos.
   *
   * @returns `true` si el formulario es válido, `false` si el formulario es inválido.
   */
  validarFormulario(): boolean {
    // Verifica si el formulario principal es válido
    if (!this.form.valid) {
      // Agrega el mensaje de error del FormArray de coordenadas
      this.erroresMap.set(
        'coordenadas',
        this.obtenerMensajeError(
          'coordenadas',
          'Una coordenada debe existir al menos y máximo 6. La latitud debe estar entre -90 y 90. La longitud debe estar entre -180 y 180'
        )
      );

      // Agrega el mensaje de error del FormArray de imágenes si aún no están listas
      if (!this.readyImagenes) {
        this.erroresMap.set(
          'imagenes',
          'Subir las imágenes o esperar que terminen el proceso.'
        );
      } else {
        this.erroresMap.delete('imagenes');
      }

      // Agrega el mensaje de error del FormArray de archivos adjuntos si aún no están listos
      if (!this.readyArchivos) {
        this.erroresMap.set(
          'archivos',
          'Esperar que termine el proceso de archivos adjuntos'
        );
      } else {
        this.erroresMap.delete('archivos');
      }

      // Convierte el Map de errores en un array
      this.erroresArray = Array.from(this.erroresMap, ([key, value]) => ({
        key,
        value,
      }));

      // Retorna `false` indicando que el formulario es inválido
      return false;
    }

    // Retorna `true` indicando que el formulario es válido
    return true;
  }

  /**
   * Genera una función de validación que verifica que se haya seleccionado al menos un elemento en
   * un FormArray de checkboxes o enumeraciones.
   *
   * @param min - Número mínimo de elementos que deben estar seleccionados. Por defecto es 1.
   * @returns Una función de validación que puede ser utilizada en un FormArray.
   */
  minSelectedCheckboxesOrEnum(min = 1): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control as FormArray;

      // Obtiene el valor de cada control en el FormArray
      const totalSelected = formArray.controls
        .map((control) => control.value)
        // Filtra solo los valores que son `true` o de tipo `string` (Enum)
        .reduce(
          (prev, next) =>
            next === true || typeof next === 'string' ? prev + 1 : prev,
          0
        );

      // Si el total de elementos seleccionados es menor al mínimo requerido, retorna el error
      return totalSelected >= min ? null : { required: true };
    };
  }

  /**
   * Función para obtener el mensaje de error de un control del formulario.
   *
   * @param controlName - El nombre del control del formulario.
   * @param errorMessage - El mensaje de error que se debe mostrar.
   * @returns El mensaje de error si el control es inválido, o `null` si el control es válido.
   */
  private obtenerMensajeError(
    controlName: string,
    errorMessage: string
  ): string | null {
    const control = this.form.get(controlName);

    // Verifica si el control tiene errores y devuelve el mensaje de error correspondiente
    return control?.errors ? errorMessage : null;
  }

  /**
   * Agrega elementos a un FormArray.
   *
   * @param formArray - El FormArray al que se agregarán los elementos.
   * @param items - Los elementos que se agregarán al FormArray. Puede ser un arreglo, un Set de EnumTipoEstudioGeofisico o un Set de EnumAreaAplicacionEstudioGeofisico.
   * @param keys - Los nombres de las propiedades de cada elemento que se agregarán al FormGroup dentro del FormArray. Si es null, se asume que es una enumeración.
   */
  private agregarItemsAlFormArray(
    formArray: FormArray,
    items:
      | any[]
      | Set<EnumTipoEstudioGeofisico>
      | Set<EnumAreaAplicacionEstudioGeofisico>,
    keys: string[] | null
  ): void {
    // Si se proporcionaron las claves, se crea un FormGroup por cada elemento
    if (keys !== null && keys.length > 0) {
      items.forEach((item) => {
        const group = this.formBuilder.group({});
        keys.forEach((key) =>
          group.addControl(key, this.formBuilder.control(item[key]))
        );
        formArray.push(group);
      });
    } else {
      // Determina si los items son de tipo EnumAreaAplicacionEstudioGeofisico
      const isEnumAreaAplicacion = [...items].every(
        this.esEnumAreaAplicacionEstudioGeofisico
      );
      // Determina si los items son de tipo EnumTipoEstudioGeofisico
      const isEnumTipoEstudio =
        !isEnumAreaAplicacion &&
        [...items].every(this.esEnumTipoEstudioGeofisico);

      // Procesa los items como EnumAreaAplicacionEstudioGeofisico
      if (isEnumAreaAplicacion) {
        this.procesarItemsComoEnumAreaAplicacion(
          formArray,
          items as Set<EnumAreaAplicacionEstudioGeofisico>
        );
      }
      // Procesa los items como EnumTipoEstudioGeofisico
      else if (isEnumTipoEstudio) {
        this.procesarItemsComoEnumTipoEstudio(
          formArray,
          items as Set<EnumTipoEstudioGeofisico>
        );
      }
    }
  }

  /**
   * Procesa los elementos de tipo EnumAreaAplicacionEstudioGeofisico y los agrega al FormArray proporcionado.
   * Cada elemento del Set se verifica contra las opciones de área de estudio y se crea un control de formulario para cada opción.
   * El valor del control será 'true' si la opción está presente en el Set, de lo contrario será 'false'.
   *
   * @param formArray - El FormArray al que se agregarán los controles de formulario.
   * @param items - El Set de elementos de tipo EnumAreaAplicacionEstudioGeofisico que se procesarán y agregarán al FormArray.
   */
  private procesarItemsComoEnumAreaAplicacion(
    formArray: FormArray,
    items: Set<EnumAreaAplicacionEstudioGeofisico>
  ): void {
    this.areaEstudioOptions.forEach((opcion) => {
      const isIncluded = items.has(opcion.value);
      const control = this.formBuilder.control(isIncluded);
      formArray.push(control);
    });
  }

  /**
   * Procesa los elementos de tipo EnumTipoEstudioGeofisico y los agrega al FormArray proporcionado.
   * Cada elemento del Set se verifica contra las opciones de tipo de estudio y se crea un control de formulario para cada opción.
   * El valor del control será 'true' si la opción está presente en el Set, de lo contrario será 'false'.
   *
   * @param formArray - El FormArray al que se agregarán los controles de formulario.
   * @param items - El Set de elementos de tipo EnumTipoEstudioGeofisico que se procesarán y agregarán al FormArray.
   */
  private procesarItemsComoEnumTipoEstudio(
    formArray: FormArray,
    items: Set<EnumTipoEstudioGeofisico>
  ): void {
    this.tipoEstudioOptions.forEach((opcion) => {
      const isIncluded = items.has(opcion.value);
      const control = this.formBuilder.control(isIncluded);
      formArray.push(control);
    });
  }

  /**
   * Verifica si el valor proporcionado es un miembro válido de la enumeración EnumAreaAplicacionEstudioGeofisico.
   *
   * @param value - El valor que se va a verificar.
   * @returns {boolean} - Retorna true si el valor es un miembro de EnumAreaAplicacionEstudioGeofisico, de lo contrario false.
   */
  private esEnumAreaAplicacionEstudioGeofisico(
    value: any
  ): value is EnumAreaAplicacionEstudioGeofisico {
    return Object.values(EnumAreaAplicacionEstudioGeofisico).includes(value);
  }

  /**
   * Determina si el valor proporcionado es un miembro de la enumeración EnumTipoEstudioGeofisico.
   *
   * @param value - El valor que se va a verificar.
   * @returns {boolean} - Retorna true si el valor es un miembro de EnumTipoEstudioGeofisico, de lo contrario retorna false.
   */
  private esEnumTipoEstudioGeofisico(
    value: any
  ): value is EnumTipoEstudioGeofisico {
    return Object.values(EnumTipoEstudioGeofisico).includes(value);
  }

  /**
   * Maneja el evento de selección/deselección de un tipos de estudios geofísico.
   *
   * @param event - El evento de cambio de selección del checkbox.
   */
  handleTipoEstudioNew(event: any): void {
    // Si el checkbox ha sido seleccionado
    if (event.target.checked) {
      // Agrega el valor seleccionado al FormArray de tipos de estudio
      this.tiposEstudioFormArray.push(
        this.formBuilder.control(event.target.value)
      );
    }
    // Si el checkbox ha sido deseleccionado
    else {
      let i = 0;
      // Recorre los controles del FormArray de tipos de estudio
      this.tiposEstudioFormArray.controls.forEach((tiposEstudio: any) => {
        // Busca el control con el valor deseleccionado y lo elimina
        if (tiposEstudio.value === event.target.value) {
          this.tiposEstudioFormArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  /**
   * Método para manejar la edición de 'tiposEstudio'.
   *
   * @param {any} event - El evento disparado por el cambio en el elemento de entrada.
   */
  handleTipoEstudioEdit(event: any) {
    let controlIndex = this.tipoEstudioOptions.findIndex(
      (opcion) => opcion.value === event.target.value
    );
    if (event.target.checked) {
      // Si la opción está seleccionada, establece el valor del control correspondiente al valor del enum
      this.tiposEstudioFormArray.at(controlIndex).setValue(event.target.value);
    } else {
      // Si la opción no está seleccionada, establece el valor del control correspondiente a false
      this.tiposEstudioFormArray.at(controlIndex).setValue(false);
    }
  }

  /**
   * Maneja el evento de selección/deselección de las áreas de aplicación de estudios geofísico.
   *
   * @param event - El evento de cambio de selección del checkbox.
   */
  handleAreaEstudioNew(event: any): void {
    // Si el checkbox ha sido seleccionado
    if (event.target.checked) {
      // Agrega el valor seleccionado al FormArray de tipos de estudio
      this.areasEstudioFormArray.push(
        this.formBuilder.control(event.target.value)
      );
    }
    // Si el checkbox ha sido deseleccionado
    else {
      let i = 0;
      // Recorre los controles del FormArray de tipos de estudio
      this.areasEstudioFormArray.controls.forEach((areasEstudios: any) => {
        // Busca el control con el valor deseleccionado y lo elimina
        if (areasEstudios.value === event.target.value) {
          this.areasEstudioFormArray.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  /**
   * Método para manejar la edición de 'areasEstudio'.
   *
   * @param {any} event - El evento disparado por el cambio en el elemento de entrada.
   */
  handleAreaEstudioEdit(event: any) {
    let controlIndex = this.areaEstudioOptions.findIndex(
      (opcion) => opcion.value === event.target.value
    );
    if (event.target.checked) {
      // Si la opción está seleccionada, establece el valor del control correspondiente al valor del enum
      this.areasEstudioFormArray.at(controlIndex).setValue(event.target.value);
    } else {
      // Si la opción no está seleccionada, establece el valor del control correspondiente a false
      this.areasEstudioFormArray.at(controlIndex).setValue(false);
    }
  }

  /**
   * Prepara los valores del formulario para ser enviados al servidor.
   *
   * @returns Los valores del formulario preparados para el envío.
   */
  prepararFormularioParaEnvio(): any {
    // Convierte los valores booleanos del FormArray de tipos de estudio a los valores correspondientes del enum
    const tiposEstudioValues = this.tiposEstudioFormArray.controls
      .map((control, index) =>
        control.value ? this.tipoEstudioOptions[index].value : null
      )
      .filter((value) => value !== null);

    // Convierte los valores booleanos del FormArray de áreas de estudio a los valores correspondientes del enum
    const areasEstudioValues = this.areasEstudioFormArray.controls
      .map((control, index) =>
        control.value ? this.areaEstudioOptions[index].value : null
      )
      .filter((value) => value !== null);

    // Crea una copia de los valores del formulario principal
    const formValues = { ...this.form.value };

    // Reemplaza los valores de 'tiposEstudio' y 'areasEstudio' con los valores calculados
    formValues.tiposEstudio = tiposEstudioValues;
    formValues.areasEstudio = areasEstudioValues;

    return formValues;
  }

  /**
   * Método para gestionar las banderas en caso de error.
   * Establece las banderas de carga y subida de estudio en `false`.
   */
  private flagHandlerError(): void {
    this.isUploadingEstudioToEdit = false;
    this.isUploadingEstudioToCloud = false;
  }

  // Obtener el FormArray de coordenadas
  get coordenadasFormArray(): FormArray {
    return this.form.get('coordenadas') as FormArray;
  }
  // Obtener el FormArray de imagenes
  get imagenesFormArray(): FormArray {
    return this.form.get('imagenes') as FormArray;
  }
  // Obtener el FormArray de imagenes
  get archivosAdjuntosFormArray(): FormArray {
    return this.form.get('archivosAdjuntos') as FormArray;
  }
  // Obtener el FormArray de tiposEstudio
  get tiposEstudioFormArray(): FormArray {
    return this.form.get('tiposEstudio') as FormArray;
  }
  // Obtener el FormArray de areasEstudios
  get areasEstudioFormArray(): FormArray {
    return this.form.get('areasEstudio') as FormArray;
  }
  // Getter para acceder al control 'nombreEstudio' del formulario
  get nombreEstudio() {
    return this.form.controls['nombreEstudio'];
  }
  // Getter para acceder al control 'nombreEstudio' del formulario
  get descripcion() {
    return this.form.controls['descripcion'];
  }
  // Getter para acceder al control 'nombreCliente' del formulario
  get nombreCliente() {
    return this.form.controls['nombreCliente'];
  }
  // Getter para acceder al control 'fechaRealizado' del formulario
  get fechaRealizado() {
    return this.form.controls['fechaRealizado'];
  }
  // Getter para acceder al control 'ubicacionEstudio' del formulario
  get ubicacionEstudio() {
    return this.form.controls['ubicacionEstudio'];
  }
}
