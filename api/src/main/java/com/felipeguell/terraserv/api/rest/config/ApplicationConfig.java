package com.felipeguell.terraserv.api.rest.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.HandlerExceptionResolver;

import com.felipeguell.terraserv.api.rest.auditor.AuditorAwareImpl;
import com.felipeguell.terraserv.api.rest.jwt.JwtAuthenticationFilter;
import com.felipeguell.terraserv.api.rest.models.dao.IUsuarioDao;

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class ApplicationConfig {

	/**
	 * Inyección de dependencia para el objeto usuarioDao de tipo IUsuarioDao.
	 * Este objeto se utiliza para interactuar con la base de datos de usuarios.
	 */
	@Autowired
	private IUsuarioDao usuarioDao;

	/**
	 * Inyección de dependencia para el objeto exceptionResolver de tipo HandlerExceptionResolver.
	 * Este objeto se utiliza para manejar las excepciones que pueden ocurrir durante la autenticación y autorización.
	 */
	@Autowired
	@Qualifier("handlerExceptionResolver")
	private HandlerExceptionResolver exceptionResolver;

	/**
	 * Método que devuelve un objeto de tipo AuthenticationManager.
	 * Este objeto se utiliza para manejar la autenticación en Spring Security.
	 */
	@Bean
	AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
		return config.getAuthenticationManager();
	}

	/**
	 * Método que devuelve un objeto de tipo AuthenticationProvider.
	 * Este objeto se utiliza para proporcionar la autenticación en Spring Security.
	 */
	@Bean
	AuthenticationProvider authenticationProvider() {
		DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider();
		authenticationProvider.setUserDetailsService(userDetailService());
		authenticationProvider.setPasswordEncoder(passwordEncoder());
		return authenticationProvider;
	}

	/**
	 * Método que devuelve un objeto de tipo PasswordEncoder.
	 * Este objeto se utiliza para codificar las contraseñas de los usuarios.
	 */
	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	/**
	 * Método que devuelve un objeto de tipo UserDetailsService.
	 * Este objeto se utiliza para cargar los detalles de un usuario por su nombre de usuario.
	 */
	@Bean
	UserDetailsService userDetailService() {
		return username -> usuarioDao.findByUsername(username)
			.orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));
	}

	/**
	 * Método que devuelve un objeto de tipo JwtAuthenticationFilter.
	 * Este objeto se utiliza para filtrar las solicitudes y respuestas HTTP y proporcionar la autenticación JWT.
	 */
	@Bean
	JwtAuthenticationFilter jwtAuthenticationFilter() {
		return new JwtAuthenticationFilter(exceptionResolver);
	}

	/**
	 * Método que devuelve un objeto de tipo AuditorAware.
	 * Este objeto se utiliza para proporcionar la información del auditor actualmente autenticado.
	 */
	@Bean
	AuditorAware<String> auditorProvider() {
		return new AuditorAwareImpl();
	}
}
