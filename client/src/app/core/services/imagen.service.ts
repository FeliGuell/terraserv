import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Imagen } from '../models/imagen/imagen.model';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ImagenService {
  // URL base de la API
  private urlEndPoint: string = `${environment.URL_API}imagenes`;

  constructor(private http: HttpClient) {}

  /**
   * Obtiene una imagen específica de la API utilizando su clave.
   *
   * @param {string} key - La clave de la imagen a obtener.
   * @returns {Observable<Imagen>} - Observable que emite la imagen obtenida.
   */
  getImagenByKey(key: string): Observable<Imagen> {
    return this.http.get<Imagen>(`${this.urlEndPoint}/key=${key}`);
  }

  /**
   * Obtiene varias imágenes de la API utilizando sus claves.
   *
   * @param {string[]} keys - Las claves de las imágenes a obtener.
   * @returns {Observable<Imagen[]>} - Observable que emite las imágenes obtenidas.
   */
  getImagenesByKeys(keys: string[]): Observable<Imagen[]> {
    return this.http.post<Imagen[]>(`${this.urlEndPoint}/get`, keys);
  }
}
