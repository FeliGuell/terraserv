package com.felipeguell.terraserv.api.rest.jwt;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class JwtAuthenticationFilter extends OncePerRequestFilter{

	/**
	 * Resuelve las excepciones que pueden ocurrir durante el procesamiento de una solicitud HTTP.
	 */
	private HandlerExceptionResolver exceptionResolver;

	/**
	 * Servicio para la manipulación de tokens JWT. Se utiliza para validar y extraer información de los tokens.
	 */
	@Autowired
	private JwtService jwtService;

	/**
	 * Servicio para cargar detalles de usuario. Se utiliza para obtener detalles de usuario a partir de un nombre de usuario.
	 */
	@Autowired
	private UserDetailsService userDetailsService;

	/**
	 * Constructor para la clase JwtAuthenticationFilter.
	 *
	 * @param exceptionResolver Resuelve las excepciones que pueden ocurrir durante el procesamiento de una solicitud HTTP.
	 */
	public JwtAuthenticationFilter(HandlerExceptionResolver exceptionResolver) {
		this.exceptionResolver = exceptionResolver;
	}



	/**
	 * Método que realiza la autenticación basada en token JWT.
	 *
	 * @param request La solicitud HTTP entrante.
	 * @param response La respuesta HTTP saliente.
	 * @param filterChain La cadena de filtros de seguridad.
	 * @throws ServletException Si ocurre un error al procesar la solicitud.
	 * @throws IOException Si ocurre un error de entrada/salida.
	 */
	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
			throws ServletException, IOException {

		String token = getTokenFromRequest(request);

		try {
			if (token != null) {
				String username = jwtService.getUsernameFromToken(token);

				if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
					UserDetails userDetails = userDetailsService.loadUserByUsername(username);

					if (jwtService.isTokenValid(token, userDetails)) {
						UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
								userDetails,
								null,
								userDetails.getAuthorities());

						authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

						SecurityContextHolder.getContext().setAuthentication(authToken);
					}
				}
			}

			filterChain.doFilter(request, response);
		} catch (Exception ex) {
			exceptionResolver.resolveException(request, response, null, ex);
		}
	}


	/**
	 * Extrae el token de autenticación de la cabecera de la solicitud HTTP.
	 *
	 * @param request La solicitud HTTP de la que se extraerá el token.
	 * @return El token de autenticación, o null si la cabecera de autorización no está presente o no contiene un token Bearer.
	 */
	private String getTokenFromRequest(HttpServletRequest request) {
		String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

		if (StringUtils.hasText(authHeader) && authHeader.startsWith("Bearer ")) {
			return authHeader.substring(7);
		}

		return null;
	}

	

}
