package com.felipeguell.terraserv.api.rest.config;

import com.felipeguell.terraserv.api.rest.models.enumeration.Role;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.felipeguell.terraserv.api.rest.jwt.JwtAuthenticationFilter;

import lombok.RequiredArgsConstructor;


@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {
	
	private final JwtAuthenticationFilter jwtAuthenticationFilter;
	private final AuthenticationProvider authenticationProvider;

	/*
	 * Este método configura la cadena de filtros de seguridad.
	 */
	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

	/*
	 * Aquí estamos configurando la seguridad HTTP.
	 * Deshabilitamos CSRF, permitimos todas las solicitudes a "/auth/**", requerimos autenticación para todas las demás solicitudes,
	 * establecemos la política de creación de sesiones en STATELESS ya que estamos usando JWT, no necesitamos sesiones,
	 * establecemos el proveedor de autenticación y agregamos el filtro JWT antes del filtro de autenticación de nombre de usuario y contraseña.
	 */
			return http
					.csrf(csrf -> 
						csrf 
						.disable())
					.authorizeHttpRequests(authRequest -> 
							authRequest
									.requestMatchers("/api/**").hasAuthority("ADMIN")
									.requestMatchers("/auth/**").permitAll()
									.anyRequest().authenticated()
								)
					.sessionManagement(sessionManager -> 
							sessionManager
								.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
					.authenticationProvider(authenticationProvider)
					.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
					.build();
		
	}
}
