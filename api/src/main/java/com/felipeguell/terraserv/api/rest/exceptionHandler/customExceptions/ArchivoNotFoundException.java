package com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions;

public class ArchivoNotFoundException extends RuntimeException{

	private static final long serialVersionUID = -8992645297038896201L;

	public ArchivoNotFoundException(String message) {
        super(message);
    }

    public ArchivoNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }
}
