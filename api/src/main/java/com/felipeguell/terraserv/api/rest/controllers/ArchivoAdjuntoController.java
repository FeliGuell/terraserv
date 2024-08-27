package com.felipeguell.terraserv.api.rest.controllers;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.ArchivoNotFoundException;
import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.BadRequestException;
import com.felipeguell.terraserv.api.rest.amazon.S3Service;
import com.felipeguell.terraserv.api.rest.models.entity.ArchivoAdjunto;
import com.felipeguell.terraserv.api.rest.services.IArchivoAdjuntoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/archivos")
public class ArchivoAdjuntoController {

	private final IArchivoAdjuntoService archivoAdjuntoService;
	private final S3Service s3Service;

	/**
	 * Controlador para manejar solicitudes GET y obtener un archivo adjunto por su clave única.
	 *
	 * @param key La clave única del archivo adjunto.
	 * @return ResponseEntity con el archivo adjunto y el código de estado HTTP.
	 * @throws BadRequestException si la clave proporcionada es nula o vacía.
	 * @throws ArchivoNotFoundException si no se encuentra el archivo adjunto con la clave proporcionada.
	 */
	@GetMapping(value = "/get", params = "key")
	public ResponseEntity<ArchivoAdjunto> getArchivoByKey(@RequestParam String key) {
		// Verifica si la clave proporcionada es nula o vacía.
		if (StringUtils.isEmpty(key)) {
			throw new BadRequestException("La clave del archivo proporcionada está vacía");
		}

		// Busca el archivo adjunto por su clave utilizando el servicio de archivoAdjuntoService.
		Optional<ArchivoAdjunto> archivoAdjuntoOptional = archivoAdjuntoService.findByArchivoKey(key);

		// Si el archivo adjunto no se encuentra, lanza una excepción.
		if (!archivoAdjuntoOptional.isPresent()) {
			throw new ArchivoNotFoundException("No se encontró el archivo con la clave proporcionada");
		}

		// Obtiene el archivo adjunto del Optional.
		ArchivoAdjunto archivoAdjunto = archivoAdjuntoOptional.get();

		// Actualiza la URL del archivo adjunto utilizando el servicio S3Service.
		archivoAdjunto.setArchivoUrl(s3Service.getObjectUrl(key));

		// Devuelve una respuesta HTTP con el archivo adjunto y el código de estado OK (200).
		return ResponseEntity.ok(archivoAdjunto);
	}


	/**
	 * Controlador que maneja solicitudes POST para obtener varios archivos adjuntos por sus claves únicas.
	 *
	 * @param keys Las claves únicas de los archivos adjuntos.
	 * @return ResponseEntity con la lista de archivos adjuntos y el código de estado HTTP.
	 * @throws BadRequestException si la lista de claves proporcionada es nula o vacía.
	 * @throws ArchivoNotFoundException si no se encuentran archivos adjuntos para las claves proporcionadas.
	 */
	@PostMapping("/get")
	public ResponseEntity<List<ArchivoAdjunto>> getArchivosByKeys(@RequestBody List<String> keys) {
		// Verifica si la lista de claves proporcionada es nula o vacía.
		if (CollectionUtils.isEmpty(keys)) {
			throw new BadRequestException("La lista de claves de archivos proporcionada está vacía");
		}

		// Busca los archivos adjuntos por sus claves utilizando el servicio archivoAdjuntoService.
		List<ArchivoAdjunto> archivos = archivoAdjuntoService.findByArchivoKeyIn(keys);

		// Si no se encuentran archivos adjuntos para las claves proporcionadas, lanza una excepción.
		if (CollectionUtils.isEmpty(archivos)) {
			throw new ArchivoNotFoundException("No se encontraron archivos para las claves proporcionadas");
		}

		// Actualiza las URLs de los archivos adjuntos.
		updateUrls(archivos);

		// Devuelve una respuesta HTTP con la lista de archivos adjuntos y el código de estado OK (200).
		return ResponseEntity.ok(archivos);
	}

	/**
	 * Método privado para actualizar las URLs de los archivos adjuntos.
	 *
	 * @param archivos La lista de archivos adjuntos.
	 */
	private void updateUrls(List<ArchivoAdjunto> archivos) {
		archivos.forEach(archivo -> {
			// Obtener la URL del archivo subido a Amazon S3 y almacenarla en el objeto ArchivoAdjunto.
			archivo.setArchivoUrl(s3Service.getObjectUrl(archivo.getArchivoKey()));
		});
	}

	
}
