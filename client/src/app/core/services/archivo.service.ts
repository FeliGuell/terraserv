import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ArchivoAdjunto } from '../models/archivo-adjunto.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ArchivoService {
  // URL base de la API
  private urlEndPoint: string = `${environment.URL_API}archivos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene un archivo específico de la API utilizando su clave.
   *
   * @param {string} key - La clave del archivo a obtener.
   * @returns {Observable<ArchivoAdjunto>} - Observable que emite el archivo obtenido.
   */
  getArchivoByKey(key: string): Observable<ArchivoAdjunto> {
    return this.http.get<ArchivoAdjunto>(`${this.urlEndPoint}/key=${key}`);
  }

  /**
   * Obtiene varios archivos de la API utilizando sus claves.
   *
   * @param {string[]} keys - Las claves de los archivos a obtener.
   * @returns {Observable<ArchivoAdjunto[]>} - Observable que emite los archivos obtenidos.
   */
  getArchivosByKeys(keys: string[]): Observable<ArchivoAdjunto[]> {
    return this.http.post<ArchivoAdjunto[]>(`${this.urlEndPoint}/get`, keys);
  }
}
