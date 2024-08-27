package com.felipeguell.terraserv.api.rest.exceptionHandler;


import java.io.IOException;
import java.text.ParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.felipeguell.terraserv.api.rest.auth.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.ArchivoNotFoundException;
import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.AssetNotFoundException;
import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.BadRequestException;
import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.EstudioNotFoundException;
import com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions.ValidationException;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;


@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(RuntimeException.class)
	public ProblemDetail handleRuntimeException(RuntimeException ex){
		ProblemDetail errorDetail = null;
	    
		
		// Maneja excepciones de tipo BadRequestException. Responde con un código
		// de estado 400 (Bad Request) y el mensaje de la excepción.
		if(ex instanceof BadRequestException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(400), ex.getMessage());
		}
		
		// Maneja excepciones de tipo IllegalArgumentException. Responde con un código
		// de estado 400 (Bad Request) y el mensaje de la excepción.
		if(ex instanceof IllegalArgumentException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(400), ex.getMessage());
		}

		// Personalización HttpMessageNotReadableException. Maneja la excepción en el
		// caso de que se encuentre un error de deserialización JSON
		if(ex instanceof HttpMessageNotReadableException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(400), ex.getMessage());
		}

		//Maneja excepciones del tipo ValidationException. Responde con un código de
		//estado 400(Bad Request) y el mensaje de la excepción
		if(ex instanceof ValidationException ) {
			ValidationException validationEx = (ValidationException) ex;
			Map<String, Object> map = new HashMap<>();
			List<Object> errors = new ArrayList<>();
			validationEx.getErrors().forEach(errors::add);
			map.put("errors", errors);
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(400), ex.getMessage());
			errorDetail.setProperties(map);
		}
		
		// Verifica si la excepción es de tipo UsernameNotFoundException (Usuario no encontrado)
		if(ex instanceof UsernameNotFoundException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(401), ex.getMessage());
			errorDetail.setProperty("access_denied_reason", "Usuario no encontrado");
		}
		
		// Verifica si la excepción es de tipo BadCredentialsException (Error en credenciales)
		if(ex instanceof BadCredentialsException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(401), ex.getMessage());
			 // Agrega una propiedad adicional para indicar la razón del acceso denegado
			errorDetail.setProperty("access_denied_reason", "Error en el usuario o contraseña");
		}
		

		 // Verifica si la excepción es de tipo AccessDeniedException (Acceso no autorizado)
		if(ex instanceof AccessDeniedException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(403), ex.getMessage());
			// Agrega una propiedad adicional para indicar la razón del acceso denegado
			errorDetail.setProperty("access_denied_reason", "No autorizado!");
		}
		
		 // Verifica si la excepción es de tipo SignatureException (Firma JWT no válida)
		if(ex instanceof SignatureException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(403), ex.getMessage());
			// Agrega una propiedad adicional para indicar la razón del acceso denegado
			errorDetail.setProperty("access_denied_reason", "Firma JWT no válida");
		}
		
		 // Verifica si la excepción es de tipo MalformedJwtException (Firma JWT mal formada)
		if(ex instanceof MalformedJwtException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(403), ex.getMessage());
			// Agrega una propiedad adicional para indicar la razón del acceso denegado
			errorDetail.setProperty("access_denied_reason", "Firma JWT no válida");
		}
		
		 // Verifica si la excepción es de tipo ExpiredJwtException (JWT caducado)
		if(ex instanceof ExpiredJwtException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(403), ex.getMessage());
			// Agrega una propiedad adicional para indicar la razón del acceso denegado
			errorDetail.setProperty("access_denied_reason", "Sesión caducada");
		}
		
		// Maneja excepciones del tipo EstudioNotFoundException. Responde con un código de
		// estado 404(Not Found) y el mensaje de la excepción
		if(ex instanceof EstudioNotFoundException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(404), ex.getMessage());
		}
		
		// Maneja excepciones del tipo AssetNotFoundException. Responde con un código de
		// estado 404(Not Found) y el mensaje de la excepción
		if(ex instanceof AssetNotFoundException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(404), ex.getMessage());
		}
		
		// Maneja excepciones del tipo ArchivoNotFoundException. Responde con un código de
		// estado 404(Not Found) y el mensaje de la excepción
		if(ex instanceof ArchivoNotFoundException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(404), ex.getMessage());
		}
		

		// Maneja excepciones de tipo DataAccessException. Responde con un código de
		// estado 500 (Internal Server Error) y el mensaje de la excepción.
		if(ex instanceof DataAccessException) {
			errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(500), ex.getMessage());
		}
		
		return errorDetail;
	}


	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ProblemDetail handleValidationException(MethodArgumentNotValidException  ex) {
		Map<String, Object> map = new HashMap<>();
		// Obtener todos los errores
		List<String> errors = ex.getBindingResult()
			.getFieldErrors()
			.stream()
			.map(err -> "El campo '" + err.getField() + "' : " + err.getDefaultMessage())
			.collect(Collectors.toList());
		map.put("errors", errors);
		ProblemDetail errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(400), "Error al actualizar el estudio geofísico en la base de datos");
		errorDetail.setProperties(map);
		return errorDetail;
	}


	/**
	 * Maneja excepciones de tipo ParseException. Responde con un estado 400
	 * @param ex
	 * @return
	 */
	@ExceptionHandler(ParseException.class)
    public ProblemDetail handleParseException(ParseException ex) {
        ProblemDetail errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(400), ex.getMessage());
        return errorDetail;
    }
	
	/**
	 *  Maneja la excepción de tipo IOException.  Responde con un estado 500
	 * @param ex
	 * @return
	 */
	@ExceptionHandler(IOException.class)
    public ProblemDetail handleIOException(IOException ex) {
        ProblemDetail errorDetail = ProblemDetail.forStatusAndDetail(HttpStatusCode.valueOf(500), ex.getMessage());
        return errorDetail;
    }
	
	
	
	
}
