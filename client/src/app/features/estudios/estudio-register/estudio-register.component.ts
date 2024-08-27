import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { EstudioGeofisico } from 'src/app/core/models/estudio-geofisico.interface';
import { EstudioGeofisicoService } from 'src/app/core/services/estudio-geofisico.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-estudio-register',
  templateUrl: './estudio-register.component.html',
  styleUrls: ['./estudio-register.component.css'],
})
export class EstudioRegisterComponent implements OnInit, OnDestroy {
  /**
   * Variables
   */
  registrosForm: FormGroup; // Formulario de registros que contiene los datos del estudio geofísico.
  registros: EstudioGeofisico[]; // Lista de estudios geofísicos obtenidos del servicio.
  totalPaginas: number; // Número total de páginas disponibles en la paginación.
  paginaActual: number; // Número de la página actual en la paginación.
  pages: number[] = []; // Array de números que representa las páginas disponibles para la paginación.
  totalRegistros: number; // Número total de registros disponibles.
  estudiosGeofisicos: EstudioGeofisico[]; // Lista completa de estudios geofísicos.
  destroy$ = new Subject<void>(); // Sujeto utilizado para manejar la destrucción de suscripciones y evitar fugas de memoria.
  busquedaRealizada: boolean = false; // Indicador de si se ha realizado una búsqueda.

  constructor(
    private fb: FormBuilder,
    private estudioService: EstudioGeofisicoService
  ) {}

  /**
   * Método que se ejecuta al inicializar el componente.
   * Se encarga de configurar el formulario de registros y suscribirse a los cambios en los registros.
   */
  ngOnInit(): void {
    this.configureRegistrosForm(); // Configuración del formulario de registros
    this.cargarRegistros(); // Carga inicial de todos los estudios

    // Suscripción a los cambios en los registros obtenidos del servicio
    this.estudioService.registros$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        // Suscripción a los cambios en la bandera de búsqueda realizada
        this.estudioService.busquedaRealizada$
          .pipe(takeUntil(this.destroy$))
          .subscribe((busqueda) => {
            this.busquedaRealizada = busqueda;
          });

        // Procesamiento de los datos recibidos
        if (data && data.content.length > 0) {
          this.registros = data.content;
          this.totalRegistros = data.totalElements;
          this.totalPaginas = data.totalPages;
          this.paginaActual = data.number;
          this.pages = Array.from(
            { length: this.totalPaginas },
            (_, i) => i + 1
          );
        } else {
          // Si no se encuentran registros y se ha realizado una búsqueda, mostrar un mensaje de advertencia
          if (this.busquedaRealizada) {
            Swal.fire({
              position: 'top',
              icon: 'warning',
              title: 'No se encontraron estudios',
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
   * Carga los registros de estudio utilizando los parámetros actuales del formulario.
   */
  cargarRegistros() {
    this.estudioService.obtenerRegistrosEstudio(this.registrosForm.value);
  }

  /**
   * Establece el campo de ordenamiento y la dirección de ordenamiento en el formulario y carga los registros.
   * @param field Campo por el cual ordenar los registros.
   * @param direction Dirección de ordenamiento ('asc' para ascendente, 'desc' para descendente).
   */
  sortMethod(field: string, direction: string) {
    this.registrosForm.get('sort')!.setValue(field);
    this.registrosForm.get('direction')!.setValue(direction);
    this.cargarRegistros();
  }

  /**
   * Cambia la página de resultados en el formulario y carga los registros correspondientes a la página seleccionada.
   * @param pagina Número de la página a cargar.
   */
  cambiarPagina(pagina: number) {
    this.registrosForm.get('page')!.setValue(pagina);
    this.cargarRegistros();
  }

  /**
   * Maneja la presentación del formulario y carga los registros correspondientes según los valores proporcionados por el componente de búsqueda (`BusquedaComponent`).
   * @param formValue Valores del formulario de búsqueda proporcionados por el componente de búsqueda.
   */
  onFormSubmit(formValue: any): void {
    // Establecer la página a 0 antes de realizar la búsqueda
    this.registrosForm.patchValue({ page: 0 });
    this.registrosForm.patchValue(formValue);
    this.cargarRegistros();
  }

  /**
   * Carga todos los registros de estudio sin aplicar ningún filtro.
   */
  cargarTodosRegistros(): void {
    this.registrosForm.patchValue({
      consultaMultiple: '',
      fechaInicio: '',
      fechaFin: '',
      tipoEstudio: '',
      areaEstudio: '',
    });

    this.cargarRegistros();
  }

  /**
   * Configura el formulario de registros.
   */
  configureRegistrosForm(): void {
    this.registrosForm = this.fb.group({
      consultaMultiple: [''],
      fechaInicio: [''],
      fechaFin: [''],
      tipoEstudio: [''],
      areaEstudio: [''],
      page: [
        0,
        [Validators.required, Validators.min(0), Validators.max(10000)],
      ],
      size: [10, [Validators.required, Validators.min(1), Validators.max(50)]],
      sort: ['ultimaActualizacionPor'],
      direction: ['asc'],
    });
  }

  // Getter para acceder al control 'page' del formulario
  get page() {
    return this.registrosForm.controls['page'];
  }

  // Getter para acceder al control 'size' del formulario
  get size() {
    return this.registrosForm.controls['size'];
  }

  // Getter para acceder al control 'sort' del formulario
  get sort() {
    return this.registrosForm.controls['sort'];
  }

  // Getter para acceder al control 'direction' del formulario
  get direction() {
    return this.registrosForm.controls['direction'];
  }
}
