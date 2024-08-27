package com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions;

public class BadRequestException extends RuntimeException{
	
	private static final long serialVersionUID = -7476833737402424184L;

	public BadRequestException(String message) {
        super(message);
    }

    public BadRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}
