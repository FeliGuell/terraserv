package com.felipeguell.terraserv.api.rest.exceptionHandler.customExceptions;

public class AssetNotFoundException extends RuntimeException{
	
	private static final long serialVersionUID = 8870897013480588074L;

	public AssetNotFoundException(String key) {
        super("No se pudo encontrar el archivo con key: " + key);
    }
}
