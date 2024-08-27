package com.felipeguell.terraserv.api.rest.jwt;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import javax.crypto.SecretKey;

import com.felipeguell.terraserv.api.rest.util.JwtUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {


	/**
	 * Genera un token JWT para un usuario, incluyendo roles como reclamaciones adicionales.
	 * Este token permite la autenticación y autorización seguras en la aplicación.
	 *
	 * @param usuario UserDetails que contiene la información del usuario autenticado.
	 * @return Un String que representa el token JWT generado con las reclamaciones adicionales.
	 */
	public String getToken(UserDetails usuario) {
		// Crea un mapa para almacenar las reclamaciones adicionales.
		Map<String, Object> extraClaims = new HashMap<>();
		// Agrega el rol del usuario al mapa de reclamaciones.
		extraClaims.put("role", usuario.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.collect(Collectors.toList()));

		// Construye y devuelve el token JWT con las reclamaciones adicionales,
		// el nombre de usuario como sujeto, la fecha de emisión actual,
		// y una fecha de expiración establecida para 2 días a partir de ahora.
		return Jwts.builder()
				.setClaims(extraClaims)
				.setSubject(usuario.getUsername())
				.setIssuedAt(new Date())
				.setExpiration(Date.from(Instant.now().plus(Duration.ofDays(2))))
				.signWith(getKey())
				.compact();
	}

	
	/**
	 * Obtiene la clave secreta a partir del valor de cadena codificado en base64.
	 * @return Clave secreta.
	 */
	private SecretKey getKey() {
		byte[] keyBytes = Decoders.BASE64.decode(JwtUtils.SECRET);
		return Keys.hmacShaKeyFor(keyBytes);
	}
	
	/**
	 * Obtiene el nombre de usuario desde un token JWT.
	 * @param token Token JWT.
	 * @return Nombre de usuario extraído del token.
	 */
	public String getUsernameFromToken(String token) {
		return getClaim(token, Claims::getSubject);
	}

	/**
	 * Verifica si un token JWT es válido para los detalles del usuario proporcionados.
	 * @param token Token JWT a verificar.
	 * @param userDetails Detalles del usuario para la verificación.
	 * @return `true` si el token es válido, `false` de lo contrario.
	 */
	public boolean isTokenValid(String token, UserDetails userDetails) {
		final String username = getUsernameFromToken(token);
		return (username.equals(userDetails.getUsername()) &&
				!isTokenExpired(token));
	}
	
	/**
	 * Obtiene todas las reclamaciones de un token JWT.
	 * @param token Token JWT.
	 * @return Objeto Claims que contiene todas las reclamaciones.
	 */
	private Claims getAllClaims(String token) {
			return Jwts
					.parser()
					.verifyWith(getKey())
					.build()
					.parseSignedClaims(token)
					.getPayload();
	}
	
	/**
	 * Obtiene una reclamación específica de un token JWT.
	 * @param token Token JWT.
	 * @param claimsResolver Función que resuelve la reclamación deseada.
	 * @return Valor de la reclamación solicitada.
	 */
	public <T> T getClaim(String token, Function<Claims, T> claimsResolver) {
		final Claims claims = getAllClaims(token);
		return claimsResolver.apply(claims);
	}
	
	/**
	 * Obtiene la fecha de vencimiento de un token JWT.
	 * @param token Token JWT.
	 * @return Fecha de vencimiento del token.
	 */
	private Date getExpiration(String token) {
		return getClaim(token, Claims::getExpiration);
	}
	
	/**
	 * Verifica si un token JWT ha expirado.
	 * @param token Token JWT.
	 * @return `true` si el token ha expirado, `false` de lo contrario.
	 */
	private boolean isTokenExpired(String token) {
		return getExpiration(token).before(new Date());
	}
}

