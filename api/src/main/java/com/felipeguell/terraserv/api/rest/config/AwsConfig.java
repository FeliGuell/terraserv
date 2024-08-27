package com.felipeguell.terraserv.api.rest.config;

import com.amazonaws.auth.AWSCredentials;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.regions.Regions;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.AmazonS3ClientBuilder;

/**
 * Clase que proporciona métodos para trabajar con el servicio Amazon S3.
 */
@Configuration
@EnableConfigurationProperties
public class AwsConfig {

    /**
     * Clave de acceso para la autenticación en el servicio Amazon S3.
     * Esta clave se obtiene a partir de una variable de entorno o una propiedad del sistema.
     */
	@Value("${aws.accessKey}")
    private String accessKey;

    /**
     * Clave secreta para la autenticación en el servicio Amazon S3.
     * Esta clave se obtiene a partir de una variable de entorno o una propiedad del sistema.
     */
    @Value("${aws.secretKey}")
    private String secretKey;

    /**
     * Método que devuelve un objeto de tipo AmazonS3.
     * Este objeto se utiliza para interactuar con el servicio Amazon S3.
     */
    @Bean 
    public AmazonS3 amazonS3Client() {

        // Creación de las credenciales de AWS a partir de la clave de acceso y la clave secreta.
    	AWSCredentials awsCredentials = new BasicAWSCredentials(accessKey, secretKey);

        // Construcción y devolución del cliente de Amazon S3.
        return AmazonS3ClientBuilder
                .standard()
                .withCredentials(new AWSStaticCredentialsProvider(awsCredentials))
                .withRegion(Regions.US_EAST_1)
                .build();
    }

}
