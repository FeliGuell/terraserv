import { Injectable } from '@angular/core';
import { LoginRequest } from './loginRequest';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({
  providedIn: 'root',
})
export class LoginService {
  // BehaviorSubject para el estado de inicio de sesión actual
  currentUserLoginOn = new BehaviorSubject<boolean>(this.checkLoginStatus());
  // BehaviorSubject para los datos del usuario actual
  private currentUserData = new BehaviorSubject<string>(
    this.getTokenFromStorage() || ''
  );

  constructor(private http: HttpClient, private jwtHelper: JwtHelperService) {}

  /**
   * Este método se utiliza para autenticar a un usuario.
   * Realiza una solicitud HTTP POST al servidor con las credenciales del usuario.
   * Si la autenticación es exitosa, almacena el token del usuario en localStorage y actualiza los BehaviorSubjects.
   *
   * @param {LoginRequest} credentials - Las credenciales del usuario para iniciar sesión.
   * @returns {Observable<string>} - Un Observable que emite el token del usuario.
   */
  login(credentials: LoginRequest): Observable<string> {
    return this.http
      .post<any>(`${environment.URL_HOST}auth/login`, credentials)
      .pipe(
        tap((userData) => {
          this.storeToken(userData?.token);
          this.currentUserLoginOn.next(true);
          this.currentUserData.next(userData?.token);
        }),
        map((userData) => userData?.token || '')
      );
  }

  /**
   * Este método se utiliza para cerrar la sesión del usuario.
   * Elimina el token del usuario de localStorage y actualiza los BehaviorSubjects.
   */
  logout(): void {
    localStorage.removeItem('token');
    this.currentUserLoginOn.next(false);
    this.currentUserData.next('');
  }

  /**
   * Este método se utiliza para obtener un Observable del token del usuario.
   * @returns {Observable<string>} - Un Observable que emite el token del usuario.
   */
  get userData(): Observable<string> {
    return this.currentUserData.asObservable();
  }

  /**
   * Este método se utiliza para obtener un Observable del estado de inicio de sesión del usuario.
   * @returns {Observable<boolean>} - Un Observable que emite el estado de inicio de sesión del usuario.
   */
  get userLoginOn(): Observable<boolean> {
    return this.currentUserLoginOn.asObservable();
  }

  /**
   * Este método se utiliza para obtener el rol del usuario desde el token JWT.
   * @returns {string | null} - El rol del usuario o null si no está presente.
   */
  getRoleFromToken(): string | null {
    const token = this.getTokenFromStorage();
    if (!token) {
      return null;
    }
    // Decodifica el token JWT y obtiene el rol del usuario.
    const decodedToken = this.jwtHelper.decodeToken(token);
    return decodedToken.role;
  }

  /**
   * Este método se utiliza para obtener el token del usuario actual.
   * @returns {string} - El token del usuario actual.
   */
  get userToken(): string {
    return this.currentUserData.value;
  }

  /**
   * Este método se utiliza para verificar el estado de inicio de sesión del usuario.
   * Comprueba si el token del usuario está presente en localStorage.
   * @returns {boolean} - Verdadero si el usuario está conectado, falso en caso contrario.
   */
  public checkLoginStatus(): boolean {
    return localStorage.getItem('token') != null;
  }

  /**
   * Este método se utiliza para obtener el token del usuario desde localStorage.
   * @returns {string | null} - El token del usuario o null si no está presente.
   */
  private getTokenFromStorage(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Este método se utiliza para almacenar el token del usuario en localStorage y actualizar los BehaviorSubjects.
   * @param {string | undefined} token - El token del usuario.
   */
  private storeToken(token: string | undefined): void {
    if (token) {
      localStorage.setItem('token', token);
    }
  }
}
