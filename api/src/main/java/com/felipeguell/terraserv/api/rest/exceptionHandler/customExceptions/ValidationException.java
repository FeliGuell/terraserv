package com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions;

import java.util.List;

public class ValidationException  extends RuntimeException {

	private static final long serialVersionUID = 1634854245959989051L;
	private final List<String> errors;

    public ValidationException(String message, List<String> errors) {
        super(message);
        this.errors = errors;
    }

    public List<String> getErrors() {
        return errors;
    }
}