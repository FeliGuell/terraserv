package com.felipeguell.terraserv.api.rest.controllers;

import java.text.ParseException;
import java.util.*;
import java.util.stream.Collectors;

import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.BadRequestException;
import com.felipeguell.terraserv.api.rest.models.entity.FiltroEstudioGeofisicoPageable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.CollectionUtils;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.EstudioNotFoundException;
import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.ValidationException;
import com.felipeguell.terraserv.api.rest.amazon.S3Service;
import com.felipeguell.terraserv.api.rest.models.dao.projections.EstudioGeofisicoProjection;
import com.felipeguell.terraserv.api.rest.models.entity.EstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.entity.FiltroEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumAreaAplicacionEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.models.enumeration.EnumTipoEstudioGeofisico;
import com.felipeguell.terraserv.api.rest.services.IEstudioGeofisicoService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;



@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/estudios")
public class EstudioGeofisicoController {
	
	private final IEstudioGeofisicoService estudioGeofisicoService;
	private final S3Service s3Service;


	/**
	 * Controlador para manejar solicitudes GET y obtener todos los estudios geofísicos creados.
	 *
	 * @return ResponseEntity con la lista de estudios geofísicos y el código de estado HTTP.
	 *         Si no existen estudios geofísicos, se retorna una respuesta HTTP con estado 204 NO CONTENT.
	 */
	@GetMapping
	public ResponseEntity<List<EstudioGeofisico>> getAllEstudios() {
		// Obtiene todos los estudios geofísicos utilizando el servicio estudioGeofisicoService.
		List<EstudioGeofisico> estudios = estudioGeofisicoService.findAll();

		// Verifica si la lista de estudios geofísicos está vacía.
		if (CollectionUtils.isEmpty(estudios)) {
			return ResponseEntity.noContent().build();
		}

		// Actualiza las URLs de los estudios geofísicos.
		updateUrls(estudios);

		// Devuelve una respuesta HTTP con la lista de estudios geofísicos y el código de estado OK (200).
		return ResponseEntity.ok(estudios);
	}


	/**
	 * Controlador para manejar solicitudes POST y obtener estudios geofísicos filtrados por campos específicos.
	 *
	 * @param filtro Objeto que contiene los parámetros de filtrado:
	 *               - Consulta múltiple: Trae los estudios que coincidan con cualquiera de los atributos nombreEstudio, nombreCliente y ubicacionEstudio.
	 *               - Fecha de inicio y fin: Trae todos los estudios geofísicos realizados en un período de tiempo específico.
	 *               - Tipo de estudio: Trae los estudios que coinciden con un tipo específico de estudio.
	 *               - Área de estudio: Trae los estudios que coinciden con un área específica de estudio.
	 * @return ResponseEntity con un conjunto de proyecciones de estudios geofísicos y el código de estado HTTP.
	 *         Si no existen estudios geofísicos que coincidan con los criterios de filtrado, se retorna una respuesta HTTP con estado 204 NO CONTENT.
	 * @throws BadRequestException si ocurre un error en la conversión de datos de las fechas, tipoEstudio y areaEstudio.
	 */
	@PostMapping
	public ResponseEntity<Set<EstudioGeofisicoProjection>> filterEstudios(@RequestBody FiltroEstudioGeofisico filtro) {
		try {
			// Obtiene los estudios geofísicos filtrados utilizando el servicio estudioGeofisicoService.
			Set<EstudioGeofisicoProjection> estudios = estudioGeofisicoService.filterEstudios(filtro);

			// Verifica si el conjunto de estudios geofísicos está vacío.
			if (CollectionUtils.isEmpty(estudios)) {
				return ResponseEntity.noContent().build();
			}

			// Devuelve una respuesta HTTP con el conjunto de estudios geofísicos y el código de estado OK (200).
			return ResponseEntity.ok(estudios);
		} catch (ParseException e) {
			throw new BadRequestException("Error en la conversión de datos: " + e.getMessage());
		}
	}

	/**
	 * Obtiene registros de estudios geofísicos con paginación y ordenamiento según los criterios especificados en el filtro.
	 *
	 * @param filtro Objeto que contiene los parámetros de filtrado, paginación y ordenamiento:
	 *               - page: Número de página que se desea obtener (predeterminado: 0).
	 *               - size: Tamaño de la página, es decir, número de registros por página (predeterminado: 10).
	 *               - sort: Campo por el cual se desea ordenar los registros (predeterminado: "id").
	 *               - direction: Dirección del ordenamiento ("asc" para ascendente, "desc" para descendente; predeterminado: "asc").
	 *               - consultaMultiple: Cadena de texto para buscar coincidencias en los campos nombreEstudio, nombreCliente y ubicacionEstudio.
	 *               - fechaInicio: Fecha de inicio del rango de fechas en el que se realizó el estudio geofísico.
	 *               - fechaFin: Fecha de fin del rango de fechas en el que se realizó el estudio geofísico.
	 *               - tipoEstudio: Enumerador del tipo de estudio geofísico.
	 *               - areaEstudio: Enumerador del área de aplicación del estudio geofísico.
	 *
	 * @return ResponseEntity que contiene un objeto Page con los registros de estudios geofísicos y el estado HTTP.
	 *
	 * @throws IllegalArgumentException Si los parámetros proporcionados no son válidos.
	 * @throws ParseException Si hay un error al parsear las fechas.
	 */
	@PostMapping("/registros")
	public ResponseEntity<?> obtenerRegistrosEstudio(@RequestBody FiltroEstudioGeofisicoPageable filtro){
		try {
			Page<EstudioGeofisicoProjection> registros = estudioGeofisicoService.obtenerRegistrosEstudio(filtro);
			return new ResponseEntity<>(registros, HttpStatus.OK);
		} catch (IllegalArgumentException | ParseException ex) {
			throw new IllegalArgumentException("Error los parámetros para obtener los registros: " + ex.getMessage());
		}
	}


	/**
	 * Controlador para manejar solicitudes GET y obtener un estudio geofísico por su ID.
	 *
	 * @param id El ID del estudio geofísico.
	 * @return ResponseEntity con el estudio geofísico y el código de estado HTTP.
	 * @throws EstudioNotFoundException si no se encuentra el estudio geofísico con el ID proporcionado.
	 */
	@GetMapping("/{id}")
	public ResponseEntity<EstudioGeofisico> findById(@PathVariable Long id) {
		Optional<EstudioGeofisico> estudioGeofisicoOptional = estudioGeofisicoService.findById(id);

		if (!estudioGeofisicoOptional.isPresent()) {
			throw new EstudioNotFoundException(id);
		}

		EstudioGeofisico estudioGeofisico = estudioGeofisicoOptional.get();
		updateUrls(Collections.singletonList(estudioGeofisico));

		return ResponseEntity.ok(estudioGeofisico);
	}


	/**
	 * Controlador para manejar solicitudes DELETE y eliminar un estudio geofísico por su ID.
	 *
	 * @param id El ID del estudio geofísico.
	 * @return ResponseEntity con el código de estado HTTP.
	 * @throws EstudioNotFoundException si no se encuentra el estudio geofísico con el ID proporcionado.
	 */
	@DeleteMapping("/{id}")
	public ResponseEntity<?> delete(@PathVariable Long id) {
		Optional<EstudioGeofisico> estudioGeofisicoOptional = estudioGeofisicoService.findById(id);

		if (!estudioGeofisicoOptional.isPresent()) {
			throw new EstudioNotFoundException(id);
		}

		estudioGeofisicoService.deleteById(id);
		deleteResourcesAsync(estudioGeofisicoOptional.get());

		return ResponseEntity.noContent().build();
	}


	/**
	 * Controlador para manejar solicitudes POST y guardar un estudio geofísico en la base de datos.
	 *
	 * @param estudioGeofisico El estudio geofísico a guardar.
	 * @param result Objeto que contiene los resultados de la validación del estudio geofísico.
	 * @return ResponseEntity con el estudio geofísico guardado y el código de estado HTTP.
	 * @throws ValidationException si no pasan las validaciones de alguno de los campos del estudio geofísico.
	 */
	@PostMapping("/form")
	public ResponseEntity<?> create(@Valid @RequestBody EstudioGeofisico estudioGeofisico, BindingResult result) {
		if (result.hasErrors()) {
			List<String> errors = result.getFieldErrors().stream()
					.map(err -> "El campo '" + err.getField() + "' " + err.getDefaultMessage())
					.collect(Collectors.toList());

			throw new ValidationException("Error en la validación del estudio recibido", errors);
		}

		EstudioGeofisico estudioGeofisicoNew = estudioGeofisicoService.save(estudioGeofisico);
		updateUrls(Collections.singletonList(estudioGeofisicoNew));

		Map<String, Object> response = new HashMap<>();
		response.put("status", HttpStatus.CREATED.value());
		response.put("message", "El estudio geofísico ha sido creado con éxito!");
		response.put("result", estudioGeofisicoNew);

		return new ResponseEntity<>(response, HttpStatus.CREATED);
	}



	/**
	 * Controlador para manejar solicitudes PUT y actualizar un estudio geofísico en la base de datos.
	 *
	 * @param estudioGeofisico El estudio geofísico actualizado.
	 * @param id El ID del estudio geofísico a actualizar.
	 * @param result Objeto que contiene los resultados de la validación del estudio geofísico.
	 * @return ResponseEntity con el estudio geofísico actualizado y el código de estado HTTP.
	 * @throws ValidationException si no pasan las validaciones de alguno de los campos del estudio geofísico.
	 * @throws EstudioNotFoundException si no se encuentra el estudio geofísico con el ID proporcionado.
	 */
	@PutMapping("/form/{id}")
	public ResponseEntity<?> update(@Valid @RequestBody EstudioGeofisico estudioGeofisico, @PathVariable Long id, BindingResult result) {
		if (result.hasErrors()) {
			List<String> errors = result.getFieldErrors().stream()
					.map(err -> "El campo '" + err.getField() + "' :  " + err.getDefaultMessage())
					.collect(Collectors.toList());

			throw new ValidationException("Error en la validación del estudio recibido", errors);
		}

		Optional<EstudioGeofisico> estudioGeofisicoOptional = estudioGeofisicoService.findById(id);

		if (!estudioGeofisicoOptional.isPresent()) {
			throw new EstudioNotFoundException(id);
		}

		EstudioGeofisico estudioGeofisicoActual = estudioGeofisicoOptional.get();


		// Actualiza los atributos del estudio geofísico con los valores proporcionados
		estudioGeofisicoActual.setNombreEstudio(estudioGeofisico.getNombreEstudio());
		estudioGeofisicoActual.setFechaRealizado(estudioGeofisico.getFechaRealizado());
		estudioGeofisicoActual.setDescripcion(estudioGeofisico.getDescripcion());
		estudioGeofisicoActual.setNombreCliente(estudioGeofisico.getNombreCliente());
		estudioGeofisicoActual.clearAreasEstudio();
		estudioGeofisicoActual.addAreasEstudio(estudioGeofisico.getAreasEstudio());
		estudioGeofisicoActual.clearTiposEstudio();
		estudioGeofisicoActual.addTiposEstudio(estudioGeofisico.getTiposEstudio());
		estudioGeofisicoActual.clearCoordenadas();
		estudioGeofisicoActual.addCoordenadas(estudioGeofisico.getCoordenadas());
		estudioGeofisicoActual.clearImagenes();
		estudioGeofisicoActual.addImagenes(estudioGeofisico.getImagenes());
		estudioGeofisicoActual.clearArchivosAdjuntos();
		estudioGeofisicoActual.addArchivosAdjuntos(estudioGeofisico.getArchivosAdjuntos());

		// Actualiza los campos de auditoría
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		String currentPrincipalName = authentication.getName();
		estudioGeofisicoActual.setUltimaActualizacionPor(currentPrincipalName);
		estudioGeofisicoActual.setFechaModificacion(new Date());

		EstudioGeofisico estudioGeofisicoUpdate = estudioGeofisicoService.save(estudioGeofisicoActual);

		Map<String, Object> response = new HashMap<>();
		response.put("status", HttpStatus.OK.value());
		response.put("message", "El estudio geofísico ha sido actualizado con éxito!");
		response.put("result", estudioGeofisicoUpdate);

		return ResponseEntity.ok().body(response);
	}


	/**
	 * Controlador para manejar solicitudes GET y obtener el listado de los enumeradores del tipo de estudio geofísico.
	 *
	 * @return ResponseEntity con el listado de enumeradores del tipo de estudio geofísico y el código de estado HTTP.
	 */
	@GetMapping("/enums/tipo-estudio")
	public ResponseEntity<EnumTipoEstudioGeofisico[]> getTipoEstudioOptions() {
		return ResponseEntity.ok(EnumTipoEstudioGeofisico.values());
	}

	/**
	 * Controlador para manejar solicitudes GET y obtener el listado de los enumeradores del área de aplicación de estudio geofísico.
	 *
	 * @return ResponseEntity con el listado de enumeradores del área de aplicación de estudio geofísico y el código de estado HTTP.
	 */
	@GetMapping("/enums/area-estudio")
	public ResponseEntity<EnumAreaAplicacionEstudioGeofisico[]> getAreaEstudioOptions() {
		return ResponseEntity.ok(EnumAreaAplicacionEstudioGeofisico.values());
	}



	/**
	 * Método privado para actualizar las URLs de los archivos e imágenes asociados a los estudios geofísicos.
	 *
	 * @param estudios Lista de estudios geofísicos a actualizar.
	 */
	private void updateUrls(List<EstudioGeofisico> estudios) {
		estudios.forEach(estudio -> {
			Optional.ofNullable(estudio.getImagenes()).orElse(Collections.emptyList()).forEach(imagen -> {
				Optional.ofNullable(imagen.getImagenKey()).ifPresent(key -> imagen.setImagenUrl(s3Service.getObjectUrl(key)));
			});

			Optional.ofNullable(estudio.getArchivosAdjuntos()).orElse(Collections.emptyList()).forEach(archivo -> {
				Optional.ofNullable(archivo.getArchivoKey()).ifPresent(key -> archivo.setArchivoUrl(s3Service.getObjectUrl(key)));
			});
		});
	}



	/**
	 * Método privado para eliminar los recursos de Amazon S3 asociados a un estudio geofísico.
	 *
	 * @param estudio El estudio geofísico cuyos recursos se van a eliminar.
	 */
	private void deleteResourcesAmazonS3(EstudioGeofisico estudio) {
		Optional.ofNullable(estudio.getImagenes()).orElse(Collections.emptyList()).forEach(imagen -> {
			Optional.ofNullable(imagen.getImagenKey()).ifPresent(s3Service::deleteObject);
		});

		Optional.ofNullable(estudio.getArchivosAdjuntos()).orElse(Collections.emptyList()).forEach(archivo -> {
			Optional.ofNullable(archivo.getArchivoKey()).ifPresent(s3Service::deleteObject);
		});
	}


	/**
	 * Método asíncrono privado para eliminar los recursos de Amazon S3 asociados a un estudio geofísico.
	 *
	 * @param estudio El estudio geofísico cuyos recursos se van a eliminar.
	 */
	@Async
	void deleteResourcesAsync(EstudioGeofisico estudio) {
		Optional.ofNullable(estudio.getImagenes()).orElse(Collections.emptyList()).forEach(imagen -> {
			Optional.ofNullable(imagen.getImagenKey()).ifPresent(s3Service::deleteObject);
		});

		Optional.ofNullable(estudio.getArchivosAdjuntos()).orElse(Collections.emptyList()).forEach(archivo -> {
			Optional.ofNullable(archivo.getArchivoKey()).ifPresent(s3Service::deleteObject);
		});
	}

	
}
