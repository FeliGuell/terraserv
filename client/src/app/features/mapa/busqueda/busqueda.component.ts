import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { EstudioGeofisicoService } from 'src/app/core/services/estudio-geofisico.service';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidationErrors,
} from '@angular/forms';
import { EnumTipoEstudioGeofisico } from 'src/app/core/models/enums/tipo-estudio.enum';
import { EnumAreaAplicacionEstudioGeofisico } from 'src/app/core/models/enums/area-estudio.enum';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-busqueda',
  templateUrl: './busqueda.component.html',
  styleUrls: ['./busqueda.component.css'],
})
export class BusquedaComponent implements OnInit {
  // Evento emitido cuando se envía el formulario de búsqueda
  @Output() formSubmitted = new EventEmitter<any>();
  // Propiedad para almacenar el contexto de la búsqueda
  contexto: string;

  // Enums
  tipoEstudioOptions: { value: EnumTipoEstudioGeofisico; label: string }[] = [];
  areaEstudioOptions: {
    value: EnumAreaAplicacionEstudioGeofisico;
    label: string;
  }[] = [];

  form = this.formBuilder.group(
    {
      consultaMultiple: '', // Campo para consulta múltiple
      fechaInicio: '', // Campo para fecha de inicio
      fechaFin: '', // Campo para fecha de fin
      tipoEstudio: '', // Campo para tipo de estudio
      areaEstudio: '', // Campo para área de estudio
    },
    {
      validators: [this.atLeastOneFieldValidator, this.dateRangeValidator], // Validadores personalizados
    }
  );

  constructor(
    private estudioService: EstudioGeofisicoService,
    private formBuilder: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.contexto = this.route.snapshot.data['contexto'];
  }

  /**
   * Inicializa el componente al cargar.
   */
  ngOnInit(): void {
    // Obtiene las opciones de tipos de estudio
    this.getEstudioTipoOptions();

    // Obtiene las opciones de áreas de aplicación
    this.getAreaEstudioOptions();
  }

  /**
   * Envía el formulario.
   */
  postForm(): void {
    if (this.form.valid) {
      const formValues = this.form.value; // Obtener los valores del formulario

      // Asignar undefined a los campos vacíos
      Object.keys(formValues).forEach((key) => {
        // Asegurar que key es una clave válida de formValues
        const formKey = key as keyof typeof formValues;
        if (formValues[formKey] === '' || formValues[formKey] === null) {
          formValues[formKey] = undefined;
        }
      });

      // Actualizar el formulario con los nuevos valores
      this.form.patchValue(formValues);

      // Cuando se utiliza para el componente MapaComponent
      if (this.contexto === 'mapa') {
        // Filtrar los estudios con los valores del formulario
        this.estudioService.filterEstudios(this.form.value);
        // Dispara el evento de búsqueda realizada.
        this.estudioService.realizarBusqueda();
      }

      // Cuando se utiliza para el componente EstudioRegisterComponent
      if (this.contexto === 'registro') {
        // Emitir el formulario a través del EventEmitter
        this.formSubmitted.emit(this.form.value);
        // Dispara el evento de búsqueda realizada.
        this.estudioService.realizarBusqueda();
      }
    }
  }

  /**
   * Limpia los marcadores del mapa y restablece los valores del formulario.
   */
  clear(): void {
    // Obtener los controles del formulario
    const formControls = this.form.controls;

    // Recorrer los controles y asignarles null si tienen valor
    Object.keys(formControls).forEach((key) => {
      const formKey = key as keyof typeof formControls;
      const control = formControls[formKey];
      if (control.value) {
        if (control instanceof FormArray) {
          control.setValue([]); // Asignar un arreglo vacío si el control es un FormArray
        } else {
          control.setValue(null);
        }
      }
    });

    // Dispara el evento para resetear el valor del booleano a false de búsqueda realizada.
    this.estudioService.resetearBusquedaRealizada();

    // Limpiar los estudios geofísicos
    this.estudioService.clearEstudiosGeofisicos();
  }

  /**
   * Validador personalizado que verifica si al menos uno de los campos del formulario tiene un valor.
   * @param control - El control del formulario.
   * @returns {ValidationErrors | null} - Null si al menos un campo tiene un valor, de lo contrario, un objeto con la clave "required".
   */
  atLeastOneFieldValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;

    // Verifica si al menos uno de los campos del formulario tiene un valor
    const isAtLeastOneFieldProvided = Object.keys(group.controls).some(
      (key) => {
        const value = group.get(key)?.value;
        return value !== null && value !== undefined && value !== '';
      }
    );

    // Si al menos un campo tiene un valor, la validación pasa (devuelve null)
    return isAtLeastOneFieldProvided ? null : { required: true };
  }

  /**
   * Valida que el rango de fechas sea correcto y que las fechas no sean futuras.
   *
   * Este validador personalizado se asegura de que:
   * - Si una fecha de inicio o fin está presente, la otra también debe estarlo.
   * - Ninguna de las fechas puede ser futura.
   * - La fecha de inicio debe ser diferente a la fecha de fin.
   *
   * @param {AbstractControl} control El grupo de controles que contiene las fechas a validar.
   * @returns {ValidationErrors | null} Un objeto con los errores de validación o null si no hay errores.
   */
  dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    let fechaInicio = group.get('fechaInicio')?.value
      ? new Date(group.get('fechaInicio')?.value)
      : null;

    let fechaFin = group.get('fechaFin')?.value
      ? new Date(group.get('fechaFin')?.value)
      : null;

    let now = new Date();

    // Verifica que ambas fechas tengan un valor válido o que ambas estén vacías
    if ((fechaInicio && !fechaFin) || (!fechaInicio && fechaFin)) {
      return { dateRange: true };
    }

    // Verifica que las fechas no sean futuras
    if ((fechaInicio && fechaInicio > now) || (fechaFin && fechaFin > now)) {
      return { futureDate: true };
    }

    // Verifica que las fechas formen un rango válido (es decir, que no sean iguales)
    if (
      fechaInicio &&
      fechaFin &&
      fechaInicio.getTime() === fechaFin.getTime()
    ) {
      return { sameDate: true };
    }

    return null;
  }

  /**
   * Obtiene las opciones de tipos de estudio geofísico y las mapea a un arreglo de objetos con valor y etiqueta.
   */
  private getEstudioTipoOptions(): void {
    this.estudioService.getTipoEstudioOptions().subscribe({
      next: (enums: EnumTipoEstudioGeofisico[]) => {
        this.tipoEstudioOptions = enums.map(
          (enumValue: EnumTipoEstudioGeofisico) => {
            return {
              value: enumValue,
              label: this.estudioService.getLabelForEnumTipo(enumValue),
            };
          }
        );
      },
      error: () =>
        console.log('Error al cargar los tipos de estudio geofísico'),
    });
  }

  /**
   * Obtiene las opciones de áreas de aplicación de estudio geofísico y las mapea a un arreglo de objetos con valor y etiqueta.
   */
  private getAreaEstudioOptions(): void {
    this.estudioService.getAreaEstudioOptions().subscribe({
      next: (enums: EnumAreaAplicacionEstudioGeofisico[]) => {
        this.areaEstudioOptions = enums.map(
          (enumValue: EnumAreaAplicacionEstudioGeofisico) => {
            return {
              value: enumValue,
              label: this.estudioService.getLabelForEnumArea(enumValue),
            };
          }
        );
      },
      error: () =>
        console.log('Error al cargar las áreas de estudio geofísico'),
    });
  }
}
