package com.felipeguell.terraserv.api.rest.config;

import com.felipeguell.terraserv.api.rest.auth.AuthService;
import com.felipeguell.terraserv.api.rest.auth.RegisterRequest;
import com.felipeguell.terraserv.api.rest.models.enumeration.Role;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Clase de configuración para crear un usuario en el caso de que no exista ninguno
 */
@Configuration
public class InitUsersConfig {

    @Autowired
    private AuthService authService;

    @Bean
    public CommandLineRunner initAdminUsers() {
        return args -> {
            RegisterRequest user1 = new RegisterRequest("username", "123456");

            // Comprueba si los usuarios ya existen antes de intentar crearlos
            if (!authService.existsByUsername(user1.getUsername())) {
                authService.registerWithRole(user1, Role.ADMIN);
            }
        };
    }
}
