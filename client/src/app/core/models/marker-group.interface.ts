import { FormGroup } from "@angular/forms";

/**
 * Representa un grupo de marcadores asociados con un formulario.
 */
export interface MarkerGroup {
  /**
   * Marcador asociado al grupo.
   */
  marker: L.Marker;

  /**
   * Grupo de formulario asociado al marcador.
   */
  group: FormGroup;
}