package com.felipeguell.terraserv.api.rest.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Clase de configuración que implementa la interfaz WebMvcConfigurer.
 * Esta clase se utiliza para configurar las políticas de CORS (Cross-Origin Resource Sharing) en la aplicación.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    /**
     * Método que se utiliza para agregar mapeos de CORS a un objeto de tipo CorsRegistry.
     * Este método se invoca durante la inicialización de la aplicación.
     *
     * @param registry Objeto de tipo CorsRegistry al que se añadirán los mapeos de CORS.
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Añade un mapeo de CORS para todas las rutas (/**) de la aplicación.
        registry.addMapping("/**")
                // Permite las solicitudes de origen desde http://localhost:4200.
                .allowedOrigins("http://localhost:4200")
                // Permite los métodos de solicitud GET, POST, PUT, OPTIONS y DELETE.
                .allowedMethods("GET", "POST", "PUT", "OPTIONS", "DELETE")
                // Permite todos los encabezados de solicitud.
                .allowedHeaders("*");
    }
}

