package com.felipeguell.terraserv.api.rest.controllers;

import java.util.List;
import java.util.Optional;

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
import com.felipeguell.terraserv.api.rest.models.entity.Imagen;
import com.felipeguell.terraserv.api.rest.services.IImagenService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/imagenes")
public class ImagenController {

	private final IImagenService imagenService;
	private final S3Service s3Service;

	/**
	 * Controlador para manejar solicitudes GET y obtener una imagen por su clave única.
	 *
	 * @param key La clave única de la imagen.
	 * @return ResponseEntity con la imagen y el código de estado HTTP.
	 * @throws BadRequestException si la clave proporcionada es nula o vacía.
	 * @throws ArchivoNotFoundException si no se encuentra la imagen con la clave proporcionada.
	 */
	@GetMapping(value = "/get", params = "key")
	public ResponseEntity<Imagen> getImagenByKey(@RequestParam String key) {
		// Verifica si la clave proporcionada es nula o vacía.
		if (StringUtils.isEmpty(key)) {
			throw new BadRequestException("La clave de la imagen proporcionada está vacía");
		}

		// Busca la imagen por su clave utilizando el servicio de imagenService.
		Optional<Imagen> imagenOptional = imagenService.findByImagenKey(key);

		// Si la imagen no se encuentra, lanza una excepción.
		if (!imagenOptional.isPresent()) {
			throw new ArchivoNotFoundException("No se encontró la imagen con la clave proporcionada");
		}

		// Obtiene la imagen del Optional.
		Imagen imagen = imagenOptional.get();

		// Actualiza la URL de la imagen utilizando el servicio S3Service.
		imagen.setImagenUrl(s3Service.getObjectUrl(key));

		// Devuelve una respuesta HTTP con la imagen y el código de estado OK (200).
		return ResponseEntity.ok(imagen);
	}

	/**
	 * Controlador para manejar solicitudes POST y obtener varias imágenes por sus claves únicas.
	 *
	 * @param keys Lista de claves únicas de las imágenes.
	 * @return ResponseEntity con la lista de imágenes y el código de estado HTTP.
	 * @throws BadRequestException si la lista de claves proporcionada es nula o vacía.
	 * @throws ArchivoNotFoundException si no se encuentran imágenes para las claves proporcionadas.
	 */
	@PostMapping("/get")
	public ResponseEntity<List<Imagen>> getImagenesByKeys(@RequestBody List<String> keys) {
		// Verifica si la lista de claves proporcionada es nula o vacía.
		if (CollectionUtils.isEmpty(keys)) {
			throw new BadRequestException("La lista de claves de imágenes proporcionada está vacía");
		}

		// Busca las imágenes por sus claves utilizando el servicio imagenService.
		List<Imagen> imagenes = imagenService.findByImagenKeyIn(keys);

		// Si no se encuentran imágenes para las claves proporcionadas, lanza una excepción.
		if (CollectionUtils.isEmpty(imagenes)) {
			throw new ArchivoNotFoundException("No se encontraron imágenes para las claves proporcionadas");
		}

		// Actualiza las URLs de las imágenes.
		updateUrls(imagenes);

		// Devuelve una respuesta HTTP con la lista de imágenes y el código de estado OK (200).
		return ResponseEntity.ok(imagenes);
	}

	/**
	 * Método privado para actualizar las URLs de las imágenes utilizando el servicio S3Service.
	 *
	 * @param imagenes Lista de imágenes a actualizar.
	 */
	private void updateUrls(List<Imagen> imagenes) {
		imagenes.forEach(imagen -> {
			// Actualiza la URL de la imagen.
			imagen.setImagenUrl(s3Service.getObjectUrl(imagen.getImagenKey()));
		});
	}
}
