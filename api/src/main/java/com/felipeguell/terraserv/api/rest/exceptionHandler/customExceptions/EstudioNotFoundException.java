package com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions;

public class EstudioNotFoundException extends RuntimeException{


	public EstudioNotFoundException(Long id) {
        super("No se pudo encontrar el estudio geofísico con ID: " + id);
    }
}
