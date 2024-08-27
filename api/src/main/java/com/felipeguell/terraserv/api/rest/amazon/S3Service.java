package com.felipeguell.terraserv.api.rest.amazon;

import java.io.IOException;
import java.net.URL;
import java.util.*;

import com.amazonaws.HttpMethod;
import com.amazonaws.services.s3.model.*;
import com.felipeguell.terraserv.api.rest.util.AmazonWebServicesUtils;
import org.apache.commons.io.FilenameUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.util.IOUtils;
import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.AssetNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class S3Service{

	// Cliente de Amazon S3 para interactuar con el servicio.
	private final AmazonS3 s3Client;

	/**
	 * Este método se utiliza para subir un archivo a Amazon S3.
	 * @param multipartFile El archivo que se va a subir.
	 * @return La clave única del archivo en Amazon S3.
	 * @throws IOException Si ocurre un error durante la subida del archivo.
	 */
	public String putObject(MultipartFile multipartFile) throws IOException {

		// Verifica si el archivo está vacío.
		if (multipartFile.isEmpty()) {
			throw new IllegalArgumentException("El archivo está vacío");
		}

		// Obtiene la extensión del archivo original.
		String extension = FilenameUtils.getExtension(multipartFile.getOriginalFilename());

		// Crea una clave única usando UUID y la extensión del archivo.
		String key = String.format ("%s.%s", UUID.randomUUID(), extension);

		// Crea metadatos para el objeto S3.
		ObjectMetadata objectMetadata = new ObjectMetadata();
		objectMetadata.setContentType(multipartFile.getContentType());
		objectMetadata.setContentLength(multipartFile.getSize());

		try {
			// Crea una solicitud para subir el objeto a S3.
			PutObjectRequest putObjectRequest = new PutObjectRequest(AmazonWebServicesUtils.BUCKET, key, multipartFile.getInputStream(),
					objectMetadata);

			// Sube el objeto a S3.
			s3Client.putObject(putObjectRequest);

			// Devuelve la clave del objeto.
			return key;

		} catch (IOException ex) {
			// Lanza una excepción si ocurre un error durante la subida del archivo.
			throw new IOException("Error al subir el archivo: " + ex.getMessage());
		}
	}

	/**
	 * Servicio para interactuar con Amazon S3 y recuperar objetos almacenados.
	 *
	 * Este método se encarga de obtener un objeto específico de Amazon S3 utilizando su clave única.
	 * Verifica la existencia del objeto en el BUCKET y, si está presente, recupera su contenido y metadatos.
	 *
	 * @param key La clave única asociada al objeto en Amazon S3 que se desea recuperar.
	 * @return Un objeto File que contiene el contenido del objeto S3 y su tipo de contenido.
	 * @throws IOException Si ocurre un error al leer el contenido del objeto o si el objeto no existe.
	 * @throws AssetNotFoundException Si el objeto con la clave proporcionada no se encuentra en el BUCKET.
	 */
	public File getObject(String key) throws IOException {
		try {
			S3Object s3Object = null;

			// Verifica si el objeto existe en el BUCKET de S3.
			if(s3Client.doesObjectExist(AmazonWebServicesUtils.BUCKET, key)) {
				// Intenta obtener el objeto desde S3.
				s3Object = s3Client.getObject(AmazonWebServicesUtils.BUCKET, key);
			} else {
				// Lanza una excepción si el objeto no se encuentra.
				throw new AssetNotFoundException(key);
			}

			// Obtiene los metadatos del objeto.
			ObjectMetadata metadata = s3Object.getObjectMetadata();

			// Lee el contenido del objeto y lo convierte en un arreglo de bytes.
			S3ObjectInputStream inputStream = s3Object.getObjectContent();
			byte[] bytes = IOUtils.toByteArray(inputStream);

			// Crea y devuelve un nuevo objeto File con el contenido y el tipo de contenido del objeto S3.
			return new File(bytes, metadata.getContentType());

		} catch (IOException ex) {
			// Lanza una excepción si ocurre un error al crear el archivo.
			throw new IOException("Error al obtener el objeto: " + ex.getMessage());
		}
	}

	/**
	 * Genera una URL firmada para un objeto específico almacenado en Amazon S3.
	 * Esta URL permite el acceso seguro y temporal al objeto para los usuarios autorizados.
	 *
	 * @param key La clave única que identifica el objeto en el bucket de Amazon S3.
	 * @return Una cadena que representa la URL firmada que permite el acceso al objeto.
	 * @throws AssetNotFoundException Si el objeto con la clave especificada no existe en el bucket.
	 */
	public String getObjectUrl(String key) throws AssetNotFoundException {
		// Verifica si el objeto existe en el bucket.
		if (!s3Client.doesObjectExist(AmazonWebServicesUtils.BUCKET, key)) {
			// Si el objeto no existe, lanza una excepción.
			throw new AssetNotFoundException("El objeto con la clave " + key + " no se encuentra en el bucket " + AmazonWebServicesUtils.BUCKET);
		}

		// Crea una solicitud para generar una URL firmada con una duración específica.
		GeneratePresignedUrlRequest generatePresignedUrlRequest = new GeneratePresignedUrlRequest(AmazonWebServicesUtils.BUCKET, key)
				.withMethod(HttpMethod.GET) // Método HTTP para acceder al objeto.
				.withExpiration(new Date(System.currentTimeMillis() + 3600000)); // Establece la expiración de la URL en 1 hora.

		// Genera la URL firmada.
		URL signedUrl = s3Client.generatePresignedUrl(generatePresignedUrlRequest);

		// Devuelve la URL firmada como una cadena.
		return signedUrl.toString();
	}

	/**
	 * Genera URLs firmadas para una lista de objetos almacenados en Amazon S3.
	 * Cada URL firmada proporciona un acceso seguro y temporal a un objeto específico para los usuarios autorizados.
	 *
	 * @param keys Una lista de claves únicas que identifican los objetos en el bucket de Amazon S3.
	 * @return Un mapa que asocia cada clave con su URL firmada correspondiente.
	 *         Cada URL firmada permite el acceso al objeto correspondiente.
	 * @throws AssetNotFoundException Si alguno de los objetos con las claves especificadas no existe en el bucket.
	 */
	public Map<String, String> getObjectsUrl(List<String> keys) throws AssetNotFoundException {
		Map<String, String> presignedUrlMap = new HashMap<>();

		for (String key : keys) {
			if (!s3Client.doesObjectExist(AmazonWebServicesUtils.BUCKET, key)) {
				// Si el objeto no existe, lanza una excepción.
				throw new AssetNotFoundException("El objeto con la clave " + key + " no se encuentra en el bucket " + AmazonWebServicesUtils.BUCKET);
			}

			// Genera una URL firmada para el objeto y la agrega al mapa.
			String presignedUrl = generatePresignedUrl(key);
			presignedUrlMap.put(key, presignedUrl);
		}

		// Devuelve el mapa de URLs firmadas.
		return presignedUrlMap;
	}

	/**
	 * Servicio para interactuar con Amazon S3 y eliminar objetos almacenados.
	 *
	 * Este método elimina un objeto específico de Amazon S3 utilizando su clave única.
	 * Verifica la existencia del objeto en el BUCKET y, si está presente, procede a eliminarlo.
	 *
	 * @param key La clave única asociada al objeto en Amazon S3 que se desea eliminar.
	 * @throws AssetNotFoundException Si el objeto con la clave proporcionada no se encuentra en el BUCKET.
	 */
	public void deleteObject(String key){
		if (s3Client.doesObjectExist(AmazonWebServicesUtils.BUCKET, key)) {
			s3Client.deleteObject(AmazonWebServicesUtils.BUCKET, key); // Elimina el objeto si existe.
		} else {
			throw new AssetNotFoundException(key); // Lanza una excepción si el objeto no se encuentra.
		}
	}

	/**
	 * Este método genera una URL firmada para un objeto específico en Amazon S3.
	 * @param key La clave única del objeto en Amazon S3.
	 * @return La URL firmada del objeto.
	 */
	public String generatePresignedUrl(String key) {
		// Crea una solicitud para generar una URL firmada.
		GeneratePresignedUrlRequest generatePresignedUrlRequest =
				new GeneratePresignedUrlRequest(AmazonWebServicesUtils.BUCKET, key);

		// Establece la fecha de vencimiento de la URL firmada.
		generatePresignedUrlRequest.setExpiration(new Date(System.currentTimeMillis() + 3600000));  // La URL expirará en 1 hora.

		// Genera la URL firmada.
		URL url = s3Client.generatePresignedUrl(generatePresignedUrlRequest);

		// Devuelve la URL firmada como una cadena.
		return url.toString();
	}

}
