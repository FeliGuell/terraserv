import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AssetResponse } from '../models/asset-response';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AssetService {
  // URL base de la API
  private urlEndPoint: string = `${environment.URL_API}assets`;

  constructor(private http: HttpClient) {}

  /**
   * Sube un archivo a la API.
   *
   * @param {FormData} formData - Los datos del archivo a subir.
   * @returns {Observable<HttpEvent<AssetResponse>>} - Observable que emite el progreso y la respuesta de la subida.
   */
  upload(formData: FormData): Observable<HttpEvent<AssetResponse>> {
    return this.http.post<AssetResponse>(
      `${this.urlEndPoint}/upload`,
      formData,
      {
        reportProgress: true,
        observe: 'events',
      }
    );
  }

  /**
   * Obtiene las URLs de varios archivos de la API utilizando sus claves.
   *
   * @param {string[]} keys - Las claves de los archivos a obtener.
   * @returns {Observable<string[]>} - Observable que emite las URLs de los archivos.
   */
  getUrls(keys: string[]): Observable<string[]> {
    return this.http.post<string[]>(
      `${this.urlEndPoint}/get-urls`,
      JSON.stringify(keys)
    );
  }

  /**
   * Descarga un archivo de la API utilizando su nombre de archivo.
   *
   * @param {string} filename - El nombre del archivo a descargar.
   * @returns {Observable<Blob>} - Observable que emite los datos del archivo.
   */
  downloadFile(filename: string): Observable<Blob> {
    return this.http.get<Blob>(
      `${this.urlEndPoint}/get-object?key=${filename}`,
      { responseType: 'blob' as 'json' }
    );
  }

  /**
   * Descarga un archivo ZIP de la API que contiene varios archivos especificados por sus claves.
   *
   * @param {string[]} keys - Las claves de los archivos a incluir en el ZIP.
   * @returns {Observable<Blob>} - Observable que emite los datos del archivo ZIP.
   */
  downloadZip(keys: string[]): Observable<Blob> {
    const headers = { 'content-type': 'application/json' };
    return this.http.post<Blob>(
      `${this.urlEndPoint}/download-zip`,
      JSON.stringify(keys),
      {
        headers: headers,
        responseType: 'blob' as 'json',
      }
    );
  }

  /**
   * Elimina un archivo de la API utilizando su nombre de archivo.
   *
   * @param {string} filename - El nombre del archivo a eliminar.
   * @returns {Observable<string>} - Observable que emite la respuesta de la API.
   */
  delete(filename: string): Observable<string> {
    return this.http.delete<string>(
      `${this.urlEndPoint}/delete-object?key=${filename}`,
      { responseType: 'text' as 'json' }
    );
  }
}
