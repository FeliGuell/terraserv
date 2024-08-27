import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginService } from './login.service';

@Injectable({
  providedIn: 'root',
})
export class JwtInterceptorService implements HttpInterceptor {
  constructor(private loginService: LoginService) {}

  /**
   * Intercepta las solicitudes HTTP y agrega el token JWT en el encabezado de autorización.
   *
   * Este interceptor realiza las siguientes acciones:
   * - Obtiene el token de usuario del servicio de inicio de sesión.
   * - Si hay un token presente, clona la solicitud original y agrega el encabezado de autorización con el token.
   * - Luego, pasa la solicitud (original o modificada) al siguiente manejador en la cadena de interceptores.
   *
   * @param {HttpRequest<any>} req - La solicitud HTTP que se intercepta.
   * @param {HttpHandler} next - El siguiente manejador en la cadena de interceptores.
   * @returns {Observable<HttpEvent<any>>} - Un observable que emite eventos HTTP.
   */
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.loginService.userToken; // Obtener el token de usuario del servicio de inicio de sesión

    if (token) {
      // Verificar si hay un token presente
      // Clonar la solicitud original y agregar encabezados de autorización
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` },
      });
    }

    // Pasar la solicitud (original o modificada) al siguiente manejador
    return next.handle(req);
  }
}
