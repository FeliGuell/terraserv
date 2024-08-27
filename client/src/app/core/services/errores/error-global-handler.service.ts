import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root',
})
export class ErrorGlobalHandlerService implements ErrorHandler {
  /**
   * Maneja los errores producidos durante las operaciones de la aplicación.
   *
   * Este método realiza las siguientes acciones:
   * - Verifica si el error es una instancia de HttpErrorResponse o ProgressEvent.
   * - Si no lo es, registra el nombre y el mensaje del error en la consola.
   * - Muestra una alerta con el nombre y el mensaje del error utilizando Swal.fire.
   *
   * @param {any} error - El error a manejar.
   */
  handleError(error: any): void {
    if (
      !(error instanceof HttpErrorResponse) &&
      !(error instanceof ProgressEvent)
    ) {
      // Registra el nombre y el mensaje del error en la consola
      console.error(`${error.name}: ${error.message}`);

      // Muestra una alerta con el nombre y el mensaje del error
      Swal.fire({
        icon: 'error',
        title: `${error.name}`,
        text: `${error.message}`,
      });
    }
  }
}
