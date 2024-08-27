import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { LoginService } from '../auth/login.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ErrorHttpInterceptorService implements HttpInterceptor {
  constructor(private loginService: LoginService, private router: Router) {}

  /**
   * Intercepta las solicitudes HTTP para manejar errores.
   *
   * Este interceptor captura errores de las respuestas HTTP y los maneja de acuerdo a su tipo y estado:
   * - Para errores sin estado (0), muestra un mensaje de error de conexión.
   * - Para errores 400 (Bad Request), muestra un mensaje de error al procesar la solicitud.
   * - Para errores 401 (Unauthorized), muestra el motivo del acceso denegado.
   * - Para errores 403 (Forbidden), redirige al login.
   * - Para errores 404 (Not Found), muestra un mensaje de recurso no encontrado.
   * - Para errores 413 (Payload Too Large), muestra un mensaje de que el tamaño del archivo supera el límite permitido.
   * - Para errores 500 (Internal Server Error), muestra un mensaje de error interno en el servidor.
   * - Para errores 502 (Bad Gateway), muestra un mensaje de error en el usuario o contraseña.
   * - Para otros códigos de estado HTTP, muestra un mensaje de error desconocido.
   *
   * También maneja errores de tipo ProgressEvent, mostrando un mensaje de error en la carga.
   *
   * Después de manejar el error, lo propaga para que pueda ser manejado por otros interceptores o suscriptores.
   *
   * @param {HttpRequest<any>} req - La solicitud HTTP que se intercepta.
   * @param {HttpHandler} next - El siguiente manejador en la cadena de interceptores.
   * @returns {Observable<HttpEvent<any>>} - Un observable que emite eventos HTTP.
   */
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: any) => {
        if (error instanceof HttpErrorResponse) {
          switch (error.status) {
            case 0:
              console.error('Se ha producido un error: ', error);
              Swal.fire(
                'Error',
                'Error de conexión, intentelo nuevamente más tarde',
                'error'
              );
              break;
            case 400:
              console.error(
                `Código de error ${error.status}: ${error.error.title} (Instance: ${error.error.instance}) (ERROR: ${error.error.detail})`
              );
              Swal.fire(
                'Error',
                'Ocurrió un error al procesar tu solicitud',
                'error'
              );
              break;
            case 401:
              console.error(
                `Código de error ${error.status}: ${error.error.access_denied_reason} (Instance: ${error.error.instance}) (ERROR: ${error.error.detail})`
              );
              this.loginService.logout();
              this.router.navigateByUrl('/login');
              break;
            case 403:
              console.error(
                `Código de error ${error.status}: ${error.error.access_denied_reason} (Instance: ${error.error.instance}) (ERROR: ${error.error.detail})`
              );
              this.loginService.logout();
              this.router.navigateByUrl('/login');
              break;
            case 404:
              // Error 404: Archivo no encontrado
              console.error(
                `Código de error ${error.status}: ${error.error.title} (Instance: ${error.error.instance}) (ERROR: ${error.error.detail})`
              );
              Swal.fire('Error', 'Recurso no encontrado', 'error');
              break;
            case 413:
              // Error 413: Payload too large
              console.error(
                `Código de error ${error.status}: ${error.message} (URL:${error.url}) (ERROR: ${error.error})`
              );
              Swal.fire(
                'Error',
                'El tamaño del archivo supera el límite permitido. (10MB)',
                'error'
              );
              break;
            case 500:
              // Error 500: Error en el servidor
              console.error(
                `Código de error ${error.status}: ${error.error.title} (Instance: ${error.error.instance}) (ERROR: ${error.error.detail})`
              );
              Swal.fire(
                'Error',
                'Ocurrió un error interno en el servidor',
                'error'
              );
              break;
            case 502:
              // Error 502: Bad Gateway
              console.error(
                `Código de error ${error.status}: ${error.message} (URL:${error.url}) (ERROR: ${error.error})`
              );
              Swal.fire('Error', 'Error en el usuario o contraseña.', 'error');
              break;
            default:
              // Manejar otros códigos de estado HTTP
              console.error(
                `Código de error ${error.status}: ${error.message} (URL:${error.url}) (ERROR: ${error.error})`
              );
          }
        } else if (error instanceof ProgressEvent) {
          // Manejar errores de ProgressEvent
          console.error('Error de ProgressEvent: ', error);
          Swal.fire('Error', 'Se ha producido un error en la carga', 'error');
        } else {
          // Manejar otros tipos de errores
          console.error(`Error desconocido: ${error}`);
        }
        // Propagar el error para que pueda ser manejado por otros interceptores o suscriptores
        return throwError(() => error);
      })
    );
  }
}
