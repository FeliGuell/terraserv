/**
 * Representa una respuesta paginada que contiene contenido genérico.
 * @template T Tipo de contenido contenido en la respuesta paginada.
 */
export interface PaginatedResponse<T> {
  /**
   * Contenido de la página actual.
   */
  content: T[];

  /**
   * Número total de páginas.
   */
  totalPages: number;

  /**
   * Número de la página actual.
   */
  number: number;

  /**
   * Número total de elementos
   */
  totalElements: number;
}
