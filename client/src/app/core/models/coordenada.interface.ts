/**
 * Representa una coordenada geográfica con su identificador único.
 */
export interface Coordenada {
  /**
   * Identificador único de la coordenada.
   */
  id: number;

  /**
   * Latitud en formato decimal (opcional).
   */
  latitudDecimal?: number;

  /**
   * Longitud en formato decimal (opcional).
   */
  longitudDecimal?: number;
}
