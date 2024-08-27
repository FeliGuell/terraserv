package com.felipeguell.terraserv.api.rest.amazon;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/assets")
@RequiredArgsConstructor
public class AssetController {

	/**
	 * Este servicio se encarga de la gestión de archivos en Amazon S3.
	 */
	private final S3Service s3Service;

	/**
	 * Este método maneja las solicitudes POST a la ruta "/upload".
	 * Se utiliza para subir uno o más archivos al BUCKET de Amazon S3.
	 *
	 * @param files Una lista de archivos MultipartFile que se van a subir al BUCKET.
	 * @return Una respuesta HTTP con estado 200 (OK) y un cuerpo que contiene detalles de todos los archivos subidos.
	 * Cada archivo se representa con un mapa que contiene su clave (usada para identificar el archivo en S3),
	 * la URL para acceder al archivo, el nombre original del archivo y su tamaño.
	 * @throws IOException Si ocurre un error durante la subida de los archivos.
	 */
	@PostMapping("/upload")
	public ResponseEntity<Map<String, Object>> upload(@RequestParam("files") List<MultipartFile> files) throws IOException {
		Map<String, Object> response = new HashMap<>();
		List<Map<String, Object>> fileDetails = new ArrayList<>();
		Map<String, Object> fileDetail;

		for (MultipartFile file : files) {
			fileDetail = new HashMap<>();
			// Sube el archivo a S3 y obtiene la clave y la URL del archivo subido.
			String key = s3Service.putObject(file);
			String url = s3Service.getObjectUrl(key);
			String fileName = file.getOriginalFilename();
			Long size = file.getSize();

			fileDetail.put("key", key);
			fileDetail.put("url", url);
			fileDetail.put("fileName", fileName);
			fileDetail.put("size", size);

			// Agrega los detalles del archivo al mapa.
			fileDetails.add(fileDetail);
		}

		// Prepara una respuesta exitosa con un mensaje y los detalles de los archivos.
		response.put("message", "Archivos subidos correctamente");
		response.put("files", fileDetails);

		return ResponseEntity.ok().body(response);
	}


	/**
	 * Método para recuperar un archivo específico del BUCKET de Amazon S3.
	 *
	 * Este endpoint maneja las solicitudes GET para obtener un archivo almacenado en Amazon S3.
	 * El cliente debe proporcionar la clave única del archivo que desea recuperar.
	 *
	 * @param key La clave única del archivo en Amazon S3 que se desea obtener.
	 * @return Una ResponseEntity que contiene el ByteArrayResource del archivo solicitado.
	 *         La respuesta incluye cabeceras HTTP con el nombre del archivo, el tipo de contenido y la URL del archivo.
	 *         Si se encuentra el archivo, se devuelve con estado HTTP 200 (OK).
	 * @throws IOException Si ocurre un error al intentar leer el contenido del archivo desde el servicio S3.
	 */
	@GetMapping(value = "/get-object", params = "key")
	public ResponseEntity<ByteArrayResource> getObject(@RequestParam String key) throws IOException {

		// Obtiene el archivo desde el servicio S3 utilizando la clave proporcionada.
		File asset = s3Service.getObject(key);

		// Crea un nuevo ByteArrayResource con el contenido del archivo.
		ByteArrayResource resource = new ByteArrayResource(asset.getContent());

		// Prepara las cabeceras HTTP para incluir información relevante del archivo.
		HttpHeaders httpHeaders = new HttpHeaders();
		httpHeaders.add("File-Name", key);
		httpHeaders.add("Content-Type", asset.getContentType());
		httpHeaders.add("File-Url", s3Service.getObjectUrl(key));

		// Devuelve la respuesta con el archivo y las cabeceras configuradas.
		return ResponseEntity.ok().headers(httpHeaders).contentLength(asset.getContent().length).body(resource);
	}



	/**
	 * Método para obtener las URLs de los archivos almacenados en el BUCKET de Amazon S3.
	 *
	 * Este endpoint maneja las solicitudes POST para recuperar las URLs de una lista de archivos identificados por sus claves.
	 * El cliente debe proporcionar una lista de claves para los archivos que desea obtener.
	 *
	 * @param keys La lista de claves únicas de los archivos en Amazon S3 cuyas URLs se desean recuperar.
	 * @return Una ResponseEntity que contiene un mapa con pares de clave-URL de los archivos.
	 *         Si todas las claves son válidas y los archivos existen, se devuelve con estado HTTP 200 (OK).
	 *         Si alguna de las claves es inválida y el archivo correspondiente no se encuentra, se devuelve un estado HTTP 404 (Not Found).
	 */
	@PostMapping(value = "/get-urls")
	public ResponseEntity<Map<String, String>> getObjectsUrls(@RequestBody List<String> keys) {
		Map<String, String> urlMap = s3Service.getObjectsUrl(keys); // Obtiene las URLs de los archivos desde el servicio S3.
		return ResponseEntity.ok().body(urlMap);
	}

	/**
	 * Método para eliminar un archivo específico del BUCKET de Amazon S3.
	 *
	 * Este endpoint maneja las solicitudes DELETE para eliminar un archivo almacenado en Amazon S3.
	 * El cliente debe proporcionar la clave única del archivo que desea eliminar.
	 *
	 * @param key La clave única del archivo en Amazon S3 que se desea eliminar.
	 * @return Una ResponseEntity sin contenido que indica que el archivo ha sido eliminado con éxito.
	 *         Si el archivo se elimina correctamente, se devuelve con estado HTTP 204 (No Content).
	 *         Si no se encuentra el archivo, se devuelve un estado HTTP 404 (Not Found).
	 */
	@DeleteMapping(value = "/delete-object", params = "key")
	public ResponseEntity<String> deleteObject(@RequestParam String key) {
		s3Service.deleteObject(key); // Elimina el archivo del servicio S3.
		return ResponseEntity.noContent().build();
	}


	/**
	 * Método para compilar varios archivos en un único archivo ZIP y descargarlo.
	 *
	 * Este endpoint maneja las solicitudes POST para crear un archivo ZIP que contiene varios archivos
	 * almacenados en el BUCKET de Amazon S3. Los archivos se identifican por una lista de claves únicas.
	 *
	 * @param keys La lista de claves únicas de los archivos en Amazon S3 que se desean incluir en el archivo ZIP.
	 * @return Una ResponseEntity que contiene el archivo ZIP como un ByteArrayResource.
	 *         Si todos los archivos se encuentran y el archivo ZIP se crea con éxito, se devuelve con estado HTTP 200 (OK).
	 *         Si alguna de las claves es inválida y el archivo correspondiente no se encuentra, se devuelve un estado HTTP 404 (Not Found).
	 *         Si falla la creación del archivo ZIP, se devuelve un estado HTTP 500 (Internal Server Error).
	 * @throws IOException Si ocurre un error al intentar crear el archivo ZIP.
	 */
	@PostMapping(value = "/download-zip")
	public ResponseEntity<?> downloadZip(@RequestBody List<String> keys) throws IOException {
		// Inicializa un ByteArrayOutputStream para almacenar los datos del archivo ZIP.
		ByteArrayOutputStream baos = new ByteArrayOutputStream();

		// Intenta crear un archivo ZIP con los archivos especificados.
		try (ZipOutputStream zipOut = new ZipOutputStream(baos)){
			for (String key : keys) {
				// Obtiene el archivo correspondiente a la clave.
				File asset = s3Service.getObject(key);
				if (asset != null) {
					// Agrega una entrada al archivo ZIP para cada archivo.
					zipOut.putNextEntry(new ZipEntry(key));
					zipOut.write(asset.getContent());
					zipOut.closeEntry();
				}
			}
		}

		// Obtiene los bytes del archivo ZIP creado.
		byte[] zipBytes = baos.toByteArray();

		// Configura las cabeceras HTTP para la descarga del archivo ZIP.
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
		headers.setContentDispositionFormData("attachment", "files.zip");
		headers.setContentLength(zipBytes.length);

		// Devuelve la respuesta con el archivo ZIP.
		return new ResponseEntity<>(zipBytes, headers, HttpStatus.OK);
	}

}
